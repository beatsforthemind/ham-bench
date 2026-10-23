"use client";

import { createContext, useContext, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { LicenseClass, PoolFile } from "@/lib/pool-types";
import { recordAnswer, recordExam, EMPTY_PROGRESS, type ProgressBook } from "@/lib/readiness";
import { commitScore, paperKey, type ExamSession } from "@/lib/session";
import {
  createBrowserStore,
  EXAM_KEY,
  examSessionSchema,
  PROGRESS_KEY,
  progressSchema,
  SETTINGS_KEY,
  settingsSchema,
} from "@/lib/storage";

export type BenchSettings = {
  version: 1;
  fastLane: boolean;
  diagramFree: boolean;
  frequencyMhz: number;
  studyClass: LicenseClass;
};

const DEFAULT_SETTINGS: BenchSettings = {
  version: 1,
  fastLane: false,
  diagramFree: false,
  frequencyMhz: 14.25,
  studyClass: "technician",
};

const progressStore = createBrowserStore(PROGRESS_KEY, progressSchema, EMPTY_PROGRESS);
const settingsStore = createBrowserStore(SETTINGS_KEY, settingsSchema, DEFAULT_SETTINGS);
const sessionStore = createBrowserStore(EXAM_KEY, examSessionSchema.nullable(), null);

const clientReady = {
  subscribe: () => () => {},
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};

type BenchContextValue = {
  ready: boolean;
  progress: ProgressBook;
  settings: BenchSettings;
  session: ExamSession | null;
  setSettings: (patch: Partial<BenchSettings>) => void;
  setFrequency: (mhz: number) => void;
  answerPractice: (revision: string, id: string, correct: boolean) => void;
  saveSession: (session: ExamSession | null) => void;
  beginSession: (session: ExamSession) => void;
  turnIn: (pool: PoolFile, expectedKey: string) => ExamSession | null;
};

const BenchContext = createContext<BenchContextValue | null>(null);

export function BenchProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(clientReady.subscribe, clientReady.getSnapshot, clientReady.getServerSnapshot);
  const progress = useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot, progressStore.getServerSnapshot);
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot, settingsStore.getServerSnapshot);
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot);
  const submittedKey = useRef<string | null>(null);

  const value: BenchContextValue = {
    ready,
    progress,
    settings,
    session: session && session.answers.length === session.paper.questionIds.length ? session : null,
    setSettings: (patch) => {
      const current = settingsStore.getSnapshot();
      settingsStore.write({ ...current, ...patch, version: 1 });
    },
    setFrequency: (mhz) => {
      if (!(mhz > 0) || !Number.isFinite(mhz)) return;
      const current = settingsStore.getSnapshot();
      if (current.frequencyMhz === mhz) return;
      settingsStore.write({ ...current, frequencyMhz: mhz });
    },
    answerPractice: (revision, id, correct) => {
      progressStore.write(recordAnswer(progressStore.getSnapshot(), revision, id, correct));
    },
    saveSession: (next) => {
      const stored = sessionStore.getSnapshot();
      if (stored?.result) return;
      if (stored && next && paperKey(stored.paper) !== paperKey(next.paper)) return;
      sessionStore.write(next);
    },
    beginSession: (next) => {
      sessionStore.write(next);
    },
    turnIn: (pool, expectedKey) => {
      const current = sessionStore.getSnapshot();
      if (!current || current.result) return current;
      if (paperKey(current.paper) !== expectedKey) return current;
      if (current.paper.licenseClass !== pool.licenseClass) return current;
      if (current.answers.length !== current.paper.questionIds.length) return current;
      const book = progressStore.getSnapshot();
      if (book.scoredKeys.includes(expectedKey)) return current;
      const committed = commitScore({ keys: book.scoredKeys }, current, pool);
      const result = committed.session.result;
      if (!result) return current;
      let nextBook = { ...book, scoredKeys: committed.log.keys };
      current.paper.questionIds.forEach((id, index) => {
        const answer = current.answers[index];
        if (answer == null) return;
        const question = pool.questions.find((item) => item.id === id);
        if (!question) return;
        nextBook = recordAnswer(nextBook, pool.revision, id, answer === question.correctIndex);
      });
      nextBook = recordExam(nextBook, pool.licenseClass, result.correct, result.total, Date.now(), pool.revision);
      const sessionOk = sessionStore.write(committed.session);
      const progressOk = progressStore.write(nextBook);
      if (sessionOk && progressOk) submittedKey.current = expectedKey;
      return sessionStore.getSnapshot();
    },
  };

  return <BenchContext.Provider value={value}>{children}</BenchContext.Provider>;
}

export function useBench(): BenchContextValue {
  const value = useContext(BenchContext);
  if (!value) throw new Error("useBench must be used inside BenchProvider");
  return value;
}
