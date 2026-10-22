import { z } from "zod";

export const questionStatSchema = z.object({
  seen: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  lastCorrect: z.boolean(),
});

export const progressSchema = z.object({
  version: z.literal(1),
  questions: z.record(z.string(), questionStatSchema),
  exams: z.record(
    z.string(),
    z.array(z.object({ correct: z.number(), total: z.number(), at: z.number() })),
  ),
});

export const settingsSchema = z.object({
  version: z.literal(1),
  fastLane: z.boolean(),
  diagramFree: z.boolean(),
  frequencyMhz: z.number().positive(),
  studyClass: z.enum(["technician", "general", "extra"]),
});

export const examSessionSchema = z.object({
  version: z.literal(1),
  paper: z.object({
    licenseClass: z.enum(["technician", "general", "extra"]),
    revision: z.string(),
    seed: z.string(),
    questionIds: z.array(z.string()).min(1),
    createdAt: z.number(),
  }),
  answers: z.array(z.number().int().min(0).max(3).nullable()),
  index: z.number().int().nonnegative(),
  scratch: z.string(),
  diagramFree: z.boolean(),
  result: z
    .object({
      correct: z.number(),
      total: z.number(),
      passingCount: z.number(),
      passed: z.boolean(),
      missedIds: z.array(z.string()),
      unansweredIds: z.array(z.string()),
    })
    .nullable(),
});

export const PROGRESS_KEY = "ham-bench-progress-v1";
export const EXAM_KEY = "ham-bench-exam-v1";
export const SETTINGS_KEY = "ham-bench-settings-v1";

export function parseStored<T>(raw: string | null, schema: z.ZodType<T>, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function readStored<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return parseStored(window.localStorage.getItem(key), schema, fallback);
}

export function writeStored(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export type BrowserStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  write: (value: T) => void;
};

export function createBrowserStore<T>(key: string, schema: z.ZodType<T>, fallback: T): BrowserStore<T> {
  let raw = "";
  let snapshot = fallback;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getServerSnapshot() {
      return fallback;
    },
    getSnapshot() {
      if (typeof window === "undefined") return fallback;
      const next = window.localStorage.getItem(key) ?? "";
      if (next !== raw) {
        raw = next;
        snapshot = next ? parseStored(next, schema, fallback) : fallback;
      }
      return snapshot;
    },
    write(value) {
      const encoded = JSON.stringify(value);
      snapshot = value;
      if (encoded === raw) return;
      raw = encoded;
      if (typeof window !== "undefined") window.localStorage.setItem(key, encoded);
      listeners.forEach((listener) => listener());
    },
  };
}
