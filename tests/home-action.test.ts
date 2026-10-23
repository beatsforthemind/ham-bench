import { describe, expect, it } from "vitest";
import { benchHomeAction, resumableClass } from "@/lib/home-action";
import { pools, poolForToday } from "@/lib/pools";
import type { LicenseClass } from "@/lib/pool-types";
import { EMPTY_PROGRESS, questionKey, type ProgressBook } from "@/lib/readiness";
import { emptySession, type ExamSession } from "@/lib/session";

function seen(licenseClass: LicenseClass, ids: string[]): ProgressBook {
  const revision = pools[licenseClass].revision;
  const questions: ProgressBook["questions"] = {};
  for (const id of ids) {
    questions[questionKey(revision, id)] = { seen: 1, correct: 1, lastCorrect: true };
  }
  return { version: 1, questions, exams: {}, scoredKeys: [] };
}

function paper(licenseClass: LicenseClass, revision = pools[licenseClass].revision): ExamSession {
  const pool = pools[licenseClass];
  return emptySession(
    {
      licenseClass,
      revision,
      seed: "home",
      questionIds: Array.from({ length: pool.examQuestions }, (_, index) => `Q${index}`),
      createdAt: 1,
      figureOnlyIds: [],
    },
    false,
  );
}

describe("bench home action", () => {
  it("starts Technician before storage hydrates, even if a paper is already saved", () => {
    expect(benchHomeAction(false, "extra", seen("extra", ["E1A02"]), paper("technician"))).toEqual({
      href: "/license/technician/practice?filter=unseen",
      label: "Start Technician",
      studyClass: "technician",
    });
  });

  it("resumes a paper the exam room will open, under that class's name", () => {
    expect(poolForToday("general")).not.toBeNull();
    const session = paper("general");
    expect(resumableClass(session)).toBe("general");
    expect(benchHomeAction(true, "technician", EMPTY_PROGRESS, session)).toEqual({
      href: "/license/general/exam",
      label: "Resume the General paper",
      studyClass: "general",
    });
  });

  it("does not offer to resume a stale, short, finished, or mis-indexed paper", () => {
    const live = paper("technician");
    const stale = paper("technician", "technician-old");
    const short = emptySession({ ...live.paper, questionIds: ["T1A01"] }, false);
    const finished: ExamSession = {
      ...live,
      result: { correct: 20, total: 35, passingCount: 26, passed: false, missedIds: [], unansweredIds: [] },
    };
    const parked = { ...live, index: live.paper.questionIds.length };
    const torn = { ...live, answers: [] };
    for (const session of [stale, short, finished, parked, torn]) {
      expect(resumableClass(session)).toBeNull();
    }
    expect(benchHomeAction(true, "technician", EMPTY_PROGRESS, finished).label).toBe("Start Technician");
  });

  it("continues the saved class on unseen practice, and the whole pool once nothing is unseen", () => {
    const first = pools.extra.questions[0];
    expect(benchHomeAction(true, "extra", seen("extra", [first.id]), null)).toMatchObject({
      href: "/license/extra/practice?filter=unseen",
      label: "Continue Extra",
      studyClass: "extra",
    });
    const allSeen = seen(
      "extra",
      pools.extra.questions.map((question) => question.id),
    );
    expect(benchHomeAction(true, "extra", allSeen, null).href).toBe("/license/extra/practice");
  });

  it("keeps Start Technician when the saved class has no answers", () => {
    expect(benchHomeAction(true, "general", seen("technician", ["T1A01"]), null)).toMatchObject({
      label: "Start Technician",
      href: "/license/technician/practice?filter=unseen",
      studyClass: "technician",
    });
    const finishedPool = seen(
      "technician",
      pools.technician.questions.map((question) => question.id),
    );
    expect(benchHomeAction(true, "general", finishedPool, null)).toMatchObject({
      label: "Start Technician",
      href: "/license/technician/practice",
    });
  });
});
