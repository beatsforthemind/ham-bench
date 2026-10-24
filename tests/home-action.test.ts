import { describe, expect, it } from "vitest";
import { benchHomeAction, nextColdCard, nextColdIdea, resumableClass } from "@/lib/home-action";
import { pictureStrings } from "@/lib/question-pictures";
import { pools, poolForToday } from "@/lib/pools";
import type { LicenseClass } from "@/lib/pool-types";
import { EMPTY_PROGRESS, questionKey, type ProgressBook } from "@/lib/readiness";
import { emptySession, type ExamSession } from "@/lib/session";
import { privateTokens } from "@/lib/teach";

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
  it("opens the Technician propagation lab before storage hydrates, even if a paper is already saved", () => {
    expect(benchHomeAction(false, "extra", seen("extra", ["E1A02"]), paper("technician"))).toEqual({
      href: "/labs/propagation?class=technician",
      label: "Open the propagation theater",
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
    expect(benchHomeAction(true, "technician", EMPTY_PROGRESS, finished)).toEqual({
      href: "/labs/propagation?class=technician",
      label: "Open the propagation theater",
      studyClass: "technician",
    });
  });

  it("starts the saved class on its own study move when that class has no answers", () => {
    expect(benchHomeAction(true, "general", seen("technician", ["T1A01"]), null)).toEqual({
      href: "/labs/propagation?class=general",
      label: "Open the propagation theater",
      studyClass: "general",
    });
    const finishedPool = seen(
      "technician",
      pools.technician.questions.map((question) => question.id),
    );
    expect(benchHomeAction(true, "general", finishedPool, null)).toMatchObject({
      href: "/labs/propagation?class=general",
      studyClass: "general",
    });
  });

  it("opens the next cold lab-backed Extra idea, not unseen practice", () => {
    const warm = new Set(["E3A", "E3B", "E3C"]);
    const ids = pools.extra.questions.filter((question) => warm.has(question.group)).map((question) => question.id);
    expect(benchHomeAction(true, "extra", seen("extra", ids), null)).toEqual({
      href: "/labs/decibels?class=extra",
      label: "Open the decibel ladder",
      studyClass: "extra",
    });
    expect(nextColdIdea("extra", seen("extra", ids))?.id).toBe("E4C");
  });

  it("offers the mock when every group is learned or solid", () => {
    const allSeen = seen(
      "technician",
      pools.technician.questions.map((question) => question.id),
    );
    expect(benchHomeAction(true, "technician", allSeen, null)).toEqual({
      href: "/license/technician/exam",
      label: "Sit the Technician paper",
      studyClass: "technician",
    });
  });

  it("keeps the first Technician card picture free of the correct answer", () => {
    const card = nextColdCard("technician", EMPTY_PROGRESS);
    expect(card).toMatchObject({ id: "T1A", pictureId: "T1A01", href: "/license/technician/study/T1/T1A" });
    const question = pools.technician.questions.find((item) => item.id === card?.pictureId);
    expect(question).toBeTruthy();
    const shown = pictureStrings(card!.pictureId!).join("\n");
    const correct = question!.answers[question!.correctIndex];
    expect(shown).not.toContain(correct.trim());
    for (const token of privateTokens(question!)) {
      const pattern = /\d/.test(token)
        ? new RegExp(`(^|[^0-9])${token}([^0-9]|$)`)
        : new RegExp(`\\b${token}\\b`, "i");
      expect(shown).not.toMatch(pattern);
    }
  });
});
