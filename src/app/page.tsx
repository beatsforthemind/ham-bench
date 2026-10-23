import Link from "next/link";
import { BenchHome } from "@/components/bench-scene";
import { CLASS_INFO } from "@/lib/class-info";
import { pools } from "@/lib/pools";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-ink-soft">Amateur radio practice</p>
        <h1 className="display text-4xl text-walnut sm:text-6xl">The license is earned in the room. This is the bench.</h1>
        <p className="text-2xl leading-snug">A Technician can miss nine questions and still pass. Only a couple of those thirty-five are math.</p>
        <p className="text-lg text-ink-soft">
          Ready to test means 80% or better on five mock exams in a row, every question in the pool seen at least once, and no subelement left under a passing share of its groups.
        </p>
      </header>
      <BenchHome />
      <div className="grid gap-4 md:grid-cols-3">
        {(["technician", "general", "extra"] as const).map((licenseClass) => {
          const pool = pools[licenseClass];
          const info = CLASS_INFO[licenseClass];
          return (
            <Link key={licenseClass} href={`/license/${licenseClass}`} className="rounded-3xl border border-line bg-card p-5 no-underline">
              <p className={`text-sm uppercase tracking-widest ${info.tone}`}>{info.element}</p>
              <h2 className="display mt-2 text-4xl">{info.name}</h2>
              <p className="mt-3 text-ink-soft">{info.summary}</p>
              <p className="num mt-4 text-sm">
                {pool.questions.length} questions · pass {pool.passingCount} of {pool.examQuestions}
              </p>
              <p className="text-sm text-ink-soft">
                {pool.effectiveFrom} through {pool.effectiveThrough}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
