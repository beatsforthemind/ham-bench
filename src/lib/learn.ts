import { z } from "zod";
import type { LicenseClass, PoolFile } from "@/lib/pool-types";
import { groupStatus, statFor, type ProgressBook } from "@/lib/readiness";
import { createBrowserStore } from "@/lib/storage";

export type LearnDeck = {
  groupId: string;
  questionIds: string[];
  startId: string;
  nextGroupId: string | null;
};

const learnCursorSchema = z.object({
  version: z.literal(1),
  technician: z.string().optional(),
  general: z.string().optional(),
  extra: z.string().optional(),
});

export type LearnCursors = z.infer<typeof learnCursorSchema>;

export const LEARN_KEY = "ham-bench-learn-v1";

const EMPTY_CURSORS: LearnCursors = { version: 1 };

export const learnStore = createBrowserStore(LEARN_KEY, learnCursorSchema, EMPTY_CURSORS);

function coldGroups(pool: PoolFile, progress: ProgressBook) {
  return pool.groups.filter((group) => {
    const status = groupStatus(pool, progress, group.id);
    return status === "unseen" || status === "shaky";
  });
}

export function firstLearnQuestion(pool: PoolFile, progress: ProgressBook, questionIds: string[]): string {
  const unseen = questionIds.find((id) => !statFor(progress, pool.revision, id));
  if (unseen) return unseen;
  const missed = questionIds.find((id) => {
    const stat = statFor(progress, pool.revision, id);
    return Boolean(stat && !stat.lastCorrect);
  });
  return missed ?? questionIds[0] ?? "";
}

/** The first cold group in pool order, or the saved card's group when that group is still cold. */
export function learnDeck(pool: PoolFile, progress: ProgressBook, savedId: string | null): LearnDeck | null {
  const cold = coldGroups(pool, progress);
  if (cold.length === 0) return null;
  const saved = savedId ? pool.questions.find((question) => question.id === savedId) : undefined;
  const savedCold = saved ? cold.find((group) => group.id === saved.group) : undefined;
  const group = savedCold ?? nextColdAfter(pool, progress, saved?.group ?? null) ?? cold[0];
  if (!group) return null;
  const questionIds = pool.questions.filter((question) => question.group === group.id).map((question) => question.id);
  if (questionIds.length === 0) return null;
  const startId = savedCold && saved ? saved.id : firstLearnQuestion(pool, progress, questionIds);
  const index = cold.findIndex((item) => item.id === group.id);
  return {
    groupId: group.id,
    questionIds,
    startId,
    nextGroupId: cold[index + 1]?.id ?? null,
  };
}

export function nextColdAfter(pool: PoolFile, progress: ProgressBook, groupId: string | null): { id: string } | null {
  const cold = coldGroups(pool, progress);
  if (cold.length === 0) return null;
  if (!groupId) return cold[0] ?? null;
  const at = pool.groups.findIndex((group) => group.id === groupId);
  return cold.find((group) => pool.groups.findIndex((item) => item.id === group.id) > at) ?? null;
}

export function rememberedLearn(licenseClass: LicenseClass): string | null {
  return learnStore.getSnapshot()[licenseClass] ?? null;
}

export function rememberLearn(licenseClass: LicenseClass, questionId: string) {
  const current = learnStore.getSnapshot();
  if (current[licenseClass] === questionId) return;
  learnStore.write({ ...current, version: 1, [licenseClass]: questionId });
}
