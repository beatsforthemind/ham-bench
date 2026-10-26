import { describe, expect, it } from "vitest";
import { firstLearnQuestion, learnDeck } from "@/lib/learn";
import { pools } from "@/lib/pools";
import { EMPTY_PROGRESS, questionKey, type ProgressBook } from "@/lib/readiness";

function book(ids: string[], correct = true): ProgressBook {
  const revision = pools.technician.revision;
  const questions: ProgressBook["questions"] = {};
  for (const id of ids) {
    questions[questionKey(revision, id)] = { seen: 1, correct: correct ? 1 : 0, lastCorrect: correct };
  }
  return { version: 1, questions, exams: {}, scoredKeys: [] };
}

describe("learn deck", () => {
  it("starts a fresh Technician at T1A01, not the propagation lab", () => {
    const deck = learnDeck(pools.technician, EMPTY_PROGRESS, null);
    expect(deck).toMatchObject({ groupId: "T1A", startId: "T1A01", nextGroupId: "T1B" });
    expect(deck?.questionIds[0]).toBe("T1A01");
  });

  it("returns to the saved card while its group is still cold", () => {
    const deck = learnDeck(pools.technician, EMPTY_PROGRESS, "T1A05");
    expect(deck?.groupId).toBe("T1A");
    expect(deck?.startId).toBe("T1A05");
  });

  it("moves to the next cold group once the saved group is warm", () => {
    const t1a = pools.technician.questions.filter((question) => question.group === "T1A").map((question) => question.id);
    const deck = learnDeck(pools.technician, book(t1a), "T1A05");
    const firstT1B = pools.technician.questions.find((question) => question.group === "T1B");
    expect(deck).toMatchObject({ groupId: "T1B", startId: firstT1B?.id });
  });

  it("opens the first missed card when a shaky group has no unseen questions", () => {
    const ids = pools.technician.questions.filter((question) => question.group === "T1A").map((question) => question.id);
    const progress = book(ids);
    const missed = ids[2]!;
    progress.questions[questionKey(pools.technician.revision, missed)] = { seen: 1, correct: 0, lastCorrect: false };
    expect(firstLearnQuestion(pools.technician, progress, ids)).toBe(missed);
    expect(learnDeck(pools.technician, progress, null)?.startId).toBe(missed);
  });

  it("is warm only when every group is learned or solid", () => {
    const ids = pools.technician.questions.map((question) => question.id);
    expect(learnDeck(pools.technician, book(ids), null)).toBeNull();
  });
});
