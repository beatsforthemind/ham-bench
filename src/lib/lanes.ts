import type { LicenseClass } from "./pool-types";

export type Lane = "card" | "bench";

/** Groups whose questions are radio ideas unless listed in LANE_FLIP. */
const BENCH_GROUPS = new Set([
  "T3A", "T3B", "T3C", "T4A", "T5A", "T5B", "T5C", "T5D", "T6A", "T6B", "T6D",
  "T7A", "T7B", "T7C", "T7D", "T8A", "T9A", "T9B", "T0A", "T0B", "T0C",
  "G3A", "G3B", "G3C", "G4A", "G4B", "G4C", "G4D", "G4E",
  "G5A", "G5B", "G5C", "G6A", "G6B", "G7A", "G7B", "G7C", "G8A", "G8B",
  "G9A", "G9B", "G9C", "G9D",
  "E3A", "E3B", "E3C", "E4A", "E4B", "E4C", "E4D", "E4E",
  "E5A", "E5B", "E5C", "E5D", "E6A", "E6B", "E6C", "E6D", "E6F",
  "E7A", "E7B", "E7C", "E7D", "E7E", "E7F", "E7G", "E7H",
  "E8A", "E8B", "E8C", "E8D",
  "E9A", "E9B", "E9C", "E9D", "E9E", "E9F", "E9G", "E9H",
]);

/**
 * Questions that take the other lane from their group.
 * Figure questions are ideas even when a flip says card; ingest rejects that clash.
 */
export const LANE_FLIP: Record<string, Lane> = {
  T2B05: "bench",
  T3A03: "card",
  T3B08: "card",
  T3B09: "card",
  T3B10: "card",
  T4A10: "card",
  T4A12: "card",
  T4B01: "bench",
  T4B03: "bench",
  T4B04: "bench",
  T4B08: "bench",
  T4B10: "bench",
  T5A01: "card",
  T5A02: "card",
  T5A06: "card",
  T5C02: "card",
  T5C04: "card",
  T5C05: "card",
  T5C06: "card",
  T5C07: "card",
  T6A10: "card",
  T6A11: "card",
  T6B05: "card",
  T6B06: "card",
  T6B08: "card",
  T6B09: "card",
  T6B12: "card",
  T6D09: "card",
  T7D08: "card",
  T7D09: "card",
  T8A01: "card",
  T8A02: "card",
  T8A03: "card",
  T8A04: "card",
  T8A06: "card",
  T8A12: "card",
  T8B02: "bench",
  T8B07: "bench",
  T8B09: "bench",
  T8B12: "bench",
  T8C02: "bench",
  T9B01: "card",
  T9B02: "card",
  T9B06: "card",
  T9B07: "card",
  T0A03: "card",
  T0B11: "card",
  T0C06: "card",
  T0C13: "card",
  G2A06: "bench",
  G2A07: "bench",
  G2D04: "bench",
  G2D06: "bench",
  G2E14: "bench",
  G3A03: "card",
  G3A05: "card",
  G3A11: "card",
  G3A12: "card",
  G3A13: "card",
  G3B04: "card",
  G3B07: "card",
  G3B08: "card",
  G4A08: "card",
  G4A10: "card",
  G4A12: "card",
  G4B06: "card",
  G4D04: "card",
  G4D06: "card",
  G4E09: "card",
  G4E11: "card",
  G5A07: "card",
  G5A09: "card",
  G5A11: "card",
  G6A01: "card",
  G6A03: "card",
  G6A05: "card",
  G6A08: "card",
  G6B02: "card",
  G6B04: "card",
  G6B07: "card",
  G6B11: "card",
  G6B12: "card",
  G7C07: "card",
  G7C12: "card",
  G7C13: "card",
  G8A02: "card",
  G8A03: "card",
  G8A06: "card",
  G8A09: "card",
  G8B02: "card",
  G8B03: "card",
  G8C08: "bench",
  G8C09: "bench",
  G8C10: "bench",
  G8C13: "bench",
  G8C14: "bench",
  G9A03: "card",
  G9A06: "card",
  G9D12: "card",
  G0A01: "bench",
  G0A02: "bench",
  G0A04: "bench",
  G0A07: "bench",
  G0B01: "bench",
  G0B05: "bench",
  G0B12: "bench",
  E2A11: "bench",
  E3C07: "card",
  E3C08: "card",
  E3C09: "card",
  E3C10: "card",
  E3C11: "card",
  E4A03: "card",
  E4A04: "card",
  E4A07: "card",
  E4A08: "card",
  E4A11: "card",
  E4B05: "card",
  E4B10: "card",
  E4C03: "card",
  E4C07: "card",
  E4D06: "card",
  E4E04: "card",
  E4E05: "card",
  E4E13: "card",
  E4E14: "card",
  E5B02: "card",
  E6A01: "card",
  E6A04: "card",
  E6A08: "card",
  E6B04: "card",
  E6B06: "card",
  E6B09: "card",
  E6C09: "card",
  E6D08: "card",
  E6D09: "card",
  E6E01: "bench",
  E6E09: "bench",
  E6E10: "bench",
  E6E12: "bench",
  E6F10: "card",
  E6F11: "card",
  E7D03: "card",
  E7E05: "card",
  E7E06: "card",
  E7H01: "card",
  E7H08: "card",
  E7H13: "card",
  E8A01: "card",
  E8A02: "card",
  E8A06: "card",
  E8A11: "card",
  E8B07: "card",
  E8C06: "card",
  E8C08: "card",
  E8C09: "card",
  E8C14: "card",
  E8C15: "card",
  E8D02: "card",
  E8D09: "card",
  E8D10: "card",
  E8D11: "card",
  E9A03: "card",
  E0A05: "bench",
  E0A06: "bench",
  E0A08: "bench",
};

const METER_IDS = new Set(["T7D01", "T7D02", "T7D03", "T7D04", "T7D05", "T7D06", "T7D07", "T7D10", "T7D11"]);
const ARRAY_IDS = new Set(["E9C01", "E9C02", "E9C03"]);
const SCHEMATIC_IDS = new Set(["E6A10", "E6A11", "E6B10", "E6C08", "E6C10", "E6C11", "E7B10", "E7B11", "E7B12", "E7D06", "E7D07", "E7D08"]);
const YAGI_DECIBELS = new Set(["G9C04", "G9C09", "G4D05", "G4D07", "E4C05", "E4C06", "E9D01", "E9A12"]);
const YAGI_LENGTH = new Set(["E9D05"]);
const NO_LAB = new Set([
  "G5B02",
  "G5C01",
  "G5C02",
  "G5C05",
  "G5C06",
  "G5C07",
  "G5C08",
  "G5C09",
  "G5C10",
  "G5C11",
  "G5C12",
  "G5C13",
  "G5C14",
]);
const WIDTH_IDS = new Set(["T8A05", "T8A07", "T8A08", "T8A09", "T8A10", "T8A11"]);
const BANDWIDTH_IDS = new Set(["G8B06", "E8B01", "E8B02", "E8B03", "E8B04", "E8B05", "E8B06", "E8B09"]);
const LOWER_SIDEBAND = new Set(["G4D08", "G4D10", "E1A02", "E1A04"]);
const UPPER_SIDEBAND = new Set(["T8A06", "G4D09", "G4D11", "E1A01", "E1A03"]);
const CHART_GROUPS = new Set(["T1B", "G1A", "E1A"]);

const GROUP_LAB: Record<string, string> = {
  T3A: "propagation",
  T3B: "antenna",
  T3C: "propagation",
  T5A: "ohms",
  T5B: "prefixes",
  T5C: "ohms",
  T5D: "ohms",
  T6A: "schematics",
  T6B: "schematics",
  T6C: "schematics",
  T6D: "schematics",
  T7C: "swr",
  T9A: "antenna",
  T9B: "swr",
  T0A: "safety",
  T0B: "safety",
  T0C: "safety",
  G3A: "propagation",
  G3B: "propagation",
  G3C: "propagation",
  G5A: "reactance",
  G5B: "power",
  G5C: "dividers",
  G7A: "schematics",
  G9A: "swr",
  G9B: "antenna",
  G9C: "antenna",
  G0A: "safety",
  G0B: "safety",
  E3A: "propagation",
  E3B: "propagation",
  E3C: "propagation",
  E5A: "resonance",
  E5C: "phasors",
  E7G: "schematics",
  E9B: "antenna",
  E9G: "smith",
  E0A: "safety",
};

const QUESTION_LAB: Record<string, string> = {
  T5B09: "decibels",
  T5B10: "decibels",
  T5B11: "decibels",
  G5B01: "decibels",
  G5B03: "ohms",
  G5B04: "ohms",
  G5B05: "ohms",
  G5B10: "decibels",
  E5B01: "time",
  E5B04: "time",
  E5B07: "phasors",
  E5B08: "phasors",
  E5B09: "phasors",
  E5B10: "phasors",
  E5B11: "phasors",
  E9A02: "power",
  E9A06: "power",
  E9A07: "power",
};

export function groupDefault(group: string): Lane {
  return BENCH_GROUPS.has(group) ? "bench" : "card";
}

export function laneFor(id: string, group: string, figure: string | null): Lane {
  if (figure) return "bench";
  return LANE_FLIP[id] ?? groupDefault(group);
}

export function labForQuestion(id: string, group: string, lane: Lane): string | null {
  if (lane === "card" || NO_LAB.has(id)) return null;
  if (METER_IDS.has(id)) return "ohms";
  if (WIDTH_IDS.has(id) || BANDWIDTH_IDS.has(id)) return "bandwidth";
  if (ARRAY_IDS.has(id) || YAGI_LENGTH.has(id)) return "antenna";
  if (SCHEMATIC_IDS.has(id)) return "schematics";
  if (YAGI_DECIBELS.has(id)) return "decibels";
  return QUESTION_LAB[id] ?? GROUP_LAB[group] ?? null;
}

export function isChartCard(id: string, group: string): boolean {
  return CHART_GROUPS.has(group) || LOWER_SIDEBAND.has(id) || UPPER_SIDEBAND.has(id);
}

export function chartHref(id: string, group: string, licenseClass: LicenseClass | string): string | null {
  if (!isChartCard(id, group)) return null;
  const params = new URLSearchParams({ class: licenseClass, q: id });
  if (LOWER_SIDEBAND.has(id)) params.set("sideband", "lsb");
  if (UPPER_SIDEBAND.has(id)) params.set("sideband", "usb");
  return `/bands?${params.toString()}`;
}

export function labExtras(id: string): Record<string, string> {
  if (METER_IDS.has(id)) return { leads: "1" };
  if (ARRAY_IDS.has(id)) return { array: "1" };
  if (groupOfYagi(id)) return { yagi: "1" };
  return {};
}

function groupOfYagi(id: string): boolean {
  return YAGI_LENGTH.has(id) || (id.startsWith("G9C") && !YAGI_DECIBELS.has(id));
}
