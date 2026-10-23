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
    z.array(
      z.object({
        correct: z.number(),
        total: z.number(),
        at: z.number(),
        revision: z.string().optional(),
      }),
    ),
  ),
  scoredKeys: z.array(z.string()).default([]),
});

export const settingsSchema = z.object({
  version: z.literal(1),
  fastLane: z.boolean().catch(false),
  diagramFree: z.boolean().catch(false),
  frequencyMhz: z.number().positive().catch(14.25),
  studyClass: z.enum(["technician", "general", "extra"]).catch("technician"),
});

export const examSessionSchema = z.object({
  version: z.literal(1),
  paper: z.object({
    licenseClass: z.enum(["technician", "general", "extra"]),
    revision: z.string(),
    seed: z.string(),
    questionIds: z.array(z.string()).min(1),
    createdAt: z.number(),
    figureOnlyIds: z.array(z.string()).default([]),
  }),
  answers: z.array(z.number().int().min(0).max(3).nullable()),
  index: z.number().int().nonnegative(),
  scratch: z.string(),
  calc: z.string().default(""),
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
  try {
    return parseStored(window.localStorage.getItem(key), schema, fallback);
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export type BrowserStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  write: (value: T) => boolean;
};

export function createBrowserStore<T>(key: string, schema: z.ZodType<T>, fallback: T): BrowserStore<T> {
  let raw: string | null = null;
  let snapshot = fallback;
  let preferMemory = false;
  const memory = new Map<string, string>();
  const listeners = new Set<() => void>();

  function readRaw(): string {
    if (preferMemory && memory.has(key)) return memory.get(key)!;
    try {
      return window.localStorage.getItem(key) ?? "";
    } catch {
      preferMemory = true;
      return memory.get(key) ?? "";
    }
  }

  function notify() {
    listeners.forEach((listener) => listener());
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== key) return;
    preferMemory = false;
    memory.delete(key);
    raw = null;
    notify();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== "undefined") {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
    getServerSnapshot() {
      return fallback;
    },
    getSnapshot() {
      if (typeof window === "undefined") return fallback;
      const next = readRaw();
      if (next !== raw) {
        raw = next;
        snapshot = next ? parseStored(next, schema, fallback) : fallback;
      }
      return snapshot;
    },
    write(value) {
      const encoded = JSON.stringify(value);
      try {
        window.localStorage.setItem(key, encoded);
        preferMemory = false;
        memory.delete(key);
      } catch {
        preferMemory = true;
        memory.set(key, encoded);
      }
      raw = null;
      notify();
      return true;
    },
  };
}
