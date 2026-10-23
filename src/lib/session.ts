import { scoreExam, type ExamPaper, type ExamScore } from "./exam";
import type { PoolFile } from "./pool-types";

export type ExamSession = {
  version: 1;
  paper: ExamPaper;
  answers: Array<number | null>;
  index: number;
  scratch: string;
  calc: string;
  diagramFree: boolean;
  result: ExamScore | null;
};

export type ResultLog = {
  keys: string[];
};

export function paperKey(paper: ExamPaper): string {
  return `${paper.revision}:${paper.seed}:${paper.createdAt}`;
}

export function emptySession(paper: ExamPaper, diagramFree: boolean): ExamSession {
  return {
    version: 1,
    paper,
    answers: paper.questionIds.map(() => null),
    index: 0,
    scratch: "",
    calc: "",
    diagramFree,
    result: null,
  };
}

export function commitScore(
  log: ResultLog,
  session: ExamSession,
  pool: PoolFile,
): { log: ResultLog; session: ExamSession } {
  const key = paperKey(session.paper);
  if (session.result || log.keys.includes(key)) {
    return { log, session };
  }
  const result = scoreExam(pool, session.paper, session.answers);
  return {
    log: { keys: [...log.keys, key] },
    session: { ...session, result },
  };
}
