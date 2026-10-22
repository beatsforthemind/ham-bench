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
  q?: number;
  peakToPeak?: number;
  swrLine?: number;
  swrLoad?: number;
};

export function presetFromQuestion(question: PoolQuestion): BenchPreset {
  const text = question.text;
  const preset: BenchPreset = {};
  const resistance = text.match(/current of ([\d.]+) amperes flows when connected to ([\d.]+) volts/i);
  const applied = text.match(/applied voltage is ([\d.]+) volts and the current flow is ([\d.]+) amperes/i);
  const draws = text.match(/draws ([\d.]+) amperes from a ([\d.]+)-volt source/i);
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
  const voltage = text.match(/voltage across a ([\d.]+)-ohm resistor if a current of ([\d.]+) amperes/i);
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
  const delivered = text.match(/voltage of ([\d.]+) volts DC and a current of ([\d.]+) amperes/i);
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
  const dipole = text.match(/([\d.]+) MHz/i);
  if (dipole && question.lab === "antenna") preset.mhz = Number(dipole[1]);
  const parallel = text.match(/([\d.]+)-, a ([\d.]+)-, and a ([\d.]+)-ohm resistor connected in parallel/i);
  if (parallel) {
    preset.r1 = Number(parallel[1]);
    preset.r2 = Number(parallel[2]);
    preset.r3 = Number(parallel[3]);
  }
  const lc = text.match(/L is ([\d.]+) microhenries, and C is ([\d.]+) picofarads/i);
  if (lc) {
    preset.henries = Number(lc[1]) * 1e-6;
    preset.farads = Number(lc[2]) * 1e-12;
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
  const op = text.match(/R1 is ([\d,.]+) ohms and RF is ([\d,.]+)\s*(kilo)?ohms/i);
  if (op) {
    preset.r1 = Number(op[1]!.replace(/,/g, ""));
    preset.r2 = Number(op[2]!.replace(/,/g, "")) * (op[3] ? 1000 : 1);
  }
  const vin = text.match(/([\d.]+) volts DC is applied/i);
  if (vin) preset.volts = Number(vin[1]);
  return preset;
}

export function labHref(question: PoolQuestion, licenseClass: string): string | null {
  if (!question.lab) return null;
  const params = new URLSearchParams({ class: licenseClass, q: question.id });
  const preset = presetFromQuestion(question);
  for (const [key, value] of Object.entries(preset)) {
    if (typeof value === "number" && Number.isFinite(value)) params.set(key, String(value));
  }
  const path = question.lab === "bands" ? "/bands" : `/labs/${question.lab}`;
  return `${path}?${params.toString()}`;
}
