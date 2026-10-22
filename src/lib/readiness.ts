import type { PoolFile, PoolQuestion } from "./pool-types";

export type QuestionStat = {
  seen: number;
  correct: number;
  lastCorrect: boolean;
};

export type ProgressBook = {
  version: 1;
  questions: Record<string, QuestionStat>;
  exams: Record<string, Array<{ correct: number; total: number; at: number }>>;
};

export type GroupStatus = "unseen" | "shaky" | "learned" | "solid";

export const EMPTY_PROGRESS: ProgressBook = { version: 1, questions: {}, exams: {} };

export function recordAnswer(book: ProgressBook, id: string, correct: boolean): ProgressBook {
  const previous = book.questions[id];
  const next: QuestionStat = {
    seen: (previous?.seen ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (correct ? 1 : 0),
    lastCorrect: correct,
  };
  return { ...book, questions: { ...book.questions, [id]: next } };
}

export function recordExam(
  book: ProgressBook,
  licenseClass: string,
  correct: number,
  total: number,
  at: number,
): ProgressBook {
  const prior = book.exams[licenseClass] ?? [];
  return {
    ...book,
    exams: { ...book.exams, [licenseClass]: [...prior, { correct, total, at }].slice(-12) },
  };
}

export function groupStatus(pool: PoolFile, book: ProgressBook, groupId: string): GroupStatus {
  const questions = pool.questions.filter((question) => question.group === groupId);
  if (questions.length === 0) return "unseen";
  const stats = questions.map((question) => book.questions[question.id]).filter(Boolean) as QuestionStat[];
  if (stats.length === 0) return "unseen";
  const seenAll = questions.every((question) => book.questions[question.id]);
  const allCorrectOnce = questions.every((question) => (book.questions[question.id]?.correct ?? 0) > 0);
  const accuracy = stats.reduce((sum, stat) => sum + stat.correct, 0) / stats.reduce((sum, stat) => sum + stat.seen, 0);
  const lastMiss = stats.some((stat) => !stat.lastCorrect);
  if (seenAll && allCorrectOnce && accuracy >= 0.8 && !lastMiss) return "solid";
  if (accuracy >= 0.6 && !lastMiss) return "learned";
  return "shaky";
}

export function subelementPassing(pool: PoolFile, book: ProgressBook, subelementId: string): boolean {
  const groups = pool.groups.filter((group) => group.subelement === subelementId);
  if (groups.length === 0) return false;
  const ready = groups.filter((group) => {
    const status = groupStatus(pool, book, group.id);
    return status === "learned" || status === "solid";
  }).length;
  return ready / groups.length >= pool.passingCount / pool.examQuestions;
}

export function readyToTest(pool: PoolFile, book: ProgressBook): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const recent = (book.exams[pool.licenseClass] ?? []).slice(-5);
  if (recent.length < 5 || recent.some((exam) => exam.correct / exam.total < 0.8)) {
    reasons.push("Five practice exams in a row at 80% or better.");
  }
  const unseen = pool.questions.filter((question) => !book.questions[question.id]).length;
  if (unseen > 0) reasons.push(`${unseen} pool questions still unseen.`);
  for (const subelement of pool.subelements) {
    if (!subelementPassing(pool, book, subelement.id)) {
      reasons.push(`${subelement.id} is still under a passing share of its groups.`);
    }
  }
  return { ready: reasons.length === 0, reasons };
}

export function questionSeen(book: ProgressBook, question: PoolQuestion): boolean {
  return Boolean(book.questions[question.id]);
}
