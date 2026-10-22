import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Workbench } from "@/components/labs/workbench";
import { LABS, isLabSlug, labBySlug } from "@/lib/labs-catalog";

export function generateStaticParams() {
  return LABS.map((lab) => ({ slug: lab.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: labBySlug(slug)?.title ?? "Lab" };
}

export default async function LabPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLabSlug(slug)) notFound();
  return (
    <Suspense fallback={<p>Opening the bench.</p>}>
      <Workbench slug={slug} />
    </Suspense>
  );
}
