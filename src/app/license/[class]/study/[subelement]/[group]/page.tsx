import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { groupNote } from "@/lib/explain";
import { isLicenseClass, pools } from "@/lib/pools";
import { labHref } from "@/lib/presets";
import { noteGivesAway } from "@/lib/teach";
import { LICENSE_CLASSES } from "@/lib/pool-types";

export function generateStaticParams() {
  return LICENSE_CLASSES.flatMap((licenseClass) =>
    pools[licenseClass].groups.map((group) => ({
      class: licenseClass,
      subelement: group.subelement,
      group: group.id,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ class: string; group: string }>;
}): Promise<Metadata> {
  const { group } = await params;
  return { title: group };
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ class: string; subelement: string; group: string }>;
}) {
  const { class: licenseClass, subelement, group: groupId } = await params;
  if (!isLicenseClass(licenseClass)) notFound();
  const pool = pools[licenseClass];
  const group = pool.groups.find((item) => item.id === groupId && item.subelement === subelement);
  if (!group) notFound();
  const questions = pool.questions.filter((question) => question.group === group.id);
  const ideas = questions.filter((question) => question.lane === "bench");
  const cards = questions.filter((question) => question.lane === "card");
  const bench = ideas.map((question) => labHref(question, licenseClass)).find((href) => href);
  const note = groupNote(group.id, group.title);
  const noteLeaks = questions.some((question) => noteGivesAway(note, question.answers[question.correctIndex] ?? "", question.workedSteps));
  return (
    <div className="space-y-6">
      <p className="text-sm uppercase tracking-widest text-ink-soft">{subelement}</p>
      <h1 className="display text-4xl sm:text-5xl">
        {group.id} · {group.title}
      </h1>
      {ideas.length > 0 ? <p className="text-xl">{noteLeaks ? `This group is about ${group.title}.` : note}</p> : <p className="text-xl">These are facts the exam expects you to recognize.</p>}
      <div className="flex flex-wrap gap-3">
        {bench ? (
          <Link href={bench} className="inline-flex min-h-11 items-center rounded-full bg-walnut px-4 py-2 text-paper no-underline">
            Open the bench
          </Link>
        ) : null}
        <Link href={`/license/${licenseClass}/practice?group=${group.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 no-underline">
          Practice this group
        </Link>
        {group.id === "T1B" || group.id === "G1A" || group.id === "E1A" ? (
          <Link href={`/bands?class=${licenseClass}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 no-underline">
            Open the band chart
          </Link>
        ) : null}
      </div>
      {ideas.length > 0 && cards.length > 0 ? <h2 className="text-2xl">Radio ideas</h2> : null}
      <QuestionList licenseClass={licenseClass} groupId={group.id} questions={ideas.length > 0 && cards.length > 0 ? ideas : ideas.length > 0 ? ideas : []} />
      {cards.length > 0 ? <h2 className="text-2xl">{ideas.length > 0 ? "Exam cards" : "Questions"}</h2> : null}
      <QuestionList licenseClass={licenseClass} groupId={group.id} questions={cards} />
    </div>
  );
}

function QuestionList({
  licenseClass,
  groupId,
  questions,
}: {
  licenseClass: string;
  groupId: string;
  questions: { id: string; text: string }[];
}) {
  if (questions.length === 0) return null;
  return (
    <ol className="space-y-3">
      {questions.map((question) => (
        <li key={question.id} className="rounded-2xl border border-line bg-card">
          <Link href={`/license/${licenseClass}/practice?group=${groupId}&q=${question.id}`} className="block min-h-11 px-4 py-3 text-lg">
            <span className="num text-ink-soft">{question.id}</span> {question.text}
          </Link>
        </li>
      ))}
    </ol>
  );
}
