import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { GROUP_TITLES, SUBELEMENT_TITLES } from "./catalog";
import { explainQuestion } from "../src/lib/explain";
import { LANE_STEMS } from "../src/lib/lane-stems";
import { LANE_FLIP, groupDefault, labForQuestion, laneFor } from "../src/lib/lanes";
import { ERRATA_STEMS, EXPECTED_FIGURES, MIRROR_COMMIT, WITHDRAWN } from "../src/lib/pool-facts";
import type { LicenseClass, PoolFile, PoolQuestion, PoolRegistry } from "../src/lib/pool-types";
import { workedSteps } from "../src/lib/worked";

const ROOT = process.cwd();

type SourceSpec = {
  licenseClass: LicenseClass;
  element: 2 | 3 | 4;
  title: string;
  series: string;
  revision: string;
  effectiveFrom: string;
  effectiveThrough: string;
  errataDate: string;
  examQuestions: number;
  passingCount: number;
  expectedCount: number;
  docx: string;
  mirror: string;
};

const SOURCES: SourceSpec[] = [
  {
    licenseClass: "technician",
    element: 2,
    title: "Technician",
    series: "technician-2026-2030",
    revision: "technician-2026-2030-2026-02-19",
    effectiveFrom: "2026-07-01",
    effectiveThrough: "2030-06-30",
    errataDate: "2026-02-19",
    examQuestions: 35,
    passingCount: 26,
    expectedCount: 409,
    docx: "source-materials/technician/ncvec/2026-2030 Technician Pool and Syllabus Public Release Feb 19 2026.docx",
    mirror: "source-materials/technician/russolsen/technician-2026-2030/technician-2026-2030.json",
  },
  {
    licenseClass: "general",
    element: 3,
    title: "General",
    series: "general-2023-2027",
    revision: "general-2023-2027-2026-02-04",
    effectiveFrom: "2023-07-01",
    effectiveThrough: "2027-06-30",
    errataDate: "2026-02-04",
    examQuestions: 35,
    passingCount: 26,
    expectedCount: 423,
    docx: "source-materials/general/General Class Pool and Syllabus 2023-2027 Public Release with 6th Errata Feb 4 2026.docx",
    mirror: "source-materials/general/general-2023-2027.json",
  },
  {
    licenseClass: "extra",
    element: 4,
    title: "Amateur Extra",
    series: "extra-2024-2028",
    revision: "extra-2024-2028-2026-02-04",
    effectiveFrom: "2024-07-01",
    effectiveThrough: "2028-06-30",
    errataDate: "2026-02-04",
    examQuestions: 50,
    passingCount: 37,
    expectedCount: 599,
    docx: "source-materials/extra/2024-2028 Extra Class Question Pool and Syllabus Public Release with 4th Errata Feb 4 2026.docx",
    mirror: "source-materials/extra/extra-2024-2028.json",
  },
];

type MirrorQuestion = {
  id: string;
  correct: number;
  refs?: string;
  question: string;
  answers: string[];
  figure?: string;
  correct_letter: string;
};

type ParsedQuestion = {
  id: string;
  correctIndex: number;
  refs: string;
  text: string;
  answers: [string, string, string, string];
  figure: string | null;
};

const failures: string[] = [];

function fail(message: string) {
  failures.push(message);
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[²]/g, "2")
    .replace(/[×x]/gi, "x")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/Ω/g, "ohm")
    .replace(/µ|μ/g, "u")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

const DASH = "[\\u002D\\u2010\\u2011\\u2012\\u2013\\u2014\\u2212]";

function figureFromText(id: string, text: string): string | null {
  const circuit = text.match(new RegExp(`circuit in (?:figure\\s+)?(E\\d${DASH}\\d)`, "i"));
  if (circuit) return circuit[1]!.toUpperCase().replace(new RegExp(DASH, "g"), "-");
  const named = text.match(new RegExp(`figure\\s+([TGE])\\s*${DASH}?\\s*(\\d+)(?:\\s*${DASH}\\s*(\\d+))?`, "i"));
  if (!named) return EXPECTED_FIGURES[id] ?? null;
  const letter = named[1]!.toUpperCase();
  if (letter === "T") return `T-${named[2]}`;
  if (letter === "G") return `G${named[2]}-${named[3] ?? "1"}`;
  return `E${named[2]}-${named[3]}`;
}

function mirrorFigure(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.toLowerCase().match(/^([tge])(\d+)?-(\d+)\.png$/);
  if (!match) return null;
  const letter = match[1]!.toUpperCase();
  if (letter === "T") return `T-${match[3]}`;
  if (letter === "G") return `G${match[2]}-${match[3]}`;
  return `E${match[2]}-${match[3]}`;
}

function parseQuestionBlock(block: string): ParsedQuestion | "deleted" | null {
  const deleted = block.match(/([A-Z][0-9][A-Z]\d{2})\s+Question Deleted/i);
  if (deleted && !block.match(/([A-Z][0-9][A-Z]\d{2})\s+\([A-D]\)/)) return "deleted";

  const headers = [...block.matchAll(/([A-Z][0-9][A-Z]\d{2})\s+\(([A-D])\)(?:\s*(\[[^\]]+\]))?/g)];
  const header = headers.at(-1);
  if (!header || header.index === undefined) return null;
  const id = header[1]!;
  const correctIndex = header[2]!.charCodeAt(0) - 65;
  const refs = header[3] ?? "";
  const lines = block
    .slice(header.index + header[0].length)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const buckets: Record<string, string[]> = { A: [], B: [], C: [], D: [] };
  const stem: string[] = [];
  let current: string | null = null;
  for (const line of lines) {
    const answer = line.match(/^([A-D])\.\s*(.*)$/);
    if (answer) {
      current = answer[1]!;
      buckets[current]!.push(answer[2] ?? "");
      continue;
    }
    if (current) buckets[current]!.push(line);
    else if (!/^(SUBELEMENT|Effective|Issued|Errata)/.test(line)) stem.push(line);
  }
  const answers = (["A", "B", "C", "D"] as const).map((letter) => buckets[letter]!.join(" ").trim());
  if (answers.some((answer) => answer.length === 0) || stem.length === 0) return null;
  const questionText = stem.join(" ");
  return {
    id,
    correctIndex,
    refs,
    text: questionText,
    answers: answers as [string, string, string, string],
    figure: figureFromText(id, questionText),
  };
}

async function parseDocx(file: string): Promise<{ questions: ParsedQuestion[]; deleted: string[] }> {
  const extracted = await mammoth.extractRawText({ path: path.join(ROOT, file) });
  const text = extracted.value.replace(/\r/g, "").replace(/\n~~[ \t]*\n/g, "\n~~\n");
  const questions: ParsedQuestion[] = [];
  const deleted: string[] = [];
  const seen = new Set<string>();

  for (const chunk of text.split(/\n~~\n/)) {
    const parsed = parseQuestionBlock(chunk);
    if (parsed === "deleted") {
      const id = chunk.match(/([A-Z][0-9][A-Z]\d{2})\s+Question Deleted/i)?.[1];
      if (id) deleted.push(id);
      continue;
    }
    if (!parsed || seen.has(parsed.id)) continue;
    seen.add(parsed.id);
    questions.push(parsed);
  }

  return { questions, deleted };
}

function subelementOf(id: string): string {
  return id.slice(0, 2);
}

function groupOf(id: string): string {
  return id.slice(0, 3);
}

async function buildPool(spec: SourceSpec): Promise<PoolFile> {
  const docxBuffer = await readFile(path.join(ROOT, spec.docx));
  const docxSha256 = createHash("sha256").update(docxBuffer).digest("hex");
  const parsed = await parseDocx(spec.docx);
  const mirror = JSON.parse(await readFile(path.join(ROOT, spec.mirror), "utf8")) as MirrorQuestion[];

  const live = parsed.questions.filter((question) => !WITHDRAWN.includes(question.id as (typeof WITHDRAWN)[number]));
  if (live.length !== spec.expectedCount) {
    fail(`${spec.licenseClass} parsed ${live.length} live questions, expected ${spec.expectedCount}`);
  }
  if (mirror.length !== spec.expectedCount) {
    fail(`${spec.licenseClass} mirror has ${mirror.length} questions, expected ${spec.expectedCount}`);
  }

  for (const id of WITHDRAWN) {
    if (!id.startsWith(spec.licenseClass === "technician" ? "T" : spec.licenseClass === "general" ? "G" : "E")) continue;
    if (live.some((question) => question.id === id)) fail(`${id} is still live in the ${spec.licenseClass} parse`);
    if (mirror.some((question) => question.id === id)) fail(`${id} is still present in the ${spec.licenseClass} mirror`);
  }

  const parsedById = new Map(live.map((question) => [question.id, question]));
  const questions: PoolQuestion[] = [];
  for (const item of mirror) {
    const fromDocx = parsedById.get(item.id);
    if (!fromDocx) {
      fail(`${spec.licenseClass} mirror question ${item.id} is missing from the DOCX`);
      continue;
    }
    if (fromDocx.correctIndex !== item.correct) {
      fail(`${item.id} correct index DOCX ${fromDocx.correctIndex} mirror ${item.correct}`);
    }
    if (item.answers.length !== 4) fail(`${item.id} does not have four answers`);
    fromDocx.answers.forEach((answer, index) => {
      const mirrored = item.answers[index] ?? "";
      const left = normalize(answer);
      const right = normalize(mirrored);
      if (left !== right && left !== `a${right}`) {
        fail(`${item.id} answer ${index} differs:\n  docx ${answer}\n  json ${mirrored}`);
      }
    });
    if (normalize(fromDocx.text) !== normalize(item.question)) {
      fail(`${item.id} stem differs:\n  docx ${fromDocx.text}\n  json ${item.question}`);
    }
    const figure = fromDocx.figure ?? mirrorFigure(item.figure);
    const expected = EXPECTED_FIGURES[item.id] ?? null;
    if (figure !== expected) {
      fail(`${item.id} figure is ${figure ?? "none"}, expected ${expected ?? "none"}`);
    }
    const group = groupOf(item.id);
    const lane = laneFor(item.id, group, figure);
    const flip = LANE_FLIP[item.id];
    if (flip && figure && flip === "card") fail(`${item.id} is a figure question, so it stays an idea`);
    if (flip && flip === groupDefault(group)) fail(`${item.id} flip matches the ${group} default`);
    const stemHint = LANE_STEMS[item.id];
    if (flip && !stemHint) fail(`${item.id} is a lane exception without a stem check`);
    if (stemHint && normalize(fromDocx.text) !== stemHint) {
      fail(`${item.id} stem no longer matches the lane exception`);
    }
    const steps = workedSteps(item.id, fromDocx.text, fromDocx.answers);
    const explanation = explainQuestion(
      {
        text: fromDocx.text,
        answers: fromDocx.answers,
        correctIndex: fromDocx.correctIndex,
        refs: fromDocx.refs || item.refs || "",
        group,
      },
      GROUP_TITLES[group] ?? group,
      steps,
      lane,
    );
    questions.push({
      id: item.id,
      subelement: subelementOf(item.id),
      group,
      text: fromDocx.text,
      answers: fromDocx.answers,
      correctIndex: fromDocx.correctIndex,
      refs: (fromDocx.refs || item.refs || "").trim(),
      figure,
      correctExplanation: explanation.correctExplanation,
      distractors: explanation.distractors,
      workedSteps: steps,
      lab: labForQuestion(item.id, group, lane),
      lane,
    });
  }

  for (const id of Object.keys(LANE_FLIP)) {
    const prefix = spec.licenseClass === "technician" ? "T" : spec.licenseClass === "general" ? "G" : "E";
    if (!id.startsWith(prefix)) continue;
    if (!questions.some((question) => question.id === id)) fail(`${id} is a lane exception and is not in the ${spec.licenseClass} pool`);
    if (!LANE_STEMS[id]) fail(`${id} is a lane exception without a stem check`);
  }

  for (const [id, stem] of Object.entries(ERRATA_STEMS)) {
    if (spec.licenseClass !== "technician") continue;
    const question = questions.find((item) => item.id === id);
    if (!question || question.text !== stem) fail(`${id} does not match the February 19, 2026 stem`);
  }

  const groupIds = [...new Set(questions.map((question) => question.group))].sort(sortGroups);
  if (groupIds.length !== spec.examQuestions) {
    fail(`${spec.licenseClass} has ${groupIds.length} groups, expected ${spec.examQuestions}`);
  }
  const subelementIds = [...new Set(questions.map((question) => question.subelement))].sort(sortGroups);
  for (const subelement of subelementIds) {
    const meta = SUBELEMENT_TITLES[subelement];
    const groups = groupIds.filter((group) => group.startsWith(subelement));
    if (!meta) fail(`Missing subelement title for ${subelement}`);
    else if (groups.length !== meta.examQuestions) {
      fail(`${subelement} has ${groups.length} groups, syllabus says ${meta.examQuestions}`);
    }
  }
  if (spec.licenseClass === "general") {
    const g1c = questions.filter((question) => question.group === "G1C").length;
    if (g1c !== 8) fail(`G1C has ${g1c} questions, expected 8`);
  }

  return {
    series: spec.series,
    revision: spec.revision,
    licenseClass: spec.licenseClass,
    element: spec.element,
    title: spec.title,
    effectiveFrom: spec.effectiveFrom,
    effectiveThrough: spec.effectiveThrough,
    errataDate: spec.errataDate,
    examQuestions: spec.examQuestions,
    passingCount: spec.passingCount,
    source: {
      docx: spec.docx,
      docxSha256,
      mirror: spec.mirror,
      mirrorCommit: MIRROR_COMMIT,
    },
    subelements: subelementIds.map((id) => ({
      id,
      title: SUBELEMENT_TITLES[id]?.title ?? id,
      examQuestions: SUBELEMENT_TITLES[id]?.examQuestions ?? 0,
    })),
    groups: groupIds.map((id) => ({
      id,
      subelement: id.slice(0, 2),
      title: GROUP_TITLES[id] ?? id,
      examSlots: 1 as const,
    })),
    questions,
  };
}

function sortGroups(a: string, b: string): number {
  const order = (value: string) => value.replace(/(\d)/, (_, digit: string) => (digit === "0" ? "9" : String(Number(digit) - 1)));
  return order(a).localeCompare(order(b));
}

async function copyFigures() {
  const figures = path.join(ROOT, "public/figures");
  await mkdir(figures, { recursive: true });
  const tech = "source-materials/technician/ncvec";
  await cp(path.join(ROOT, tech, "Technician Diagram T1.jpg"), path.join(figures, "T-1.jpg"));
  await cp(path.join(ROOT, tech, "Technician Diagram T2.jpg"), path.join(figures, "T-2.jpg"));
  await cp(path.join(ROOT, tech, "Technician Diagram T3.jpg"), path.join(figures, "T-3.jpg"));
  await cp(path.join(ROOT, "source-materials/general/G7-1.pdf"), path.join(figures, "G7-1.pdf"));
  const generalDocx = path.join(
    ROOT,
    "source-materials/general/General Class Pool and Syllabus 2023-2027 Public Release with 6th Errata Feb 4 2026.docx",
  );
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const tmp = path.join(ROOT, ".ingest-tmp");
  await mkdir(tmp, { recursive: true });
  await run("unzip", ["-o", "-j", generalDocx, "word/media/image1.png", "-d", tmp]);
  await cp(path.join(tmp, "image1.png"), path.join(figures, "G7-1.png"));
  const svgDir = path.join(ROOT, "source-materials/extra/svgs");
  for (const name of ["E5-1", "E6-1", "E6-2", "E6-3", "E7-1", "E7-2", "E7-3", "E9-1", "E9-2", "E9-3"]) {
    await cp(path.join(svgDir, `${name}.svg`), path.join(figures, `${name}.svg`));
  }
}

export async function loadPools(): Promise<PoolFile[]> {
  const pools = [];
  for (const spec of SOURCES) pools.push(await buildPool(spec));
  if (failures.length > 0) {
    throw new Error(failures.slice(0, 20).join("\n\n"));
  }
  return pools;
}

async function main() {
  const outDir = path.join(ROOT, "content/pools");
  await mkdir(outDir, { recursive: true });
  const pools = await loadPools();
  const registry: PoolRegistry = {
    generatedFrom: "ncvec-docx",
    mirrorCommit: MIRROR_COMMIT,
    pools: [],
  };
  for (const pool of pools) {
    const file = `${pool.licenseClass}.json`;
    await writeFile(path.join(outDir, file), JSON.stringify(pool));
    registry.pools.push({
      licenseClass: pool.licenseClass,
      series: pool.series,
      revision: pool.revision,
      element: pool.element,
      effectiveFrom: pool.effectiveFrom,
      effectiveThrough: pool.effectiveThrough,
      errataDate: pool.errataDate,
      examQuestions: pool.examQuestions,
      passingCount: pool.passingCount,
      questionCount: pool.questions.length,
      file,
    });
  }
  await writeFile(path.join(outDir, "registry.json"), JSON.stringify(registry, null, 2));
  await copyFigures();
  console.log(
    registry.pools
      .map((pool) => `${pool.licenseClass}: ${pool.questionCount} questions, revision ${pool.revision}`)
      .join("\n"),
  );
}

const isDirectRun = process.argv[1]?.endsWith("ingest.ts") || process.argv[1]?.endsWith("ingest.js");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
