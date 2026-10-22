"use client";

import Link from "next/link";
import { CLASS_INFO } from "@/lib/class-info";
import { groupStatus, readyToTest, type GroupStatus } from "@/lib/readiness";
import { getPool } from "@/lib/pools";
import type { LicenseClass } from "@/lib/pool-types";
import { useBench } from "./bench-provider";

const STATUS_LABEL: Record<GroupStatus, string> = {
  unseen: "Unseen",
  shaky: "Shaky",
  learned: "Learned",
  solid: "Solid",
};

export function Syllabus({ licenseClass }: { licenseClass: LicenseClass }) {
  const { progress } = useBench();
  const pool = getPool(licenseClass);
  return (
    <div className="space-y-8">
      {pool.subelements.map((subelement) => (
        <section key={subelement.id}>
          <h2 className="display text-3xl">
            {subelement.id} · {subelement.title}
          </h2>
          <p className="text-ink-soft">{subelement.examQuestions} exam questions, one from each group.</p>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
            {pool.groups
              .filter((group) => group.subelement === subelement.id)
              .map((group) => {
                const status = groupStatus(pool, progress, group.id);
                return (
                  <li key={group.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <Link href={`/license/${licenseClass}/study/${group.subelement}/${group.id}`} className="text-lg">
                      <span className="num text-ink-soft">{group.id}</span> {group.title}
                    </Link>
                    <span className="text-sm uppercase tracking-wide text-ink-soft">{STATUS_LABEL[status]}</span>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ProgressBoard() {
  const { progress, ready } = useBench();
  if (!ready) return <p>Opening your progress.</p>;
  return (
    <div className="space-y-10">
      {(["technician", "general", "extra"] as const).map((licenseClass) => {
        const pool = getPool(licenseClass);
        const cold = pool.groups.filter((group) => {
          const status = groupStatus(pool, progress, group.id);
          return status === "unseen" || status === "shaky";
        });
        const labCounts = new Map<string, number>();
        for (const group of cold) {
          const lab = pool.questions.find((question) => question.group === group.id && question.lab)?.lab;
          if (!lab || lab === "bands") continue;
          labCounts.set(lab, (labCounts.get(lab) ?? 0) + 1);
        }
        const labs = [...labCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
        const verdict = readyToTest(pool, progress);
        return (
          <section key={licenseClass} className="rounded-3xl border border-line bg-card p-6">
            <h2 className={`display text-4xl ${CLASS_INFO[licenseClass].tone}`}>{CLASS_INFO[licenseClass].name}</h2>
            <p className="mt-2 text-lg">{verdict.ready ? "This pool meets the ready-to-test bar." : "Not at the ready-to-test bar yet."}</p>
            {!verdict.ready ? (
              <ul className="mt-2 list-disc pl-5 text-ink-soft">
                {verdict.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            <h3 className="mt-6 text-xl">Cold groups</h3>
            <ul className="mt-2 space-y-1">
              {cold.slice(0, 8).map((group) => (
                <li key={group.id}>
                  <Link href={`/license/${licenseClass}/study/${group.subelement}/${group.id}`}>
                    {group.id} · {group.title}
                  </Link>
                </li>
              ))}
              {cold.length === 0 ? <li>None. Every group is learned or solid.</li> : null}
            </ul>
            <h3 className="mt-6 text-xl">Three labs that would warm them</h3>
            <ul className="mt-2 flex flex-wrap gap-3">
              {labs.map(([slug]) => (
                <li key={slug}>
                  <Link href={`/labs/${slug}?class=${licenseClass}`} className="rounded-full border border-line px-4 py-2">
                    {slug}
                  </Link>
                </li>
              ))}
              {labs.length === 0 ? <li>The cold groups are rules and operating, so the next step is another pass through the questions.</li> : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
