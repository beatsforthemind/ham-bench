import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Syllabus } from "@/components/study-boards";
import { CLASS_INFO } from "@/lib/class-info";
import { isLicenseClass } from "@/lib/pools";
import { LICENSE_CLASSES } from "@/lib/pool-types";

export function generateStaticParams() {
  return LICENSE_CLASSES.map((licenseClass) => ({ class: licenseClass }));
}

export async function generateMetadata({ params }: { params: Promise<{ class: string }> }): Promise<Metadata> {
  const { class: licenseClass } = await params;
  if (!isLicenseClass(licenseClass)) return {};
  return { title: `${CLASS_INFO[licenseClass].name} study` };
}

export default async function StudyPage({ params }: { params: Promise<{ class: string }> }) {
  const { class: licenseClass } = await params;
  if (!isLicenseClass(licenseClass)) notFound();
  return (
    <div className="space-y-6">
      <h1 className="display text-4xl sm:text-5xl">{CLASS_INFO[licenseClass].name} study map</h1>
      <p className="text-lg text-ink-soft">Each group is one question on the exam. Unseen, shaky, learned, and solid are the only four words the map uses.</p>
      <Syllabus licenseClass={licenseClass} />
    </div>
  );
}
