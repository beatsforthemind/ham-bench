import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { selectActive } from "@/lib/active-pool";
import { legalOn } from "@/lib/bands";
import { createExam, practiceOrder, scoreExam } from "@/lib/exam";
import { EXPECTED_FIGURES, FIGURE_ASSETS, LIVE_COUNTS, WITHDRAWN } from "@/lib/pool-facts";
import { pools, registry } from "@/lib/pools";
import { pictureStrings, questionPicture } from "@/lib/question-pictures";
import { cardFact, cardLead, ideaBeforeAnswer, leadUsesPrivateToken, missReview } from "@/lib/teach";
import { chartHref } from "@/lib/lanes";
import { presetFromQuestion, labHref } from "@/lib/presets";
import { groupStatus, readyToTest, recordAnswer, recordExam, EMPTY_PROGRESS } from "@/lib/readiness";
import { commitScore, emptySession } from "@/lib/session";
import { parseStored, progressSchema, settingsSchema } from "@/lib/storage";
import type { PoolRegistryEntry } from "@/lib/pool-types";

const root = path.resolve(__dirname, "..");

describe("pools", () => {
  it("matches the live counts, pass marks, and errata stems", () => {
    expect(pools.technician.questions).toHaveLength(LIVE_COUNTS.technician);
    expect(pools.general.questions).toHaveLength(LIVE_COUNTS.general);
    expect(pools.extra.questions).toHaveLength(LIVE_COUNTS.extra);
    expect(pools.technician.passingCount).toBe(26);
    expect(pools.general.passingCount).toBe(26);
    expect(pools.extra.passingCount).toBe(37);
    expect(pools.technician.examQuestions).toBe(35);
    expect(pools.general.examQuestions).toBe(35);
    expect(pools.extra.examQuestions).toBe(50);
    expect(pools.technician.groups).toHaveLength(35);
    expect(pools.general.groups).toHaveLength(35);
    expect(pools.extra.groups).toHaveLength(50);

    const stems: Record<string, string> = {
      T1C01: "For which classes of amateur radio licenses does the FCC currently issue new licenses?",
      T5A05: "A difference in which of the following causes electron flow?",
      T7A09: "What is the function of the switch which selects either SSB or CW-FM on some VHF power amplifiers?",
      T0A10: "What hazard exists when rapidly charging or discharging an unprotected battery?",
    };
    for (const [id, stem] of Object.entries(stems)) {
      expect(pools.technician.questions.find((question) => question.id === id)?.text).toBe(stem);
    }
  });

  it("drops withdrawn questions and keeps G1C at eight", () => {
    const ids = new Set(Object.values(pools).flatMap((pool) => pool.questions.map((question) => question.id)));
    for (const id of WITHDRAWN) expect(ids.has(id)).toBe(false);
    const g1 = pools.general.questions.filter((question) => question.subelement === "G1");
    expect(g1.length).not.toBe(54);
    expect(g1.filter((question) => question.group === "G1C")).toHaveLength(8);
    expect(pools.extra.questions.length).not.toBe(602);
  });

  it("resolves every figure, including E7G02 and the rotated Smith chart", () => {
    for (const pool of Object.values(pools)) {
      for (const question of pool.questions) {
        expect(question.answers).toHaveLength(4);
        expect(question.distractors.filter((line) => line.length > 0)).toHaveLength(3);
        const expected = EXPECTED_FIGURES[question.id] ?? null;
        expect(question.figure).toBe(expected);
        if (question.figure) {
          const asset = FIGURE_ASSETS[question.figure];
          expect(asset, question.id).toBeTruthy();
          expect(existsSync(path.join(root, "public", asset!.replace(/^\//, "")))).toBe(true);
        }
      }
    }
    const e7g02 = pools.extra.questions.find((question) => question.id === "E7G02");
    expect(e7g02?.figure).toBe("E7-3");
    expect(e7g02?.text.toLowerCase()).toContain("circuit in e7");
    const svg = readFileSync(path.join(root, "public/figures/E9-3.svg"), "utf8");
    const infinity = svg.match(/matrix\(1 0 0 1 ([\d.]+) [\d.]+\)[^>]*>∞/);
    const zero = svg.match(/matrix\(4\.489659e-11 -1 1 4\.489659e-11 ([\d.]+) 118\.1709\)[^>]*>0</);
    expect(infinity).toBeTruthy();
    expect(zero).toBeTruthy();
    expect(Number(infinity?.[1])).toBeGreaterThan(Number(zero?.[1]));
  });
});

describe("active pool", () => {
  const future: PoolRegistryEntry = {
    licenseClass: "general",
    series: "general-2027-2031",
    revision: "general-2027-2031-draft",
    element: 3,
    effectiveFrom: "2027-07-01",
    effectiveThrough: "2031-06-30",
    errataDate: "2027-07-01",
    examQuestions: 35,
    passingCount: 26,
    questionCount: 1,
    file: "future.json",
  };
  const entries = [...registry.pools, future];

  it("keeps exactly one series across the July 1 boundary", () => {
    expect(selectActive(registry.pools, "technician", "2026-06-30")).toBeNull();
    expect(selectActive(registry.pools, "technician", "2026-07-01")?.revision).toBe(pools.technician.revision);
    expect(selectActive(registry.pools, "technician", "2030-06-30")).not.toBeNull();
    expect(selectActive(registry.pools, "technician", "2030-07-01")).toBeNull();
    expect(selectActive(entries, "general", "2027-06-30")?.revision).toBe(pools.general.revision);
    expect(selectActive(entries, "general", "2027-07-01")?.revision).toBe(future.revision);
    expect(selectActive(registry.pools, "extra", "2024-07-01")).not.toBeNull();
    expect(selectActive(registry.pools, "extra", "2028-07-01")).toBeNull();
    expect(selectActive(entries, "general", "2026-10-22")?.revision).toBe(pools.general.revision);
    expect(
      selectActive(
        [registry.pools[1]!, { ...registry.pools[1]!, revision: "overlap" }],
        "general",
        "2026-10-22",
      ),
    ).toBeNull();
  });
});

describe("exam", () => {
  it("draws one active question per group for many seeds", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 32 }), fc.constantFrom(...Object.values(pools)), (seed, pool) => {
        const paper = createExam(pool, seed, 1);
        expect(paper.questionIds).toHaveLength(pool.examQuestions);
        expect(new Set(paper.questionIds).size).toBe(pool.examQuestions);
        const byId = new Map(pool.questions.map((question) => [question.id, question]));
        const groups = paper.questionIds.map((id) => {
          const question = byId.get(id);
          expect(question).toBeTruthy();
          expect(WITHDRAWN).not.toContain(id);
          return question!.group;
        });
        expect(new Set(groups)).toEqual(new Set(pool.groups.map((group) => group.id)));
        expect(createExam(pool, seed, 1).questionIds).toEqual(paper.questionIds);
        expect(paper.figureOnlyIds).toEqual([]);
        const order = practiceOrder(["a", "b", "c", "d"], seed);
        expect(new Set(order)).toEqual(new Set([0, 1, 2, 3]));
      }),
      { numRuns: 40 },
    );
  });

  it("counts blanks as misses and records a paper once", () => {
    const pool = pools.technician;
    const paper = createExam(pool, "score", 5);
    const blank = emptySession(paper, false);
    const missed = scoreExam(pool, paper, blank.answers);
    expect(missed.correct).toBe(0);
    expect(missed.unansweredIds).toHaveLength(35);
    expect(missed.passed).toBe(false);

    const session = emptySession(paper, false);
    const question = pool.questions.find((item) => item.id === paper.questionIds[0]);
    session.answers[0] = question!.correctIndex;
    const first = commitScore({ keys: [] }, session, pool);
    const second = commitScore(first.log, first.session, pool);
    expect(first.session.result?.correct).toBe(1);
    expect(second.session).toBe(first.session);
    expect(second.log.keys).toEqual(first.log.keys);
    expect(first.log.keys).toHaveLength(1);
    const replay = emptySession(paper, false);
    replay.answers = [...session.answers];
    const guarded = commitScore(first.log, replay, pool);
    expect(guarded.log.keys).toEqual(first.log.keys);
    expect(guarded.session.result).toBeNull();

    const general = createExam(pools.general, "g1c", 9);
    const g1c = general.questionIds.filter((id) => id.startsWith("G1C"));
    expect(g1c).toHaveLength(1);
    expect(scoreExam(pools.extra, createExam(pools.extra, "extra", 3), Array(50).fill(0)).passingCount).toBe(37);
  });

  it("prefers a non-figure question on a diagram-free paper and still draws one per group", () => {
    const pool = pools.technician;
    const mixed = pool.groups.find((group) => {
      const items = pool.questions.filter((question) => question.group === group.id);
      return items.some((question) => question.figure) && items.some((question) => !question.figure);
    });
    expect(mixed).toBeTruthy();
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 24 }), (seed) => {
        const paper = createExam(pool, seed, 1, true);
        expect(paper.questionIds).toHaveLength(pool.examQuestions);
        const byId = new Map(pool.questions.map((question) => [question.id, question]));
        const groups = new Set(paper.questionIds.map((id) => byId.get(id)!.group));
        expect(groups.size).toBe(pool.examQuestions);
        const picked = byId.get(paper.questionIds.find((id) => byId.get(id)!.group === mixed!.id)!)!;
        expect(picked.figure).toBeNull();
        expect(paper.figureOnlyIds).not.toContain(picked.id);
      }),
      { numRuns: 20 },
    );
  });
});

describe("readiness and storage", () => {
  it("describes a group in plain language and rejects a bad progress record", () => {
    const pool = pools.technician;
    const group = pool.groups[0]!;
    expect(groupStatus(pool, EMPTY_PROGRESS, group.id)).toBe("unseen");
    const multi = pool.groups.find((item) => pool.questions.filter((question) => question.group === item.id).length > 1);
    const only = pool.questions.find((question) => question.group === multi!.id)!;
    expect(groupStatus(pool, recordAnswer(EMPTY_PROGRESS, pool.revision, only.id, true), multi!.id)).toBe("shaky");
    let book = EMPTY_PROGRESS;
    for (const question of pool.questions.filter((item) => item.group === group.id)) {
      book = recordAnswer(book, pool.revision, question.id, true);
    }
    expect(groupStatus(pool, book, group.id)).toBe("solid");
    const exams = [1, 2, 3, 4, 5].reduce((current, at) => recordExam(current, "technician", 30, 35, at, pool.revision), book);
    const all = pool.questions.reduce((current, question) => recordAnswer(current, pool.revision, question.id, true), exams);
    for (const sub of pool.subelements) {
      const groups = pool.groups.filter((item) => item.subelement === sub.id);
      for (const item of groups) {
        expect(["learned", "solid"]).toContain(groupStatus(pool, all, item.id));
      }
    }
    expect(readyToTest(pool, all).ready).toBe(true);
    expect(parseStored("{", progressSchema, EMPTY_PROGRESS)).toEqual(EMPTY_PROGRESS);
    expect(parseStored(JSON.stringify({ version: 2 }), progressSchema, EMPTY_PROGRESS)).toEqual(EMPTY_PROGRESS);
    expect(parseStored(JSON.stringify({ version: 1, questions: {}, exams: {} }), progressSchema, EMPTY_PROGRESS).scoredKeys).toEqual([]);
    const settings = parseStored(
      JSON.stringify({ version: 1, fastLane: true, diagramFree: true, frequencyMhz: 0, studyClass: "extra" }),
      settingsSchema,
      { version: 1, fastLane: false, diagramFree: false, frequencyMhz: 14.25, studyClass: "technician" },
    );
    expect(settings.fastLane).toBe(true);
    expect(settings.diagramFree).toBe(true);
    expect(settings.studyClass).toBe("extra");
    expect(settings.frequencyMhz).toBe(14.25);
  });

  it("loads the keyed numbers for the benches that were opening the wrong problem", () => {
    const question = (id: string) => Object.values(pools).flatMap((pool) => pool.questions).find((item) => item.id === id)!;
    const current = presetFromQuestion(question("T5C11"));
    expect(current.watts).toBe(120);
    expect(current.volts).toBe(12);
    expect(current.watts! / current.volts!).toBe(10);
    const voltage = presetFromQuestion(question("T5D11"));
    expect(voltage.ohms).toBe(10);
    expect(voltage.amps).toBe(1);
    expect(presetFromQuestion(question("T5B07")).mhz).toBe(3.525);
    const parallel = presetFromQuestion(question("G5C04"));
    expect(parallel.r1).toBe(100);
    expect(parallel.r2).toBe(200);
    expect(parallel.r3).toBeUndefined();
    expect(1 / (1 / parallel.r1! + 1 / parallel.r2!)).toBeCloseTo(66.67, 1);
    const resonance = presetFromQuestion(question("E5A02"));
    expect(resonance.henries).toBeCloseTo(50e-6);
    expect(resonance.farads).toBeCloseTo(40e-12);
    const bandwidth = presetFromQuestion(question("E5A11"));
    expect(bandwidth.mhz).toBe(7.1);
    expect(bandwidth.q).toBe(150);
    const gain = presetFromQuestion(question("E7G09"));
    expect(gain.r1).toBe(1000);
    expect(gain.r2).toBe(10000);
    expect(gain.volts).toBe(0.23);
  });

  it("answers the band questions the exam actually asks", () => {
    expect(legalOn(28.4, "technician", "phone").allowed).toBe(true);
    expect(legalOn(14.2, "technician", "phone").allowed).toBe(false);
    expect(legalOn(5.332, "general", "phone").allowed).toBe(true);
    expect(legalOn(14.2, "general", "phone").allowed).toBe(false);
    expect(legalOn(14.3, "general", "phone").allowed).toBe(true);
    expect(legalOn(7.05, "technician", "cw").allowed).toBe(true);
    expect(legalOn(7.05, "technician", "phone").allowed).toBe(false);
  });
});

describe("learning lanes", () => {
  // Twelve name, unit, and mode questions moved from ideas to cards.
  const counts = {
    technician: { card: 180, bench: 229 },
    general: { card: 175, bench: 248 },
    extra: { card: 196, bench: 403 },
  } as const;

  it("locks the card and idea shelves", () => {
    for (const [name, expected] of Object.entries(counts)) {
      const pool = pools[name as keyof typeof pools];
      expect(pool.questions.filter((question) => question.lane === "card")).toHaveLength(expected.card);
      expect(pool.questions.filter((question) => question.lane === "bench")).toHaveLength(expected.bench);
    }
  });

  it("keeps figures as ideas and cards off the concept benches", () => {
    let uncovered = 0;
    for (const pool of Object.values(pools)) {
      for (const question of pool.questions) {
        if (question.figure) expect(question.lane, question.id).toBe("bench");
        if (question.lane === "card") expect(question.lab, question.id).toBeNull();
        const answer = question.answers[question.correctIndex] ?? "";
        if (question.lane === "card") {
          expect(cardFact(answer), question.id).toContain(answer.trim().replace(/\.$/, ""));
          const lead = cardLead(question);
          if (lead) {
            expect(leadUsesPrivateToken(question, lead), question.id).toBe(false);
            expect(lead, question.id).not.toMatch(/^For the exam/);
            expect(lead, question.id).not.toMatch(/read the question/i);
            expect(lead, question.id).not.toMatch(/largest (of these|number)/i);
            expect(lead, question.id).not.toMatch(/\bblank\b/i);
          } else {
            uncovered += 1;
          }
          expect(question.distractors.join(" ")).not.toContain("does not answer this question");
        } else {
          const title = pool.groups.find((group) => group.id === question.group)?.title ?? question.group;
          const last = question.workedSteps.at(-1);
          const idea = ideaBeforeAnswer(question, title, question.workedSteps);
          if (last) expect(idea, question.id).not.toContain(last);
          expect(question.distractors.join(" ")).not.toContain("does not answer this question");
        }
      }
    }
    expect(uncovered).toBeLessThanOrEqual(241);
    const question = (id: string) => Object.values(pools).flatMap((pool) => pool.questions).find((item) => item.id === id)!;
    expect(question("T7D08").lane).toBe("card");
    expect(question("T7D09").lane).toBe("card");
    expect(question("T8A01").lane).toBe("card");
    expect(question("T8A01").lab).toBeNull();
    expect(question("G5B03").lab).toBe("ohms");
    expect(labHref(question("G5B03"), "general")).toContain("volts=400");
    expect(labHref(question("G5B03"), "general")).toContain("ohms=800");
    expect(labHref(question("G5B04"), "general")).toContain("amps=0.2");
    expect(labHref(question("G5B05"), "general")).toContain("amps=0.007");
    expect(question("G5C01").lab).toBeNull();
    expect(question("G5C03").lab).toBe("dividers");
    expect(question("G8B07").lab).toBeNull();
    expect(question("E9A12").lab).toBe("decibels");
    expect(labHref(question("E9D05"), "extra")).toContain("yagi=1");
    expect(labHref(question("T7D02"), "technician")).toContain("leads=1");
    expect(labHref(question("T8A08"), "technician")).toContain("/labs/bandwidth");
    expect(labHref(question("G9C01"), "general")).toContain("yagi=1");
    expect(labHref(question("E9C01"), "extra")).toContain("array=1");
    expect(question("E6A10").lab).toBe("schematics");
    expect(chartHref("T8A06", "T8A", "technician")).toContain("sideband=usb");
    expect(chartHref("G4D08", "G4D", "general")).toContain("sideband=lsb");
    const g9 = pools.general.questions.find((item) => item.id === "G9A09")!;
    const g9Title = pools.general.groups.find((group) => group.id === "G9A")?.title ?? "G9A";
    expect(ideaBeforeAnswer(g9, g9Title, g9.workedSteps).toLowerCase()).not.toContain("4:1");
    const smith = pools.extra.questions.find((item) => item.id === "E9G07")!;
    const smithTitle = pools.extra.groups.find((group) => group.id === "E9G")?.title ?? "E9G";
    expect(ideaBeforeAnswer(smith, smithTitle, smith.workedSteps).toLowerCase()).not.toContain("resistance axis");
    const side = missReview(pools.general.questions.find((item) => item.id === "G4D08")!, "general", "Amateur practices");
    expect(side.hrefLabel).toBe("Open the band chart");
    expect(labHref(question("T5C09"), "technician") ?? "").toMatch(/volts=|amps=/);
  });

  it("exposes a lane only after a mock is turned in", () => {
    const source = readFileSync(path.join(root, "src/components/exam-room.tsx"), "utf8");
    const live = source.split("const id = active.paper.questionIds")[1] ?? "";
    expect(source).toContain("missReview");
    expect(source).not.toContain("cardFact");
    expect(source).not.toContain("ideaBeforeAnswer");
    expect(live).not.toContain("missReview");
    expect(live).not.toContain("exam-fact");
    expect(live).not.toContain("For the exam");
    expect(live).not.toContain("question.lane");
    expect(live).not.toContain("cardLead");
    expect(live).not.toContain("QuestionPicture");
    const card = pools.technician.questions.find((question) => question.id === "T2A01")!;
    const review = missReview(card, "technician", "Operating Procedures");
    expect(review.lane).toBe("card");
    expect(review.fact).toContain(card.answers[card.correctIndex] ?? "");
    expect(cardLead(card)).not.toMatch(/\bblank\b/i);
    expect(cardLead(card)?.toLowerCase()).not.toContain("600");
    const phonetic = pools.technician.questions.find((question) => question.id === "T1A03")!;
    expect(cardLead(phonetic)).toBe(
      "On a voice contact the rules nudge you toward clearer speech. They do not make it mandatory, and they do not save it for emergencies or foreign stations.",
    );
    const power = pools.technician.questions.find((question) => question.id === "T1B11")!;
    expect(cardLead(power)).toContain("lower");
    expect(cardLead(power)).not.toMatch(/\b200\b/);
    expect(cardLead(power)).not.toMatch(/\b1500\b/);
    const races = pools.technician.questions.find((question) => question.id === "T2C12")!;
    expect(cardLead(races)).toContain("rushing");
    expect(cardLead(races)).not.toMatch(/\bRACES\b/);
    const agency = pools.technician.questions.find((question) => question.id === "T1A02")!;
    expect(cardLead(agency)).not.toMatch(/\bFCC\b/);
    const peaks = pools.technician.questions.find((question) => question.id === "T2B05")!;
    const peaksIdea = ideaBeforeAnswer(peaks, "VHF and UHF operating", peaks.workedSteps);
    expect(peaksIdea.toLowerCase()).not.toContain("this group covers");
    expect(peaksIdea.toLowerCase()).not.toContain("you are talking too loudly");
    expect(peaksIdea.toLowerCase()).toContain("rails");
    const idea = pools.technician.questions.find((question) => question.id === "T5D11")!;
    const ideaReview = missReview(idea, "technician", "Ohm’s law");
    expect(ideaReview.lane).toBe("bench");
    expect(ideaReview.href).toContain("/labs/ohms");
    const last = idea.workedSteps.at(-1);
    if (last) expect(ideaReview.fact).not.toContain(last);
    expect(ideaBeforeAnswer(idea, "Ohm’s law", idea.workedSteps)).not.toMatch(/\b10\b/);
    expect(questionPicture("T5D11")?.kind).toBe("bench");
    const resistor = pools.technician.questions.find((question) => question.id === "T6A01")!;
    const resistorIdea = ideaBeforeAnswer(resistor, "Electrical components", resistor.workedSteps);
    expect(resistorIdea.toLowerCase()).not.toContain("resistor");
    expect(resistorIdea.toLowerCase()).not.toContain("this one follows");
    expect(questionPicture("T6A01")?.kind).toBe("symbol");
    expect(questionPicture("T1B11")?.kind).toBe("band");
  });

  it("caps questions that still have no picture", () => {
    let uncovered = 0;
    for (const pool of Object.values(pools)) {
      for (const question of pool.questions) {
        const strings = pictureStrings(question.id);
        if (strings.length === 0) {
          uncovered += 1;
          continue;
        }
        const title = pool.groups.find((group) => group.id === question.group)?.title ?? question.group;
        const picture = questionPicture(question.id);
        for (const text of strings) {
          expect(leadUsesPrivateToken(question, text), `${question.id} ${text}`).toBe(false);
        }
        const last = question.workedSteps.at(-1);
        if (last) {
          for (const text of strings) expect(text, question.id).not.toContain(last);
        }
        if (question.lane === "bench") {
          expect(ideaBeforeAnswer(question, title, question.workedSteps), question.id).toBe(picture?.caption);
        } else {
          expect(cardLead(question), question.id).toBe(picture?.caption);
        }
      }
    }
    expect(uncovered).toBeLessThanOrEqual(1347);
    const bench = (id: string) => {
      const picture = questionPicture(id);
      expect(picture?.kind, id).toBe("bench");
      if (picture?.kind !== "bench") throw new Error(id);
      return picture;
    };
    expect(bench("T5B09").bench).toBe("db-small");
    expect(bench("G5B01").bench).toBe("db-small");
    expect(bench("T5B09").caption).toMatch(/small step/);
    expect(bench("T5B09").caption.toLowerCase()).not.toMatch(/empty rung/);
    expect(bench("T5B10").bench).toBe("db-two");
    expect(bench("T5B10").caption).toMatch(/two small steps/);
    expect(bench("T5B11").bench).toBe("db-large");
    expect(bench("T5B11").caption).toMatch(/large step/);
    expect(bench("T5C11").marks).toContain("I = P / E");
    expect(bench("T5B01").caption.toLowerCase()).not.toMatch(/empty mark/);
    expect(bench("T5D11").marks).toContain("?");
    expect(bench("T5D11").marks?.join(" ")).not.toMatch(/\d/);
  });
});
