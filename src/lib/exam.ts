import type { LicenseClass, PoolFile, PoolQuestion } from "./pool-types";

export type ExamPaper = {
  licenseClass: LicenseClass;
  revision: string;
  seed: string;
  questionIds: string[];
  createdAt: number;
};

export type ExamScore = {
  correct: number;
  total: number;
  passingCount: number;
  passed: boolean;
  missedIds: string[];
  unansweredIds: string[];
};

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWith<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = current;
  }
  return copy;
}

export function activeQuestionsByGroup(pool: PoolFile): Map<string, PoolQuestion[]> {
  const grouped = new Map<string, PoolQuestion[]>();
  for (const group of pool.groups) {
    grouped.set(group.id, []);
  }
  for (const question of pool.questions) {
    const list = grouped.get(question.group);
    if (!list) {
      throw new Error(`${pool.licenseClass} question ${question.id} is in unknown group ${question.group}`);
    }
    list.push(question);
  }
  return grouped;
}

export function createExam(pool: PoolFile, seed: string, createdAt = Date.now()): ExamPaper {
  const random = mulberry32(hashSeed(`${pool.revision}:${seed}`));
  const grouped = activeQuestionsByGroup(pool);
  const chosen: PoolQuestion[] = [];

  for (const group of pool.groups) {
    const active = grouped.get(group.id) ?? [];
    if (active.length === 0) {
      throw new Error(`${pool.licenseClass} group ${group.id} has no active questions`);
    }
    const index = Math.floor(random() * active.length);
    chosen.push(active[index]!);
  }

  if (chosen.length !== pool.examQuestions) {
    throw new Error(`${pool.licenseClass} exam has ${chosen.length} questions, expected ${pool.examQuestions}`);
  }

  return {
    licenseClass: pool.licenseClass,
    revision: pool.revision,
    seed,
    questionIds: shuffleWith(chosen, random).map((question) => question.id),
    createdAt,
  };
}

export function scoreExam(
  pool: PoolFile,
  paper: ExamPaper,
  answers: Array<number | null>,
): ExamScore {
  if (paper.questionIds.length !== pool.examQuestions) {
    throw new Error("Paper length does not match the pool blueprint");
  }
  if (answers.length !== paper.questionIds.length) {
    throw new Error("Answer list length does not match the paper");
  }

  const byId = new Map(pool.questions.map((question) => [question.id, question]));
  const missedIds: string[] = [];
  const unansweredIds: string[] = [];
  let correct = 0;

  paper.questionIds.forEach((id, index) => {
    const question = byId.get(id);
    if (!question) {
      throw new Error(`Paper contains unknown question ${id}`);
    }
    const answer = answers[index];
    if (answer === null || answer === undefined) {
      unansweredIds.push(id);
      missedIds.push(id);
      return;
    }
    if (answer === question.correctIndex) {
      correct += 1;
      return;
    }
    missedIds.push(id);
  });

  return {
    correct,
    total: pool.examQuestions,
    passingCount: pool.passingCount,
    passed: correct >= pool.passingCount,
    missedIds,
    unansweredIds,
  };
}

export function practiceOrder(answers: string[], seed: string): number[] {
  const random = mulberry32(hashSeed(`practice:${seed}`));
  return shuffleWith(answers.map((_, index) => index), random);
}
