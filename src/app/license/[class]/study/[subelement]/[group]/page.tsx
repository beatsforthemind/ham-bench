import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { groupNote } from "@/lib/explain";
import { isLicenseClass, pools } from "@/lib/pools";
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
  return (
    <div className="space-y-6">
      <p className="text-sm uppercase tracking-widest text-ink-soft">{subelement}</p>
      <h1 className="display text-5xl">
        {group.id} · {group.title}
      </h1>
      <p className="text-xl">{groupNote(group.id, group.title)}</p>
      <Link href={`/license/${licenseClass}/practice?group=${group.id}`} className="inline-flex rounded-full bg-walnut px-4 py-2 text-paper no-underline">
        Practice this group
      </Link>
      <ol className="space-y-3">
        {questions.map((question) => (
          <li key={question.id} className="rounded-2xl border border-line bg-card px-4 py-3">
            <Link href={`/license/${licenseClass}/practice?group=${group.id}&q=${question.id}`}>
              <span className="num text-ink-soft">{question.id}</span> {question.text}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
