"use client";

import Link from "next/link";
import { groupStatus } from "@/lib/readiness";
import { pools } from "@/lib/pools";
import { useBench } from "./bench-provider";

export function BenchHome() {
  const { progress, session, ready } = useBench();
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
  const generalLit = pools.general.groups.some((group) => groupStatus(pools.general, progress, group.id) !== "unseen");
  const extraLit = pools.extra.groups.some((group) => groupStatus(pools.extra, progress, group.id) !== "unseen");
  const resume =
    ready && session && !session.result ? (
      <Link
        href={`/license/${session.paper.licenseClass}/exam`}
        className="inline-flex rounded-full bg-amber px-4 py-2 text-walnut-deep"
      >
        Resume the {session.paper.licenseClass} paper
      </Link>
    ) : null;

  return (
    <section className="grid items-center gap-6 lg:grid-cols-[1.3fr_0.7fr]">
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
      <div className="space-y-4">
        <p className="text-lg text-ink-soft">
          The station fills in as the groups get learned. Rules hang the license, the meters wake up, the schematic gets parts, the antenna goes up, and the ground rod goes in.
        </p>
        {resume}
        <p className="text-sm text-ink-soft">General and Extra light the scope and the Smith chart once those pools have been touched.</p>
      </div>
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
  return (
    <svg viewBox="0 0 800 460" role="img" aria-label="A lamp-lit radio bench" className="w-full">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1e2a3a" />
          <stop offset="1" stopColor="#6d533c" />
        </linearGradient>
        <radialGradient id="lamp" cx="0.5" cy="0.2" r="0.8">
          <stop offset="0" stopColor="#f3d7a1" />
          <stop offset="1" stopColor="#f3d7a1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="300" fill="url(#sky)" opacity={0.35 + props.sky * 0.65} />
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
      <ellipse cx="250" cy="40" rx="220" ry="80" fill="url(#lamp)" />
    </svg>
  );
}
