import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Syllabus } from "@/components/study-boards";
import { StudyClassPicker } from "@/components/site-header";
import { CLASS_INFO } from "@/lib/class-info";
import { isLicenseClass, pools } from "@/lib/pools";
import { LICENSE_CLASSES } from "@/lib/pool-types";

export function generateStaticParams() {
  return LICENSE_CLASSES.map((licenseClass) => ({ class: licenseClass }));
}

export async function generateMetadata({ params }: { params: Promise<{ class: string }> }): Promise<Metadata> {
  const { class: licenseClass } = await params;
  if (!isLicenseClass(licenseClass)) return {};
  return { title: CLASS_INFO[licenseClass].name };
}

export default async function LicensePage({ params }: { params: Promise<{ class: string }> }) {
  const { class: licenseClass } = await params;
  if (!isLicenseClass(licenseClass)) notFound();
  const pool = pools[licenseClass];
  const info = CLASS_INFO[licenseClass];
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <StudyClassPicker licenseClass={licenseClass} />
        <p className={`text-sm uppercase tracking-widest ${info.tone}`}>{info.element}</p>
        <h1 className="display text-4xl sm:text-6xl">{info.name}</h1>
        <p className="max-w-3xl text-xl">{info.summary}</p>
        <p className="text-ink-soft">
          Pool {pool.revision}. In force {pool.effectiveFrom} through {pool.effectiveThrough}. Errata {pool.errataDate}. Pass {pool.passingCount} of {pool.examQuestions}.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/license/${licenseClass}/exam`} className="inline-flex min-h-11 items-center rounded-full bg-walnut px-4 py-2 text-paper no-underline">
            Mock exam
          </Link>
          <Link href={`/license/${licenseClass}/practice`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 no-underline">
            Whole pool
          </Link>
          <Link href={`/license/${licenseClass}/practice?filter=missed`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 no-underline">
            Missed
          </Link>
          <Link href={`/license/${licenseClass}/practice?filter=unseen`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 no-underline">
            Unseen
          </Link>
          <Link href={`/license/${licenseClass}/study`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 no-underline">
            Study map
          </Link>
        </div>
      </header>
      <Syllabus licenseClass={licenseClass} />
    </div>
  );
}
