"use client";

import { useMemo, useState } from "react";
import { CLASS_INFO, classAtLeast } from "@/lib/class-info";
import { EXAM_BANDS, EXAM_CALLOUTS, PART_97, SEGMENTS, legalOn, type Emission } from "@/lib/bands";
import type { LicenseClass } from "@/lib/pool-types";
import { useBench } from "./bench-provider";

const MODES: Emission[] = ["phone", "cw", "data"];

export function BandMap() {
  const { settings, setFrequency, ready } = useBench();
  const [bandId, setBandId] = useState<(typeof EXAM_BANDS)[number]["id"]>("10");
  const [license, setLicense] = useState<LicenseClass>(settings.studyClass);
  const [mode, setMode] = useState<Emission>("phone");
  const [mhzText, setMhzText] = useState("28.4");
  const mhz = Number(mhzText);
  const frequency = Number.isFinite(mhz) ? mhz : 0;
  const band = EXAM_BANDS.find((item) => item.id === bandId) ?? EXAM_BANDS[0]!;
  const verdict = useMemo(() => legalOn(frequency, license, mode), [frequency, license, mode]);

  if (!ready) return <p>Opening the band map.</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        {PART_97.sections}, {PART_97.region}, snapshot {PART_97.asOf}. {PART_97.note}
      </p>
      <div className="flex flex-wrap gap-2">
        {EXAM_BANDS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`rounded-full px-4 py-2 ${item.id === band.id ? "bg-walnut text-paper" : "border border-line"}`}
            onClick={() => setBandId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-3 rounded-3xl border border-line bg-card p-4">
        {(["extra", "general", "technician"] as const).map((row) => (
          <div key={row} className="grid grid-cols-[7rem_1fr] items-center gap-3">
            <span className={CLASS_INFO[row].tone}>{CLASS_INFO[row].name}</span>
            <div className="relative h-8 rounded-full bg-paper-deep">
              {SEGMENTS.filter(
                (segment) => segment.end >= band.start && segment.start <= band.end && classAtLeast(row, segment.min) && segment.min === row,
              ).map((segment) => {
                const left = ((Math.max(segment.start, band.start) - band.start) / (band.end - band.start)) * 100;
                const right = ((Math.min(segment.end, band.end) - band.start) / (band.end - band.start)) * 100;
                const tone = segment.phone ? "bg-amber" : segment.data ? "bg-sage" : "bg-walnut";
                return (
                  <span
                    key={`${row}-${segment.name}-${segment.start}-${segment.phone}`}
                    className={`absolute top-1 h-6 rounded-full opacity-80 ${tone}`}
                    style={{ left: `${left}%`, width: `${Math.max(right - left, 0.8)}%` }}
                    title={`${segment.name} ${segment.citation}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-sm text-ink-soft">Amber is phone. Green is data or RTTY. Walnut is CW only. A class also keeps the privileges of the rows below it.</p>
      </div>
      <form
        className="grid gap-4 rounded-3xl border border-line bg-card p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          setFrequency(frequency);
        }}
      >
        <label className="block">
          Frequency, MHz
          <input
            data-testid="band-mhz"
            className="num mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
            value={mhzText}
            onChange={(event) => setMhzText(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block">
          License
          <select className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" value={license} onChange={(event) => setLicense(event.target.value as LicenseClass)}>
            <option value="technician">Technician</option>
            <option value="general">General</option>
            <option value="extra">Extra</option>
          </select>
        </label>
        <label className="block">
          Emission
          <select className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" value={mode} onChange={(event) => setMode(event.target.value as Emission)}>
            {MODES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button type="button" data-testid="band-check" className="self-end rounded-full bg-walnut px-4 py-2 text-paper" onClick={() => setFrequency(frequency)}>
          Check this spot
        </button>
      </form>
      <p data-testid="band-result" className="text-2xl">
        {verdict.allowed ? "Yes. " : "No. "}
        {verdict.why}
      </p>
      <ul className="space-y-2 text-ink-soft">
        {EXAM_CALLOUTS.filter((item) => item.band === band.id).map((item) => (
          <li key={item.text}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}
