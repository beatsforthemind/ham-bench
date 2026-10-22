import type { Metadata } from "next";
import Link from "next/link";
import { LABS } from "@/lib/labs-catalog";

export const metadata: Metadata = { title: "Labs" };

export default function LabsPage() {
  const technician = LABS.filter((lab) => lab.min === "technician");
  const upgrade = LABS.filter((lab) => lab.min !== "technician");
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="display text-6xl">The workbench</h1>
        <p className="max-w-3xl text-xl">Move the circuit, the wire, or the sky until the exam answer falls out. The band map lives on its own page.</p>
        <Link href="/bands" className="inline-flex rounded-full border border-line px-4 py-2 no-underline">
          Open the band map
        </Link>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {technician.map((lab) => (
          <Link key={lab.slug} href={`/labs/${lab.slug}`} className="rounded-3xl border border-line bg-card p-5 no-underline">
            <h2 className="display text-3xl">{lab.title}</h2>
            <p className="mt-2 text-ink-soft">{lab.summary}</p>
          </Link>
        ))}
      </div>
      <section className="space-y-4">
        <h2 className="display text-4xl">General and Extra</h2>
        <p className="max-w-3xl text-ink-soft">These stay closed during Technician study. A missed General or Extra question can open the one it belongs to.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {upgrade.map((lab) => (
            <Link key={lab.slug} href={`/labs/${lab.slug}`} className="rounded-3xl border border-dashed border-line bg-card p-5 no-underline">
              <p className="text-sm uppercase tracking-widest text-ink-soft">{lab.min}</p>
              <h3 className="display text-3xl">{lab.title}</h3>
              <p className="mt-2 text-ink-soft">{lab.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
