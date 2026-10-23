import { CLASS_INFO } from "@/lib/class-info";
import { poolForToday, pools } from "@/lib/pools";
import type { LicenseClass } from "@/lib/pool-types";
import { questionSeen, type ProgressBook } from "@/lib/readiness";
import type { ExamSession } from "@/lib/session";

export type BenchHomeAction = {
  href: string;
  label: string;
  studyClass: LicenseClass;
};

const START: BenchHomeAction = {
  href: "/license/technician/practice?filter=unseen",
  label: "Start Technician",
  studyClass: "technician",
};

export function classPracticeHref(licenseClass: LicenseClass, progress: ProgressBook): string {
  const pool = pools[licenseClass];
  const unseen = pool.questions.some((question) => !questionSeen(progress, pool.revision, question));
  return `/license/${licenseClass}/practice${unseen ? "?filter=unseen" : ""}`;
}

function classHasAnswers(licenseClass: LicenseClass, progress: ProgressBook): boolean {
  const pool = pools[licenseClass];
  return pool.questions.some((question) => questionSeen(progress, pool.revision, question));
}

/** The exam room opens a paper only when the saved session still matches today's pool. */
export function resumableClass(session: ExamSession | null): LicenseClass | null {
  if (!session || session.result) return null;
  if (session.answers.length !== session.paper.questionIds.length) return null;
  const licenseClass = session.paper.licenseClass;
  const pool = poolForToday(licenseClass);
  if (!pool || session.paper.revision !== pool.revision) return null;
  if (session.paper.questionIds.length !== pool.examQuestions) return null;
  if (session.index < 0 || session.index >= session.paper.questionIds.length) return null;
  return licenseClass;
}

export function benchHomeAction(
  ready: boolean,
  studyClass: LicenseClass,
  progress: ProgressBook,
  session: ExamSession | null,
): BenchHomeAction {
  if (!ready) return START;
  const openPaper = resumableClass(session);
  if (openPaper) {
    return {
      href: `/license/${openPaper}/exam`,
      label: `Resume the ${CLASS_INFO[openPaper].name} paper`,
      studyClass: openPaper,
    };
  }
  if (classHasAnswers(studyClass, progress)) {
    return {
      href: classPracticeHref(studyClass, progress),
      label: `Continue ${CLASS_INFO[studyClass].name}`,
      studyClass,
    };
  }
  return { ...START, href: classPracticeHref("technician", progress) };
}
