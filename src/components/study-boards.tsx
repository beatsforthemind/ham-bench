"use client";

import Link from "next/link";
import { CLASS_INFO } from "@/lib/class-info";
import { labBySlug } from "@/lib/labs-catalog";
import { groupStatus, readyToTest, type GroupStatus } from "@/lib/readiness";
import { poolForToday } from "@/lib/pools";
import type { LicenseClass, PoolFile, PoolGroup } from "@/lib/pool-types";
import { useBench } from "./bench-provider";

const STATUS_LABEL: Record<GroupStatus, string> = {
  unseen: "Unseen",
  shaky: "Shaky",
  learned: "Learned",
  solid: "Solid",
};

function laneCount(pool: PoolFile, group: PoolGroup, lane: "card" | "bench"): number {
  return pool.questions.filter((question) => question.group === group.id && question.lane === lane).length;
}

function laneLabel(count: number, lane: "card" | "bench"): string {
  if (lane === "card") return count === 1 ? "1 card" : `${count} cards`;
  return count === 1 ? "1 idea" : `${count} ideas`;
}

function GroupRow({ href, id, title, detail, status }: { href: string; id: string; title: string; detail: string | null; status: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-11 w-full items-center gap-3 px-4 py-3 no-underline">
        <span className="num shrink-0 text-ink-soft">{id}</span>
        <span className="min-w-0 flex-1 truncate text-lg md:overflow-visible md:whitespace-normal">{title}</span>
        {detail ? <span className="shrink-0 text-sm text-ink-soft">{detail}</span> : null}
        <span className="shrink-0 text-sm uppercase tracking-wide text-ink-soft">{status}</span>
      </Link>
    </li>
  );
}

export function Syllabus({ licenseClass }: { licenseClass: LicenseClass }) {
  const { progress } = useBench();
  const pool = poolForToday(licenseClass);
  if (!pool) return <p>This pool is not in force, so the study map stays closed.</p>;
  const cards = pool.questions.filter((question) => question.lane === "card");
  const ideas = pool.questions.filter((question) => question.lane === "bench");
  const ideaGroups = pool.groups.filter((group) => laneCount(pool, group, "bench") > 0);
  const cardGroups = pool.groups.filter((group) => laneCount(pool, group, "card") > 0);
  const labCounts = new Map<string, number>();
  for (const question of ideas) {
    if (!question.lab) continue;
    labCounts.set(question.lab, (labCounts.get(question.lab) ?? 0) + 1);
  }
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="display text-4xl">On the air</h2>
        <p className="text-xl">
          {ideas.length} radio ideas across {ideaGroups.length} groups. Learn the idea once, then the letter follows.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {[...labCounts.entries()].map(([slug, count]) => {
            const lab = labBySlug(slug);
            return (
              <Link key={slug} href={`/labs/${slug}?class=${licenseClass}`} className="rounded-3xl border border-line bg-card p-4 no-underline">
                <h3 className="display text-2xl">{lab?.title ?? slug}</h3>
                <p className="mt-1 text-ink-soft">{lab?.summary}</p>
                <p className="num mt-2 text-sm">{count} questions</p>
              </Link>
            );
          })}
        </div>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {ideaGroups.map((group) => {
            const count = laneCount(pool, group, "bench");
            const status = groupStatus(pool, progress, group.id);
            const mixed = count !== pool.questions.filter((question) => question.group === group.id).length;
            return (
              <GroupRow
                key={group.id}
                href={`/license/${licenseClass}/study/${group.subelement}/${group.id}`}
                id={group.id}
                title={group.title}
                detail={mixed ? laneLabel(count, "bench") : null}
                status={STATUS_LABEL[status]}
              />
            );
          })}
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="display text-4xl">For the exam</h2>
        <p className="text-xl">
          {cards.length} cards in {cardGroups.length} groups. A mock still draws one question from every group, so the paper mixes both shelves.
        </p>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {cardGroups.map((group) => {
            const count = laneCount(pool, group, "card");
            const status = groupStatus(pool, progress, group.id);
            const mixed = count !== pool.questions.filter((question) => question.group === group.id).length;
            return (
              <GroupRow
                key={group.id}
                href={`/license/${licenseClass}/study/${group.subelement}/${group.id}`}
                id={group.id}
                title={group.title}
                detail={mixed ? laneLabel(count, "card") : null}
                status={STATUS_LABEL[status]}
              />
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export function ProgressBoard() {
  const { progress, ready } = useBench();
  if (!ready) return <p>Opening your progress.</p>;
  return (
    <div className="space-y-10">
      {(["technician", "general", "extra"] as const).map((licenseClass) => {
        const pool = poolForToday(licenseClass);
        if (!pool) {
          return (
            <section key={licenseClass} className="rounded-3xl border border-line bg-card p-6">
              <h2 className={`display text-4xl ${CLASS_INFO[licenseClass].tone}`}>{CLASS_INFO[licenseClass].name}</h2>
              <p className="mt-2 text-lg">This pool is not in force.</p>
            </section>
          );
        }
        const cold = pool.groups.filter((group) => {
          const status = groupStatus(pool, progress, group.id);
          return status === "unseen" || status === "shaky";
        });
        const coldCards = cold.filter((group) => pool.questions.some((question) => question.group === group.id && question.lane === "card"));
        const coldIdeas = cold.filter((group) => pool.questions.some((question) => question.group === group.id && question.lane === "bench"));
        const labCounts = new Map<string, number>();
        for (const group of coldIdeas) {
          for (const question of pool.questions.filter((item) => item.group === group.id && item.lane === "bench" && item.lab)) {
            labCounts.set(question.lab!, (labCounts.get(question.lab!) ?? 0) + 1);
          }
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
            <h3 className="mt-6 text-xl">Cold exam cards</h3>
            <ul className="mt-2 space-y-1">
              {coldCards.slice(0, 6).map((group) => (
                <li key={group.id}>
                  <Link href={`/license/${licenseClass}/study/${group.subelement}/${group.id}`} className="flex min-h-11 items-center gap-2 no-underline">
                    <span className="num shrink-0">{group.id}</span>
                    <span className="min-w-0 truncate md:overflow-visible md:whitespace-normal">{group.title}</span>
                  </Link>
                </li>
              ))}
              {coldCards.length === 0 ? <li>None.</li> : null}
            </ul>
            <h3 className="mt-6 text-xl">Cold radio ideas</h3>
            <ul className="mt-2 space-y-1">
              {coldIdeas.slice(0, 6).map((group) => (
                <li key={group.id}>
                  <Link href={`/license/${licenseClass}/study/${group.subelement}/${group.id}`} className="flex min-h-11 items-center gap-2 no-underline">
                    <span className="num shrink-0">{group.id}</span>
                    <span className="min-w-0 truncate md:overflow-visible md:whitespace-normal">{group.title}</span>
                  </Link>
                </li>
              ))}
              {coldIdeas.length === 0 ? <li>None.</li> : null}
            </ul>
            <h3 className="mt-6 text-xl">Three labs that would warm them</h3>
            <ul className="mt-2 flex flex-wrap gap-3">
              {labs.map(([slug]) => (
                <li key={slug}>
                  <Link href={`/labs/${slug}?class=${licenseClass}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 no-underline">
                    {slug}
                  </Link>
                </li>
              ))}
              {labs.length === 0 && coldCards.length > 0 && coldIdeas.length === 0 ? <li>The cold groups are exam cards, so the next step is another pass through those facts.</li> : null}
              {labs.length === 0 && coldIdeas.length > 0 ? <li>Practice those questions.</li> : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
