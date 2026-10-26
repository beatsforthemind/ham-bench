"use client";

import Link from "next/link";
import { CLASS_INFO } from "@/lib/class-info";
import { benchHomeAction, nextColdCard, nextColdIdea, resumeAction, type HomeStudyGroup } from "@/lib/home-action";
import { pools } from "@/lib/pools";
import type { LicenseClass } from "@/lib/pool-types";
import { EMPTY_PROGRESS, groupStatus } from "@/lib/readiness";
import { useBench } from "./bench-provider";
import { QuestionPicture } from "./question-picture";

const CLASSES = ["technician", "general", "extra"] as const;

function groupLink(licenseClass: LicenseClass, subelement: string): string {
  const group = pools[licenseClass].groups.find((item) => item.subelement === subelement);
  return group ? `/license/${licenseClass}/study/${group.subelement}/${group.id}` : `/license/${licenseClass}/study`;
}

export function BenchHome() {
  const { progress, session, ready, settings, setSettings } = useBench();
  const tech = pools.technician;
  const level = (subelement: string) => {
    const groups = tech.groups.filter((group) => group.subelement === subelement);
    if (groups.length === 0) return 0.2;
    return (
      groups.reduce((sum, group) => {
        const status = groupStatus(tech, progress, group.id);
        if (status === "solid") return sum + 1;
        if (status === "learned") return sum + 0.72;
        if (status === "shaky") return sum + 0.4;
        return sum + 0.12;
      }, 0) / groups.length
    );
  };
  const deskClass: LicenseClass = ready ? settings.studyClass : "technician";
  const deskProgress = ready ? progress : EMPTY_PROGRESS;
  const generalLit = pools.general.groups.some((group) => groupStatus(pools.general, progress, group.id) !== "unseen");
  const extraLit = pools.extra.groups.some((group) => groupStatus(pools.extra, progress, group.id) !== "unseen");
  const action = benchHomeAction(ready, settings.studyClass);
  const resume = ready ? resumeAction(session) : null;
  const idea = nextColdIdea(deskClass, deskProgress);
  const card = nextColdCard(deskClass, deskProgress);
  const scopeHref = nextColdIdea("general", deskProgress)?.href ?? "/license/general/study";
  const parts = [
    { name: "License", href: groupLink("technician", "T1") },
    { name: "Meters", href: "/labs/ohms?class=technician" },
    { name: "Schematic", href: "/labs/schematics?class=technician" },
    { name: "Sky", href: "/labs/propagation?class=technician" },
    { name: "Antenna", href: "/labs/antenna?class=technician" },
    { name: "Ground", href: "/labs/safety?class=technician" },
    { name: "Scope", href: scopeHref },
    { name: "Smith chart", href: "/labs/smith" },
  ];

  return (
    <div className="space-y-8">
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="max-w-xl space-y-5">
          <header className="space-y-2">
            <h1 className="display text-4xl text-walnut sm:text-5xl">Learn it on the bench.</h1>
            <p className="text-lg text-ink-soft">Move a radio idea until the exam answer falls out. A card keeps the fact.</p>
          </header>
          <Link
            href={action.href}
            onClick={() => {
              if (settings.studyClass !== action.studyClass) setSettings({ studyClass: action.studyClass });
            }}
            className="inline-block max-w-full min-h-11 rounded-full bg-walnut px-5 py-2.5 text-center leading-snug text-paper no-underline"
          >
            {action.label}
          </Link>
          <p className="flex flex-wrap gap-x-5 gap-y-2 text-ink-soft">
            {resume ? (
              <Link href={resume.href} className="inline-flex min-h-11 items-center underline">
                {resume.label}
              </Link>
            ) : null}
            <Link href={`/license/${deskClass}/exam`} className="inline-flex min-h-11 items-center underline">
              Take a mock exam
            </Link>
          </p>
        </div>
        <div className="space-y-3">
          <Station
            license={level("T1")}
            meters={level("T5")}
            parts={level("T6")}
            sky={level("T3")}
            antenna={level("T9")}
            ground={level("T0")}
            scope={generalLit ? 0.9 : 0.18}
            smith={extraLit ? 0.9 : 0.15}
          />
          <nav aria-label="Bench parts" className="flex flex-wrap gap-x-4 gap-y-1">
            {parts.map((part) => (
              <Link key={part.name} href={part.href} className="inline-flex min-h-11 items-center text-ink-soft underline">
                {part.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <section aria-label="Next study" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <StudyShelf kicker="On the air" empty="The radio ideas in this class are warm." group={idea} />
          <StudyShelf kicker="For the exam" empty="The exam cards in this class are warm." group={card} showPicture />
        </div>
        <Link href={`/license/${deskClass}/study`} className="inline-flex min-h-11 items-center underline">
          Open the study map
        </Link>
      </section>
      <nav aria-label="Choose a license class" className="flex flex-wrap items-center gap-x-2 text-lg">
        {CLASSES.map((licenseClass, index) => (
          <span key={licenseClass} className="inline-flex items-center gap-x-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-ink-soft">
                ·
              </span>
            ) : null}
            <button
              type="button"
              aria-pressed={licenseClass === deskClass}
              onClick={() => {
                if (!ready || settings.studyClass === licenseClass) return;
                setSettings({ studyClass: licenseClass });
              }}
              className={`inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 ${licenseClass === deskClass ? "font-semibold text-walnut" : "text-ink-soft"}`}
            >
              {CLASS_INFO[licenseClass].name}
            </button>
          </span>
        ))}
      </nav>
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
        <Link href="/bands" className="inline-flex min-h-11 items-center underline">
          Bands
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/labs" className="inline-flex min-h-11 items-center underline">
          Labs
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/about/sources" className="inline-flex min-h-11 items-center underline">
          Sources
        </Link>
      </p>
    </div>
  );
}

function StudyShelf({
  kicker,
  empty,
  group,
  showPicture = false,
}: {
  kicker: string;
  empty: string;
  group: HomeStudyGroup | null;
  showPicture?: boolean;
}) {
  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <h2 className="display text-3xl">{kicker}</h2>
      {group ? (
        <>
          <p className="num mt-3 text-sm text-ink-soft">{group.id}</p>
          <h3 className="text-xl">{group.title}</h3>
          {group.labTitle ? (
            <p className="mt-2 text-ink-soft">
              {group.labTitle}. {group.labSummary}
            </p>
          ) : null}
          {showPicture && group.pictureId ? <QuestionPicture questionId={group.pictureId} /> : null}
          <Link href={group.href} className="mt-3 inline-flex min-h-11 items-center underline">
            Open this group
          </Link>
        </>
      ) : (
        <p className="mt-3 text-ink-soft">{empty}</p>
      )}
    </section>
  );
}

function Station(props: {
  license: number;
  meters: number;
  parts: number;
  sky: number;
  antenna: number;
  ground: number;
  scope: number;
  smith: number;
}) {
  const lit = [
    props.license > 0.35 ? "license" : null,
    props.meters > 0.35 ? "meters" : null,
    props.parts > 0.35 ? "schematic" : null,
    props.sky > 0.35 ? "sky" : null,
    props.antenna > 0.35 ? "antenna" : null,
    props.ground > 0.35 ? "ground" : null,
    props.scope > 0.35 ? "scope" : null,
    props.smith > 0.35 ? "Smith chart" : null,
  ].filter((part) => part != null);
  return (
    <svg
      viewBox="0 0 800 460"
      role="img"
      aria-label={`A lamp-lit radio bench. Lit: ${lit.length > 0 ? lit.join(", ") : "the lamp"}.`}
      className="mx-auto w-full max-w-lg"
    >
      <defs>
        <linearGradient id="bench-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1e2a3a" />
          <stop offset="1" stopColor="#6d533c" />
        </linearGradient>
        <radialGradient id="bench-lamp" cx="168" cy="72" r="190" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8fce9f" stopOpacity="0.75" />
          <stop offset="1" stopColor="#8fce9f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="300" fill="url(#bench-sky)" opacity={0.35 + props.sky * 0.65} />
      <rect width="800" height="300" fill="url(#bench-lamp)" />
      <ellipse cx="620" cy="78" rx="36" ry="36" fill="#f0d7a4" opacity={props.sky} />
      <path d="M40 250 C180 180 280 210 400 160 C520 110 640 150 760 90" fill="none" stroke="#d7c4a4" strokeWidth="3" opacity={props.sky} />
      <rect x="40" y="250" width="720" height="28" rx="6" fill="#5a3b2a" />
      <rect x="70" y="278" width="16" height="90" fill="#3a2a22" />
      <rect x="700" y="278" width="16" height="90" fill="#3a2a22" />
      <rect x="120" y="168" width="250" height="82" rx="10" fill="#2a2118" opacity={0.35 + props.meters * 0.65} />
      <circle cx="180" cy="209" r="28" fill="#14110e" stroke="#c47a2c" strokeWidth="3" opacity={props.meters} />
      <circle cx="250" cy="209" r="28" fill="#14110e" stroke="#c47a2c" strokeWidth="3" opacity={props.meters} />
      <line x1="180" y1="209" x2="196" y2="192" stroke="#f4efe6" strokeWidth="2" opacity={props.meters} />
      <line x1="250" y1="209" x2="236" y2="190" stroke="#f4efe6" strokeWidth="2" opacity={props.meters} />
      <rect x="400" y="150" width="120" height="100" rx="8" fill="#fbf7f0" stroke="#3a2a22" opacity={0.3 + props.parts * 0.7} />
      <path d="M420 190 h30 l8 -14 l16 28 l8 -14 h20" fill="none" stroke="#3a2a22" strokeWidth="2" opacity={props.parts} />
      <circle cx="470" cy="214" r="12" fill="none" stroke="#3a2a22" strokeWidth="2" opacity={props.parts} />
      <rect x="150" y="118" width="86" height="50" rx="4" fill="#f4efe6" stroke="#3f6b4e" opacity={props.license} />
      <text x="160" y="148" fill="#3f6b4e" fontSize="14" opacity={props.license}>
        LICENSE
      </text>
      <rect x="560" y="120" width="70" height="46" rx="4" fill="#102033" stroke="#c47a2c" opacity={props.scope} />
      <path d="M570 148 q16 -24 32 0" fill="none" stroke="#e7c27a" strokeWidth="2" opacity={props.scope} />
      <circle cx="680" cy="150" r="34" fill="none" stroke="#1e3a5f" strokeWidth="3" opacity={props.smith} />
      <line x1="648" y1="150" x2="712" y2="150" stroke="#1e3a5f" opacity={props.smith} />
      <line x1="470" y1="250" x2="560" y2="70" stroke="#2a211c" strokeWidth="4" opacity={0.2 + props.antenna * 0.8} />
      <path d="M560 70 l-18 22 h36 z" fill="#2a211c" opacity={props.antenna} />
      <line x1="250" y1="278" x2="250" y2="360" stroke="#6d533c" strokeWidth="4" opacity={props.ground} />
      <path d="M230 360 h40 M236 370 h28 M242 380 h16" fill="none" stroke="#6d533c" strokeWidth="3" opacity={props.ground} />
      <line x1="168" y1="16" x2="168" y2="52" stroke="#8fce9f" strokeWidth="4" />
      <path d="M140 52 h56 l-12 20 h-32 z" fill="#8fce9f" />
    </svg>
  );
}
