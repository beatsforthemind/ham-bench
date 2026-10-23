import { labForQuestion } from "./explain";
import type { PoolQuestion } from "./pool-types";

export type BenchPreset = {
  volts?: number;
  amps?: number;
  ohms?: number;
  watts?: number;
  mhz?: number;
  dbFrom?: number;
  dbTo?: number;
  r1?: number;
  r2?: number;
  r3?: number;
  henries?: number;
  farads?: number;
  microfarad?: number;
  q?: number;
  peakToPeak?: number;
  swrLine?: number;
  swrLoad?: number;
  reactance?: number;
  gain?: number;
  loss?: number;
};

function amount(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

export function presetFromQuestion(question: PoolQuestion): BenchPreset {
  const text = question.text;
  const lab = labForQuestion(question.id, question.group);
  const preset: BenchPreset = {};
  const resistance = text.match(/current of ([\d.]+) amperes? flows when connected to ([\d.]+) volts/i);
  const applied = text.match(/applied voltage is ([\d.]+) volts and the current flow is ([\d.]+) amperes?/i);
  const draws = text.match(/draws ([\d.]+) amperes? from a ([\d.]+)-volt source/i);
  if (resistance) {
    preset.amps = Number(resistance[1]);
    preset.volts = Number(resistance[2]);
  } else if (applied) {
    preset.volts = Number(applied[1]);
    preset.amps = Number(applied[2]);
  } else if (draws) {
    preset.amps = Number(draws[1]);
    preset.volts = Number(draws[2]);
  }
  const through = text.match(/current through a ([\d.]+)-ohm resistor connected across ([\d.]+) volts/i);
  const appliedCurrent = text.match(/applied voltage of ([\d.]+) volts and a resistance of ([\d.]+) ohms/i);
  const voltage = text.match(/voltage across a ([\d.]+)-ohm resistor if a current of ([\d.]+) amperes? flows/i);
  if (through) {
    preset.ohms = Number(through[1]);
    preset.volts = Number(through[2]);
  } else if (appliedCurrent) {
    preset.volts = Number(appliedCurrent[1]);
    preset.ohms = Number(appliedCurrent[2]);
  } else if (voltage) {
    preset.ohms = Number(voltage[1]);
    preset.amps = Number(voltage[2]);
  }
  const delivered = text.match(/voltage of ([\d.]+) volts DC and a current of ([\d.]+) amperes?/i);
  if (delivered) {
    preset.volts = Number(delivered[1]);
    preset.amps = Number(delivered[2]);
  }
  const power = text.match(/deliver ([\d.]+) watts at a voltage of ([\d.]+) volts/i);
  if (power) {
    preset.watts = Number(power[1]);
    preset.volts = Number(power[2]);
  }
  const wattsPair = text.match(/from ([\d.]+) watts to ([\d.]+) watts/i);
  if (wattsPair) {
    preset.dbFrom = Number(wattsPair[1]);
    preset.dbTo = Number(wattsPair[2]);
  }
  const equalMhz = text.match(/equal to ([\d,.]+) MHz/i);
  if (equalMhz) preset.mhz = amount(equalMhz[1]!);
  const dipole = text.match(/([\d.]+) MHz/i);
  if (dipole && lab === "antenna" && preset.mhz == null) preset.mhz = Number(dipole[1]);
  const parallel = text.match(/([\d,.]+)-,\s*a ([\d,.]+)-,\s*and a ([\d,.]+)-ohm resistor connected in parallel/i);
  const pair = text.match(/([\d,.]+)-\s*and a ([\d,.]+)-ohm resistor in parallel/i);
  if (parallel) {
    preset.r1 = amount(parallel[1]!);
    preset.r2 = amount(parallel[2]!);
    preset.r3 = amount(parallel[3]!);
  } else if (pair) {
    preset.r1 = amount(pair[1]!);
    preset.r2 = amount(pair[2]!);
  }
  const lc = text.match(/L is ([\d.]+) microhenries, and C is ([\d.]+) picofarads/i);
  if (lc) {
    preset.henries = Number(lc[1]) * 1e-6;
    preset.farads = Number(lc[2]) * 1e-12;
  }
  const bandwidth = text.match(/resonant frequency of ([\d.]+) MHz and a Q of ([\d.]+)/i);
  if (bandwidth) {
    preset.mhz = Number(bandwidth[1]);
    preset.q = Number(bandwidth[2]);
  }
  const pep = text.match(/([\d.]+) volts peak-to-peak across a ([\d.]+)-ohm/i);
  if (pep) {
    preset.peakToPeak = Number(pep[1]);
    preset.ohms = Number(pep[2]);
  }
  const swr = text.match(/([\d.]+)-ohm feed line to a ([\d.]+)-ohm resistive load/i);
  if (swr) {
    preset.swrLine = Number(swr[1]);
    preset.swrLoad = Number(swr[2]);
  }
  const op = text.match(/R1 is ([\d,]+)\s*(kilohms|kohms|ohms),?\s*RF is ([\d,]+)\s*(kilohms|kohms|ohms)/i);
  if (op) {
    preset.r1 = amount(op[1]!) * (op[2] === "ohms" ? 1 : 1000);
    preset.r2 = amount(op[3]!) * (op[4] === "ohms" ? 1 : 1000);
  }
  const vin = text.match(/([\d.]+) volts DC is applied/i);
  if (vin) preset.volts = Number(vin[1]);
  const phase = text.match(/XC is ([\d,.]+) ohms, R is ([\d,.]+)\s*(kilohms|kilohm|kohms|kohm|ohms|ohm), and XL is ([\d,.]+) ohms/i);
  if (phase) {
    const xc = amount(phase[1]!);
    const r = amount(phase[2]!) * (phase[3]!.startsWith("ohm") ? 1 : 1000);
    const xl = amount(phase[4]!);
    preset.ohms = r;
    preset.reactance = xl - xc;
  }
  const rc = text.match(/two ([\d.]+)-microfarad capacitors and two ([\d.]+)-megohm resistors, all in parallel/i);
  if (rc) {
    preset.microfarad = Number(rc[1]) * 2;
    preset.ohms = (Number(rc[2]) * 1e6) / 2;
  }
  const erp = text.match(/([\d.]+) watts transmitter power output/i);
  if (erp && /effective radiated power|effective isotropic radiated power|\bERP\b|\bEIRP\b/i.test(text)) {
    preset.watts = Number(erp[1]);
    const losses = [...text.matchAll(/([\d.]+) dB [^.,]*loss/gi)];
    preset.loss = losses.reduce((sum, match) => sum + Number(match[1]), 0);
    const gain = text.match(/([\d.]+) dB[di]/i);
    if (gain) preset.gain = Number(gain[1]);
  }
  return preset;
}

const QUERY_NAME: Partial<Record<keyof BenchPreset, string>> = {
  q: "quality",
};

export function labHref(question: PoolQuestion, licenseClass: string): string | null {
  const lab = labForQuestion(question.id, question.group);
  if (!lab) return null;
  const params = new URLSearchParams({ class: licenseClass, q: question.id });
  const preset = presetFromQuestion(question);
  for (const [key, value] of Object.entries(preset)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      params.set(QUERY_NAME[key as keyof BenchPreset] ?? key, String(value));
    }
  }
  const path = lab === "bands" ? "/bands" : `/labs/${lab}`;
  return `${path}?${params.toString()}`;
}
