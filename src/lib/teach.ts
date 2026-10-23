import { groupNote } from "./explain";
import { chartHref } from "./lanes";
import { labHref } from "./presets";
import type { Lane } from "./lanes";
import type { PoolQuestion } from "./pool-types";

const HOOKS: Record<string, string> = {
  T1B01: "On 10 meters, Technician phone is a small slice, not the whole band.",
  T1C05: "Group D calls look like two letters, a digit, and three letters.",
  T2A01: "A usual 2-meter repeater is split by 600 kHz, above or below its output.",
  T2A02: "146.520 MHz is where 2-meter FM simplex calls start.",
  T8A06: "From 10 meters up, phone uses upper sideband. That is a convention, not a property of the wave.",
  G1C01: "Power limits change with the band. Read the section the pool cites before trusting a round number.",
  G1D10: "A Volunteer Examiner has to be an adult.",
  G2C04: "QRL asks whether the frequency is already in use.",
  E1A07: "The 2200-meter band has its own power ceiling, lower than the HF bands.",
  E2E06: "FT8 trades a long message for a short, timed cycle.",
};

export function cardFact(answer: string): string {
  const fact = answer.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return `For the exam: ${fact}.`;
}

export function conventionHook(id: string): string | null {
  return HOOKS[id] ?? null;
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
    return {
      lane: "card",
      kicker: "Exam card",
      fact: [cardFact(question.answers[question.correctIndex] ?? ""), conventionHook(question.id)].filter(Boolean).join(" "),
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
