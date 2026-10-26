import { CLASS_INFO } from "@/lib/class-info";
import { labBySlug } from "@/lib/labs-catalog";
import { poolForToday, pools } from "@/lib/pools";
import type { LicenseClass, PoolFile, PoolGroup } from "@/lib/pool-types";
import { questionPicture } from "@/lib/question-pictures";
import { groupStatus, type GroupStatus, type ProgressBook } from "@/lib/readiness";
import type { ExamSession } from "@/lib/session";

export type BenchHomeAction = {
  href: string;
  label: string;
  studyClass: LicenseClass;
};

export type HomeStudyGroup = {
  id: string;
  subelement: string;
  title: string;
  href: string;
  labSlug: string | null;
  labTitle: string | null;
  labSummary: string | null;
  pictureId: string | null;
};

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

function isCold(status: GroupStatus): boolean {
  return status === "unseen" || status === "shaky";
}

function coldGroups(pool: PoolFile, progress: ProgressBook, lane: "card" | "bench"): PoolGroup[] {
  return pool.groups.filter((group) => {
    if (!isCold(groupStatus(pool, progress, group.id))) return false;
    return pool.questions.some((question) => question.group === group.id && question.lane === lane);
  });
}

function labSlugFor(pool: PoolFile, group: PoolGroup): string | null {
  const question = pool.questions.find((item) => item.group === group.id && item.lane === "bench" && item.lab);
  return question?.lab ?? null;
}

function describeGroup(licenseClass: LicenseClass, pool: PoolFile, group: PoolGroup, lane: "card" | "bench"): HomeStudyGroup {
  const labSlug = lane === "bench" ? labSlugFor(pool, group) : null;
  const lab = labSlug ? labBySlug(labSlug) : undefined;
  const firstCard = pool.questions.find((question) => question.group === group.id && question.lane === "card");
  const pictureId = lane === "card" && firstCard && questionPicture(firstCard.id) ? firstCard.id : null;
  return {
    id: group.id,
    subelement: group.subelement,
    title: group.title,
    href: `/license/${licenseClass}/study/${group.subelement}/${group.id}`,
    labSlug,
    labTitle: lab?.title ?? null,
    labSummary: lab?.summary ?? null,
    pictureId,
  };
}

/**
 * The next idea prefers a cold group that has a lab, so the desk shelf
 * opens on something you can move. A bare idea is the fallback.
 */
export function nextColdIdea(licenseClass: LicenseClass, progress: ProgressBook): HomeStudyGroup | null {
  const pool = pools[licenseClass];
  const groups = coldGroups(pool, progress, "bench");
  const picked = groups.find((group) => labSlugFor(pool, group)) ?? groups[0];
  return picked ? describeGroup(licenseClass, pool, picked, "bench") : null;
}

export function nextColdCard(licenseClass: LicenseClass, progress: ProgressBook): HomeStudyGroup | null {
  const pool = pools[licenseClass];
  const picked = coldGroups(pool, progress, "card")[0];
  return picked ? describeGroup(licenseClass, pool, picked, "card") : null;
}

export function benchHomeAction(ready: boolean, studyClass: LicenseClass): BenchHomeAction {
  const licenseClass = ready ? studyClass : "technician";
  return {
    href: `/license/${licenseClass}/learn`,
    label: `Learn ${CLASS_INFO[licenseClass].name}`,
    studyClass: licenseClass,
  };
}

export function resumeAction(session: ExamSession | null): BenchHomeAction | null {
  const openPaper = resumableClass(session);
  if (!openPaper) return null;
  return {
    href: `/license/${openPaper}/exam`,
    label: `Resume the ${CLASS_INFO[openPaper].name} paper`,
    studyClass: openPaper,
  };
}
