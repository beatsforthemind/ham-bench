import { describe, expect, it } from "vitest";
import { benchHomeAction, nextColdCard, nextColdIdea, resumeAction, resumableClass } from "@/lib/home-action";
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
  it("opens Learn Technician before storage hydrates, even if a paper is already saved", () => {
    expect(benchHomeAction(false, "extra")).toEqual({
      href: "/license/technician/learn",
      label: "Learn Technician",
      studyClass: "technician",
    });
  });

  it("keeps Learn as the button and offers a resumable paper as its own link", () => {
    expect(poolForToday("general")).not.toBeNull();
    const session = paper("general");
    expect(resumableClass(session)).toBe("general");
    expect(benchHomeAction(true, "technician")).toEqual({
      href: "/license/technician/learn",
      label: "Learn Technician",
      studyClass: "technician",
    });
    expect(resumeAction(session)).toEqual({
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
      expect(resumeAction(session)).toBeNull();
    }
  });

  it("follows the saved class once storage has hydrated", () => {
    expect(benchHomeAction(true, "general")).toEqual({
      href: "/license/general/learn",
      label: "Learn General",
      studyClass: "general",
    });
  });

  it("keeps the next cold Extra idea on the shelf, not on the Learn button", () => {
    const warm = new Set(["E3A", "E3B", "E3C"]);
    const ids = pools.extra.questions.filter((question) => warm.has(question.group)).map((question) => question.id);
    expect(nextColdIdea("extra", seen("extra", ids))?.id).toBe("E4C");
    expect(benchHomeAction(true, "extra").href).toBe("/license/extra/learn");
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
