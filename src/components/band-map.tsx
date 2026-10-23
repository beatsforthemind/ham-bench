"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CLASS_INFO, classAtLeast } from "@/lib/class-info";
import { EXAM_BANDS, EXAM_CALLOUTS, PART_97, SEGMENTS, legalOn, type Emission } from "@/lib/bands";
import { isLicenseClass } from "@/lib/pools";
import type { LicenseClass } from "@/lib/pool-types";
import { useBench } from "./bench-provider";

const MODES: Emission[] = ["phone", "cw", "data"];

export function BandMap() {
  const { ready } = useBench();
  const search = useSearchParams();
  if (!ready) return <p>Opening the band map.</p>;
  const rawSideband = search.get("sideband");
  const sideband = rawSideband === "lsb" ? "lsb" : rawSideband === "usb" || rawSideband === "3" ? "usb" : null;
  return <BandMapReady classQuery={search.get("class")} mhzQuery={search.get("mhz")} sideband={sideband} />;
}

function BandMapReady({ classQuery, mhzQuery, sideband }: { classQuery: string | null; mhzQuery: string | null; sideband: "usb" | "lsb" | null }) {
  const { settings, setFrequency } = useBench();
  const [bandId, setBandId] = useState<(typeof EXAM_BANDS)[number]["id"]>("10");
  const initialClass = classQuery && isLicenseClass(classQuery) ? classQuery : settings.studyClass;
  const parsedMhz = mhzQuery == null || mhzQuery === "" ? settings.frequencyMhz : Number(mhzQuery);
  const initialMhz = parsedMhz > 0 ? parsedMhz : settings.frequencyMhz;
  const [license, setLicense] = useState<LicenseClass>(initialClass);
  const [mode, setMode] = useState<Emission>("phone");
  const [mhzText, setMhzText] = useState(String(initialMhz));
  const mhz = Number(mhzText);
  const frequency = Number.isFinite(mhz) && mhz > 0 ? mhz : 0;
  const band = EXAM_BANDS.find((item) => item.id === bandId) ?? EXAM_BANDS[0]!;
  const verdict = useMemo(
    () => (frequency > 0 ? legalOn(frequency, license, mode) : { allowed: false, why: "Enter a frequency above 0 MHz." }),
    [frequency, license, mode],
  );
  const rows = (["extra", "general", "technician"] as const).map((row) =>
    SEGMENTS.filter((segment) => segment.end >= band.start && segment.start <= band.end && classAtLeast(row, segment.min) && segment.min === row),
  );

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
            aria-pressed={item.id === band.id}
            className={`min-h-11 rounded-full px-4 ${item.id === band.id ? "bg-walnut text-paper" : "border border-line"}`}
            onClick={() => setBandId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-3 rounded-3xl border border-line bg-card p-4">
        {(["extra", "general", "technician"] as const).map((row, rowIndex) => (
          <div key={row} className="grid grid-cols-[7rem_1fr] items-center gap-3">
            <span className={CLASS_INFO[row].tone}>{CLASS_INFO[row].name}</span>
            <div className="relative h-8 rounded-full bg-paper-deep">
              {rows[rowIndex]!.map((segment) => {
                const left = ((Math.max(segment.start, band.start) - band.start) / (band.end - band.start)) * 100;
                const right = ((Math.min(segment.end, band.end) - band.start) / (band.end - band.start)) * 100;
                const tone = segment.phone ? "bg-amber-deep" : segment.data ? "bg-sage" : "bg-walnut";
                return (
                  <span
                    key={`${row}-${segment.name}-${segment.start}-${segment.phone}`}
                    className={`absolute top-1 h-6 rounded-full ${tone}`}
                    style={{ left: `${left}%`, width: `${Math.max(right - left, 0.8)}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-sm text-ink-soft">Amber is phone. Green is data or RTTY. Walnut is CW only. A class also keeps the privileges of the rows below it.</p>
        {sideband ? <SidebandStrip kind={sideband} /> : null}
      </div>
      <ul className="space-y-2">
        {rows.flat().map((segment) => {
          const selected = frequency >= segment.start && frequency <= segment.end;
          return (
            <li key={`${segment.min}-${segment.name}-${segment.start}-${segment.phone}`}>
              <button
                type="button"
                aria-pressed={selected}
                className="min-h-11 w-full rounded-2xl border border-line bg-card px-4 py-2 text-left"
                onClick={() => setMhzText(String(segment.start))}
              >
                {segment.name}, {segment.start}–{segment.end} MHz, {segment.min}. {segment.citation}
              </button>
            </li>
          );
        })}
      </ul>
      <form
        className="grid gap-4 rounded-3xl border border-line bg-card p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (frequency > 0) setFrequency(frequency);
        }}
      >
        <label className="block text-base">
          Frequency, MHz
          <input
            data-testid="band-mhz"
            className="num mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base"
            value={mhzText}
            onChange={(event) => setMhzText(event.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block text-base">
          License
          <select className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base" value={license} onChange={(event) => setLicense(event.target.value as LicenseClass)}>
            <option value="technician">Technician</option>
            <option value="general">General</option>
            <option value="extra">Extra</option>
          </select>
        </label>
        <label className="block text-base">
          Emission
          <select className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base" value={mode} onChange={(event) => setMode(event.target.value as Emission)}>
            {MODES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          data-testid="band-check"
          className="min-h-11 self-end rounded-full bg-walnut px-4 text-paper"
          onClick={() => {
            if (frequency > 0) setFrequency(frequency);
          }}
        >
          Check this spot
        </button>
      </form>
      <output data-testid="band-result" className="block text-2xl">
        {verdict.allowed ? "Yes. " : "No. "}
        {verdict.why}
      </output>
      <ul className="space-y-2 text-ink-soft">
        {EXAM_CALLOUTS.filter((item) => item.band === band.id).map((item) => (
          <li key={item.text}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}

function SidebandStrip({ kind }: { kind: "usb" | "lsb" }) {
  const lower = kind === "lsb";
  return (
    <div className="space-y-2 border-t border-line pt-3">
      <h2 className="text-xl">A 3 kHz sideband</h2>
      <div className="relative h-10 rounded-full bg-paper" aria-hidden="true">
        <span className="absolute top-2 h-6 rounded-full bg-amber-deep" style={{ left: lower ? "26%" : "42%", width: "16%" }} />
        <span className="absolute top-1 h-8 w-0.5 bg-ink" style={{ left: "42%" }} />
      </div>
      <p>
        {lower
          ? "The mark is the carrier. The shade is about 3 kHz of lower sideband, below the carrier. The carrier sits at least a full signal-width above the lower edge."
          : "The mark is the carrier. The shade is about 3 kHz of upper sideband. The whole signal has to stay inside the segment, so the carrier sits a full signal-width inside the band edge."}
      </p>
    </div>
  );
}
