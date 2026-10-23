import { classAtLeast } from "./class-info";
import type { LicenseClass } from "./pool-types";

export const PART_97 = {
  asOf: "2026-02-13",
  sections: "47 CFR 97.301, 97.305, and 97.307",
  region: "ITU Region 2",
  note: "Edges are from the saved eCFR extract. Repeater offsets and emission widths below are exam callouts, not additional allocations.",
};

export type Emission = "phone" | "cw" | "data";

type Segment = {
  name: string;
  start: number;
  end: number;
  min: LicenseClass;
  phone: boolean;
  cw: boolean;
  data: boolean;
  citation: string;
};

const cw = { phone: false, cw: true, data: false };
const data = { phone: false, cw: true, data: true };
const phone = { phone: true, cw: true, data: false };
const wide = { phone: true, cw: true, data: true };

export const SEGMENTS: Segment[] = [
  { name: "2200 m", start: 0.1357, end: 0.1378, min: "general", ...wide, citation: "97.301(b), 97.301(d)" },
  { name: "630 m", start: 0.472, end: 0.479, min: "general", ...wide, citation: "97.301(b), 97.301(d)" },
  { name: "160 m", start: 1.8, end: 2.0, min: "general", ...wide, citation: "97.301(d), 97.305(c)" },
  { name: "80 m", start: 3.5, end: 3.6, min: "extra", ...data, citation: "97.301(b), 97.305(c)(3)" },
  { name: "80 m", start: 3.525, end: 3.6, min: "general", ...data, citation: "97.301(d), 97.305(c)(3)" },
  { name: "80 m", start: 3.525, end: 3.6, min: "technician", ...cw, citation: "97.301(e), 97.307(f)(9)" },
  { name: "75 m", start: 3.6, end: 4.0, min: "extra", ...phone, citation: "97.301(b), 97.305(c)(3)" },
  { name: "75 m", start: 3.8, end: 4.0, min: "general", ...phone, citation: "97.301(d), 97.305(c)(3)" },
  { name: "60 m", start: 5.3515, end: 5.3665, min: "general", ...wide, citation: "97.301(d) and 97.303(h). This contiguous segment is separate from the four channels." },
  { name: "40 m", start: 7.0, end: 7.125, min: "extra", ...data, citation: "97.301(b), 97.305(c)(3)" },
  { name: "40 m", start: 7.025, end: 7.125, min: "general", ...data, citation: "97.301(d), 97.305(c)(3)" },
  { name: "40 m", start: 7.025, end: 7.125, min: "technician", ...cw, citation: "97.301(e), 97.307(f)(9)" },
  { name: "40 m", start: 7.125, end: 7.3, min: "extra", ...phone, citation: "97.301(b), 97.305(c)(3)" },
  { name: "40 m", start: 7.175, end: 7.3, min: "general", ...phone, citation: "97.301(d), 97.305(c)(3)" },
  { name: "30 m", start: 10.1, end: 10.15, min: "general", ...data, citation: "97.301(d), 97.305(c)(3)" },
  { name: "20 m", start: 14.0, end: 14.15, min: "extra", ...data, citation: "97.301(b), 97.305(c)(3)" },
  { name: "20 m", start: 14.025, end: 14.15, min: "general", ...data, citation: "97.301(d), 97.305(c)(3)" },
  { name: "20 m", start: 14.15, end: 14.35, min: "extra", ...phone, citation: "97.301(b), 97.305(c)(3)" },
  { name: "20 m", start: 14.225, end: 14.35, min: "general", ...phone, citation: "97.301(d), 97.305(c)(3)" },
  { name: "17 m", start: 18.068, end: 18.11, min: "general", ...data, citation: "97.301(d), 97.305(c)(3)" },
  { name: "17 m", start: 18.11, end: 18.168, min: "general", ...phone, citation: "97.301(d), 97.305(c)(3)" },
  { name: "15 m", start: 21.0, end: 21.2, min: "extra", ...data, citation: "97.301(b), 97.305(c)(3)" },
  { name: "15 m", start: 21.025, end: 21.2, min: "general", ...data, citation: "97.301(d), 97.305(c)(3)" },
  { name: "15 m", start: 21.025, end: 21.2, min: "technician", ...cw, citation: "97.301(e), 97.307(f)(9)" },
  { name: "15 m", start: 21.2, end: 21.45, min: "extra", ...phone, citation: "97.301(b), 97.305(c)(3)" },
  { name: "15 m", start: 21.275, end: 21.45, min: "general", ...phone, citation: "97.301(d), 97.305(c)(3)" },
  { name: "12 m", start: 24.89, end: 24.93, min: "general", ...data, citation: "97.301(d), 97.305(c)(3)" },
  { name: "12 m", start: 24.93, end: 24.99, min: "general", ...phone, citation: "97.301(d), 97.305(c)(3)" },
  { name: "10 m", start: 28.0, end: 28.3, min: "extra", ...data, citation: "97.301(b), 97.305(c)(3)" },
  { name: "10 m", start: 28.0, end: 28.3, min: "technician", ...data, citation: "97.301(e), 97.305(c)(3)(xvii)" },
  { name: "10 m", start: 28.3, end: 28.5, min: "technician", ...phone, citation: "97.301(e), 97.305(c)(3)(xviii), 97.307(f)(10)" },
  { name: "10 m", start: 28.3, end: 29.7, min: "general", ...phone, citation: "97.301(d), 97.305(c)(3)" },
  { name: "6 m", start: 50.0, end: 50.1, min: "technician", ...cw, citation: "97.301(a), 97.305(c)(4)" },
  { name: "6 m", start: 50.1, end: 54, min: "technician", ...wide, citation: "97.301(a), 97.305(c)(4)" },
  { name: "2 m", start: 144.0, end: 144.1, min: "technician", ...cw, citation: "97.301(a), 97.305(c)(4)" },
  { name: "2 m", start: 144.1, end: 148, min: "technician", ...wide, citation: "97.301(a), 97.305(c)(4)" },
  { name: "1.25 m", start: 219, end: 220, min: "technician", phone: false, cw: false, data: true, citation: "97.301(a), 97.305(c)(4)" },
  { name: "1.25 m", start: 222, end: 225, min: "technician", ...wide, citation: "97.301(a), 97.305(c)(4)" },
  { name: "70 cm", start: 420, end: 450, min: "technician", ...wide, citation: "97.301(a), 97.305(c)(5)" },
  { name: "33 cm", start: 902, end: 928, min: "technician", ...wide, citation: "97.301(a)" },
  { name: "23 cm", start: 1240, end: 1300, min: "technician", ...wide, citation: "97.301(a)" },
];

export const EXAM_BANDS = [
  { id: "80", label: "80 and 75 m", start: 3.5, end: 4 },
  { id: "40", label: "40 m", start: 7, end: 7.3 },
  { id: "20", label: "20 m", start: 14, end: 14.35 },
  { id: "15", label: "15 m", start: 21, end: 21.45 },
  { id: "10", label: "10 m", start: 28, end: 29.7 },
  { id: "6", label: "6 m", start: 50, end: 54 },
  { id: "2", label: "2 m", start: 144, end: 148 },
  { id: "70", label: "70 cm", start: 420, end: 450 },
] as const;

export const EXAM_CALLOUTS = [
  { band: "40", text: "Phone on 7.075–7.100 MHz is limited by 97.307(f)(11) to parts of Region 2. This map does not draw that slice as ordinary phone." },
  { band: "2", text: "On the exam, a 2 meter repeater offset is 600 kHz." },
  { band: "70", text: "On the exam, a 70 centimeter repeater offset is 5 MHz." },
  { band: "10", text: "CW is the narrowest common mode, SSB is a few kilohertz, and FM is wider. Upper sideband is used on 10 meters and above." },
];

const SIXTY_METER_CHANNELS = [5.332, 5.348, 5.373, 5.405];

function onSixtyMeterChannel(mhz: number): boolean {
  return SIXTY_METER_CHANNELS.some((center) => {
    const fromCenter = Math.abs(mhz - center) * 1000;
    const fromCarrier = Math.abs(mhz - (center - 0.0015)) * 1000;
    return fromCenter <= 1.5 || fromCarrier <= 0.2;
  });
}

export function legalOn(mhz: number, license: LicenseClass, mode: Emission): { allowed: boolean; why: string } {
  if (!(mhz > 0) || !Number.isFinite(mhz)) {
    return { allowed: false, why: "Enter a frequency above 0 MHz." };
  }
  if (onSixtyMeterChannel(mhz)) {
    if (!classAtLeast(license, "general")) {
      return { allowed: false, why: "The 60 meter channels start at General. 47 CFR 97.303(h)." };
    }
    return {
      allowed: true,
      why: "60 meter channel. Phone and data carriers sit 1.5 kHz below the channel center. 47 CFR 97.303(h).",
    };
  }
  const hits = SEGMENTS.filter(
    (segment) =>
      mhz >= segment.start &&
      mhz <= segment.end &&
      classAtLeast(license, segment.min) &&
      segment[mode],
  );
  if (hits.length > 0) {
    const hit = hits[0]!;
    return {
      allowed: true,
      why: `${hit.name}, ${mode}, is available to ${license}. ${hit.citation}.`,
    };
  }
  const present = SEGMENTS.filter((segment) => mhz >= segment.start && mhz <= segment.end);
  if (present.length === 0) {
    return { allowed: false, why: "That frequency is outside the Region 2 segments on this map." };
  }
  const classOk = present.some((segment) => classAtLeast(license, segment.min));
  if (!classOk) {
    return {
      allowed: false,
      why: `${present[0]!.name} on this map starts at ${present[0]!.min}. ${present[0]!.citation}.`,
    };
  }
  return {
    allowed: false,
    why: `${mode} is not the emission this part of ${present[0]!.name} authorizes for ${license}. ${present[0]!.citation}.`,
  };
}
