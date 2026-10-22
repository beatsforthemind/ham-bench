"use client";

import { createContext, useContext, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { PoolFile } from "@/lib/pool-types";
import { recordAnswer, recordExam, EMPTY_PROGRESS, type ProgressBook } from "@/lib/readiness";
import { commitScore, type ExamSession } from "@/lib/session";
import {
  createBrowserStore,
  EXAM_KEY,
  examSessionSchema,
  PROGRESS_KEY,
  progressSchema,
  SETTINGS_KEY,
  settingsSchema,
} from "@/lib/storage";
import type { LicenseClass } from "@/lib/pool-types";

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
  setSettings: (settings: BenchSettings) => void;
  setFrequency: (mhz: number) => void;
  answerPractice: (id: string, correct: boolean) => void;
  saveSession: (session: ExamSession | null) => void;
  turnIn: (pool: PoolFile) => ExamSession | null;
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
    setSettings: (next) => settingsStore.write(next),
    setFrequency: (mhz) => settingsStore.write({ ...settingsStore.getSnapshot(), frequencyMhz: mhz }),
    answerPractice: (id, correct) => progressStore.write(recordAnswer(progressStore.getSnapshot(), id, correct)),
    saveSession: (next) => sessionStore.write(next),
    turnIn: (pool) => {
      const current = sessionStore.getSnapshot();
      if (!current || current.paper.licenseClass !== pool.licenseClass || current.result) return current;
      if (current.answers.length !== current.paper.questionIds.length) return current;
      const key = `${current.paper.revision}:${current.paper.seed}:${current.paper.createdAt}`;
      if (submittedKey.current === key) return current;
      submittedKey.current = key;
      const committed = commitScore({ keys: [] }, current, pool);
      const result = committed.session.result;
      if (!result) return current;
      let book = progressStore.getSnapshot();
      current.paper.questionIds.forEach((id, index) => {
        const answer = current.answers[index];
        if (answer == null) return;
        const question = pool.questions.find((item) => item.id === id);
        if (!question) return;
        book = recordAnswer(book, id, answer === question.correctIndex);
      });
      progressStore.write(recordExam(book, pool.licenseClass, result.correct, result.total, Date.now()));
      sessionStore.write(committed.session);
      return committed.session;
    },
  };

  return <BenchContext.Provider value={value}>{children}</BenchContext.Provider>;
}

export function useBench(): BenchContextValue {
  const value = useContext(BenchContext);
  if (!value) throw new Error("useBench must be used inside BenchProvider");
  return value;
}
