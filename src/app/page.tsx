import { BenchHome, LicenseCard } from "@/components/bench-scene";
import { CLASS_INFO } from "@/lib/class-info";
import { pools } from "@/lib/pools";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-ink-soft">Amateur radio practice</p>
        <h1 className="display text-3xl text-walnut sm:text-6xl">The license is earned in the room. This is the bench.</h1>
        <p className="text-2xl leading-snug">The paper mixes facts you recognize and ideas you can picture. The benches are for the ideas.</p>
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
            <LicenseCard key={licenseClass} licenseClass={licenseClass}>
              <p className={`text-sm uppercase tracking-widest ${info.tone}`}>{info.element}</p>
              <h2 className="display mt-2 text-4xl">{info.name}</h2>
              <p className="mt-3 text-ink-soft">{info.summary}</p>
              <p className="num mt-4 text-sm">
                {pool.questions.length} questions · pass {pool.passingCount} of {pool.examQuestions}
              </p>
              <p className="text-sm text-ink-soft">
                {pool.effectiveFrom} through {pool.effectiveThrough}
              </p>
            </LicenseCard>
          );
        })}
      </div>
    </div>
  );
}
