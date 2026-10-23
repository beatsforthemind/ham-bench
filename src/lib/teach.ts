import { groupNote } from "./explain";
import { chartHref } from "./lanes";
import { labHref } from "./presets";
import type { Lane } from "./lanes";
import type { PoolQuestion } from "./pool-types";
import { CARD_MEMORIES, NUMBER_PAIRS } from "./card-memories";

const STOP = new Set(
  "a an the of to for in on by with from or and is are be it as at its their than then this that these those when where who what how may can".split(" "),
);

const TOKEN = /[A-Za-z0-9]+(?:[./+-][A-Za-z0-9]+)*/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Words and numbers that appear on the correct line and on none of the other three. */
export function privateTokens(question: Pick<PoolQuestion, "answers" | "correctIndex">): string[] {
  const answer = question.answers[question.correctIndex] ?? "";
  const right = (answer.match(TOKEN) ?? []).map((token) => token.toLowerCase());
  const wrong = new Set(
    question.answers.filter((_, index) => index !== question.correctIndex).flatMap((choice) =>
      (choice.match(TOKEN) ?? []).map((token) => token.toLowerCase()),
    ),
  );
  const found = new Set<string>();
  for (const token of right) {
    if (/\d/.test(token)) found.add(token);
    else if (!STOP.has(token) && token.length > 2 && !wrong.has(token)) found.add(token);
  }
  for (const number of answer.match(/\d+(?:\.\d+)?/g) ?? []) found.add(number);
  return [...found];
}

function containsToken(lead: string, token: string): boolean {
  if (/\d/.test(token)) return new RegExp(`(^|[^0-9])${escapeRegExp(token)}([^0-9]|$)`).test(lead);
  return new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(lead);
}

/** A lead fails when it uses a private token, or when it prints the correct line itself. */
export function leadUsesPrivateToken(question: Pick<PoolQuestion, "answers" | "correctIndex">, lead: string): boolean {
  if (privateTokens(question).some((token) => containsToken(lead, token))) return true;
  const fact = (question.answers[question.correctIndex] ?? "").replace(/\s+/g, " ").trim().replace(/\.$/, "");
  if (fact.length >= 1 && new RegExp(`\\b${escapeRegExp(fact)}\\b`, "i").test(lead)) return true;
  return false;
}

function keep(question: Pick<PoolQuestion, "answers" | "correctIndex">, lead: string): string | null {
  const trimmed = lead.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (leadUsesPrivateToken(question, trimmed)) return null;
  if (/read the question/i.test(trimmed)) return null;
  if (/largest (of these|number)/i.test(trimmed)) return null;
  return trimmed;
}

function gatherLead(answer: string): string | null {
  const trimmed = answer.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  if (!/^all these choices are correct$/i.test(trimmed)) return null;
  return "Each of the other lines belongs in the answer. Choose the line that collects them.";
}

const FORCE_LINES: { word: string; line: string }[] = [
  { word: "encouraged", line: "The rule nudges you toward this. It stops short of a command." },
  { word: "prohibited", line: "The rule bans this outright." },
  { word: "forbidden", line: "The rule bans this outright." },
  { word: "voluntary", line: "The rule leaves this as a choice, not a duty." },
  { word: "permitted", line: "The rule allows this." },
  { word: "allowed", line: "The rule allows this." },
  { word: "required", line: "The rule makes this mandatory." },
  { word: "must", line: "The rule makes this mandatory." },
];

function forceLead(answer: string, tokens: string[]): string | null {
  if (/\bnot\b|\bno\b/i.test(answer)) return null;
  const content = tokens.filter((token) => !/\d/.test(token));
  if (content.length === 0 || content.length > 3) return null;
  return FORCE_LINES.find((force) => content.includes(force.word))?.line ?? null;
}

/** A sentence that points at the correct line, or nothing when no honest memory exists. */
export function cardLead(question: Pick<PoolQuestion, "id" | "text" | "answers" | "correctIndex">): string | null {
  const written = CARD_MEMORIES[question.id];
  if (written) {
    const kept = keep(question, written);
    if (kept) return kept;
  }
  const pair = NUMBER_PAIRS[question.id];
  if (pair) {
    const kept = keep(question, pair);
    if (kept) return kept;
  }
  const gathered = gatherLead(question.answers[question.correctIndex] ?? "");
  if (gathered) {
    const kept = keep(question, gathered);
    if (kept) return kept;
  }
  const forced = forceLead(question.answers[question.correctIndex] ?? "", privateTokens(question));
  if (forced) {
    const kept = keep(question, forced);
    if (kept) return kept;
  }
  return null;
}

export function cardFact(answer: string): string {
  const fact = answer.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return `For the exam: ${fact}.`;
}

export function ideaBeforeAnswer(question: Pick<PoolQuestion, "group" | "answers" | "correctIndex">, title: string, steps: string[]): string {
  const note = groupNote(question.group, title);
  if (noteGivesAway(note, question.answers[question.correctIndex] ?? "", steps)) return `This one follows from ${title}.`;
  return note;
}

export function noteGivesAway(note: string, answer: string, steps: string[]): boolean {
  const last = steps.at(-1);
  if (last && note.includes(last)) return true;
  const fact = answer.trim();
  if (fact.length < 3) return false;
  return note.toLowerCase().includes(fact.toLowerCase());
}

export function stepsBeforeAnswer(steps: string[]): string[] {
  if (steps.length <= 1) return [];
  return steps.slice(0, -1);
}

export function practiceHref(question: PoolQuestion, licenseClass: string): string | null {
  return labHref(question, licenseClass) ?? chartHref(question.id, question.group, licenseClass);
}

export type MissReview = {
  lane: Lane;
  kicker: string;
  fact: string;
  href: string | null;
  hrefLabel: string | null;
};

export function missReview(question: PoolQuestion, licenseClass: string, groupTitle: string): MissReview {
  if (question.lane === "card") {
    const chart = chartHref(question.id, question.group, licenseClass);
    const answer = question.answers[question.correctIndex] ?? "";
    const lead = cardLead(question);
    return {
      lane: "card",
      kicker: "Exam card",
      fact: [lead, cardFact(answer)].filter(Boolean).join(" "),
      href: chart,
      hrefLabel: chart ? "Open the band chart" : null,
    };
  }
  const href = practiceHref(question, licenseClass);
  return {
    lane: "bench",
    kicker: "Radio idea",
    fact: ideaBeforeAnswer(question, groupTitle, question.workedSteps),
    href,
    hrefLabel: href?.startsWith("/bands") ? "Open the band chart" : href ? "Open the bench" : null,
  };
}
