export function workedSteps(id: string, text: string, answers: string[]): string[] {
  const prefix = convertPrefix(text);
  if (prefix) return prefix;

  const power = dcPower(text);
  if (power) return power;

  const ohm = ohmsLaw(text);
  if (ohm) return ohm;

  const db = decibelStep(id, text);
  if (db) return db;

  const parallel = parallelResistors(text);
  if (parallel) return parallel;

  const dipole = dipoleLength(text);
  if (dipole) return dipole;

  const swr = resistiveSwr(text);
  if (swr) return swr;

  const pep = peakEnvelope(text);
  if (pep) return pep;

  const resonance = resonantFrequency(text);
  if (resonance) return resonance;

  const bandwidth = halfPowerBandwidth(text);
  if (bandwidth) return bandwidth;

  const gain = opAmpGain(text, answers);
  if (gain) return gain;

  const tau = timeConstant(text);
  if (tau) return tau;

  const phase = phaseAngle(text);
  if (phase) return phase;

  const radiated = effectiveRadiated(text);
  if (radiated) return radiated;

  return [];
}

function convertPrefix(text: string): string[] | null {
  const milliFromAmp = text.match(/How many milliamperes is ([\d.]+) amperes/i);
  if (milliFromAmp) {
    const amps = Number(milliFromAmp[1]);
    return [`${amps} A × 1,000 = ${amps * 1000} mA.`];
  }
  const milliFromMa = text.match(/Which is equal to ([\d,]+) milliamperes/i);
  if (milliFromMa) {
    const ma = Number(milliFromMa[1]!.replace(/,/g, ""));
    return [`${ma} mA ÷ 1,000 = ${ma / 1000} A.`];
  }
  const watts = text.match(/Which is equal to ([\d,]+) milliwatts/i);
  if (watts) {
    const mw = Number(watts[1]!.replace(/,/g, ""));
    return [`${mw} mW ÷ 1,000 = ${mw / 1000} W.`];
  }
  const hz = text.match(/Which is equal to ([\d,]+) hertz/i);
  if (hz) {
    const value = Number(hz[1]!.replace(/,/g, ""));
    return [`${value} Hz ÷ 1,000 = ${value / 1000} kHz.`];
  }
  const khz = text.match(/Which is equal to ([\d,]+) kHz/i);
  if (khz) {
    const value = Number(khz[1]!.replace(/,/g, ""));
    return [`${value} kHz ÷ 1,000 = ${value / 1000} MHz.`];
  }
  const mhz = text.match(/Which is equal to ([\d,.]+) MHz/i);
  if (mhz) {
    const value = Number(mhz[1]!.replace(/,/g, ""));
    if (mhz[1]!.includes(".")) return [`${value} MHz × 1,000 = ${value * 1000} kHz.`];
    return [`${value} MHz ÷ 1,000 = ${value / 1000} GHz.`];
  }
  if (/one kilovolt/i.test(text)) return ["Kilo means × 1,000, so 1 kV is 1,000 volts."];
  if (/one microvolt/i.test(text)) return ["Micro means one millionth, so 1 µV is 0.000001 volt."];
  if (/1,000,000 picofarads/i.test(text)) return ["1,000,000 pF = 1 µF. Pico to micro is a factor of one million."];
  return null;
}

function dcPower(text: string): string[] | null {
  const delivered = text.match(/voltage of ([\d.]+) volts DC and a current of ([\d.]+) amperes/i);
  if (delivered) {
    const volts = Number(delivered[1]);
    const amps = Number(delivered[2]);
    return [`P = I × E = ${amps} × ${volts} = ${round(amps * volts)} watts.`];
  }
  const current = text.match(/deliver ([\d.]+) watts at a voltage of ([\d.]+) volts/i);
  if (current) {
    const watts = Number(current[1]);
    const volts = Number(current[2]);
    return [`I = P / E = ${watts} / ${volts} = ${round(watts / volts)} amperes.`];
  }
  const load = text.match(/([\d.]+) VDC is supplied to an ([\d.]+)-ohm load/i);
  if (load) {
    const volts = Number(load[1]);
    const ohms = Number(load[2]);
    return [`P = E² / R = ${volts}² / ${ohms} = ${round((volts * volts) / ohms)} watts.`];
  }
  const bulb = text.match(/([\d.]+) VDC light bulb that draws ([\d.]+) amperes/i);
  if (bulb) {
    const volts = Number(bulb[1]);
    const amps = Number(bulb[2]);
    return [`P = I × E = ${amps} × ${volts} = ${round(amps * volts)} watts.`];
  }
  const milli = text.match(/([\d.]+) milliamperes flows through a ([\d,]+)-ohm/i);
  if (milli) {
    const amps = Number(milli[1]) / 1000;
    const ohms = Number(milli[2]!.replace(/,/g, ""));
    const watts = amps * amps * ohms;
    return [`P = I² × R = (${amps} A)² × ${ohms} Ω = ${round(watts * 1000)} milliwatts.`];
  }
  return null;
}

function ohmsLaw(text: string): string[] | null {
  const resistance = text.match(/current of ([\d.]+) amperes flows when connected to ([\d.]+) volts/i);
  if (resistance) {
    const amps = Number(resistance[1]);
    const volts = Number(resistance[2]);
    return [`R = E / I = ${volts} / ${amps} = ${round(volts / amps)} ohms.`];
  }
  const applied = text.match(/applied voltage is ([\d.]+) volts and the current flow is ([\d.]+) amperes/i);
  if (applied) {
    const volts = Number(applied[1]);
    const amps = Number(applied[2]);
    return [`R = E / I = ${volts} / ${amps} = ${round(volts / amps)} ohms.`];
  }
  const draws = text.match(/draws ([\d.]+) amperes from a ([\d.]+)-volt source/i);
  if (draws) {
    const amps = Number(draws[1]);
    const volts = Number(draws[2]);
    return [`R = E / I = ${volts} / ${amps} = ${round(volts / amps)} ohms.`];
  }
  const through = text.match(/current through a ([\d.]+)-ohm resistor connected across ([\d.]+) volts/i);
  if (through) {
    const ohms = Number(through[1]);
    const volts = Number(through[2]);
    return [`I = E / R = ${volts} / ${ohms} = ${round(volts / ohms)} amperes.`];
  }
  const appliedCurrent = text.match(/applied voltage of ([\d.]+) volts and a resistance of ([\d.]+) ohms/i);
  if (appliedCurrent) {
    const volts = Number(appliedCurrent[1]);
    const ohms = Number(appliedCurrent[2]);
    return [`I = E / R = ${volts} / ${ohms} = ${round(volts / ohms)} amperes.`];
  }
  const voltage = text.match(/voltage across a ([\d.]+)-ohm resistor if a current of ([\d.]+) amperes?/i);
  if (voltage) {
    const ohms = Number(voltage[1]);
    const amps = Number(voltage[2]);
    return [`E = I × R = ${amps} × ${ohms} = ${round(amps * ohms)} volts.`];
  }
  return null;
}

function decibelStep(id: string, text: string): string[] | null {
  if (id === "T5B09" || /5 watts to 10 watts/i.test(text)) {
    return ["Doubling power is a change of about 3 dB."];
  }
  if (id === "T5B10" || /12 watts to 3 watts/i.test(text)) {
    return ["12 W to 6 W is −3 dB, and 6 W to 3 W is another −3 dB, so the change is −6 dB."];
  }
  if (id === "T5B11" || /20 watts to 200 watts/i.test(text)) {
    return ["A tenfold increase in power is 10 dB."];
  }
  if (/factor of two increase or decrease in power/i.test(text)) {
    return ["A factor of two in power is about 3 dB, up or down."];
  }
  return null;
}

function parallelResistors(text: string): string[] | null {
  const three = text.match(/([\d,.]+)-,\s*a ([\d,.]+)-,\s*and a ([\d,.]+)-ohm resistor connected in parallel/i);
  const two = text.match(/([\d,.]+)-\s*and a ([\d,.]+)-ohm resistor in parallel/i);
  const match = three ?? two;
  if (!match) return null;
  const values = match.slice(1).map((value) => Number(value!.replace(/,/g, "")));
  const total = 1 / values.reduce((sum, value) => sum + 1 / value, 0);
  return [`1/R = ${values.map((value) => `1/${value}`).join(" + ")}. R ≈ ${Math.round(total)} ohms, less than the smallest resistor.`];
}

function dipoleLength(text: string): string[] | null {
  const match = text.match(/1\/2 wave dipole antenna cut for ([\d.]+) MHz/i);
  if (!match) return null;
  const mhz = Number(match[1]);
  return [`Length in feet ≈ 468 / ${mhz} = ${round(468 / mhz)} feet.`];
}

function resistiveSwr(text: string): string[] | null {
  const match = text.match(/([\d.]+)-ohm feed line to a ([\d.]+)-ohm resistive load/i);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  const ratio = Math.max(a, b) / Math.min(a, b);
  return [`SWR = larger Z / smaller Z = ${Math.max(a, b)} / ${Math.min(a, b)} = ${round(ratio)}:1.`];
}

function peakEnvelope(text: string): string[] | null {
  const match = text.match(/PEP produced by ([\d.]+) volts peak-to-peak across a ([\d.]+)-ohm/i);
  if (!match) return null;
  const peakToPeak = Number(match[1]);
  const ohms = Number(match[2]);
  const peak = peakToPeak / 2;
  const rms = peak / Math.SQRT2;
  const pep = (rms * rms) / ohms;
  return [
    `Peak voltage is half of ${peakToPeak} V, which is ${round(peak)} V.`,
    `RMS is peak / √2 ≈ ${round(rms)} V.`,
    `PEP = Vrms² / R ≈ ${round(pep)} watts.`,
  ];
}

function resonantFrequency(text: string): string[] | null {
  const match = text.match(/L is ([\d.]+) microhenries, and C is ([\d.]+) picofarads/i);
  if (!match) return null;
  const henries = Number(match[1]) * 1e-6;
  const farads = Number(match[2]) * 1e-12;
  const hz = 1 / (2 * Math.PI * Math.sqrt(henries * farads));
  return [`f = 1 / (2π√(LC)) ≈ ${round(hz / 1e6)} MHz.`];
}

function halfPowerBandwidth(text: string): string[] | null {
  const match = text.match(/resonant frequency of ([\d.]+) MHz and a Q of ([\d.]+)/i);
  if (!match) return null;
  const mhz = Number(match[1]);
  const q = Number(match[2]);
  return [`Half-power bandwidth = f / Q = ${mhz} MHz / ${q} ≈ ${round((mhz / q) * 1000)} kHz.`];
}

function opAmpGain(text: string, answers: string[]): string[] | null {
  const match = text.match(/R1 is ([\d,]+)\s*(kilohms|kohms|ohms),?\s*RF is ([\d,]+)\s*(kilohms|kohms|ohms)/i);
  if (!match) return null;
  const r1 = Number(match[1]!.replace(/,/g, "")) * (match[2] === "ohms" ? 1 : 1000);
  const rf = Number(match[3]!.replace(/,/g, "")) * (match[4] === "ohms" ? 1 : 1000);
  const magnitude = rf / r1;
  const input = text.match(/([\d.]+) volts DC is applied/i);
  if (input) {
    const vin = Number(input[1]);
    return [`Gain magnitude is RF / R1 = ${round(magnitude)}. The minus sign is on the output: −${round(magnitude)} × ${vin} = ${round(-magnitude * vin)} volts.`];
  }
  const signed = answers.some((answer) => answer.trim().startsWith("-"));
  const gain = signed ? -magnitude : magnitude;
  return [`Voltage gain magnitude is RF / R1 = ${rf} / ${r1} = ${round(magnitude)}. The matching choice is ${gain}.`];
}

function timeConstant(text: string): string[] | null {
  const match = text.match(/two ([\d.]+)-microfarad capacitors and two ([\d.]+)-megohm resistors, all in parallel/i);
  if (!match) return null;
  const microfarad = Number(match[1]) * 2;
  const ohms = (Number(match[2]) * 1e6) / 2;
  return [`Parallel capacitors add and parallel resistors share. τ = RC ≈ ${round(ohms * microfarad * 1e-6)} seconds.`];
}

function phaseAngle(text: string): string[] | null {
  const match = text.match(/XC is ([\d,.]+) ohms, R is ([\d,.]+)\s*(kilohms|kilohm|kohms|kohm|ohms|ohm), and XL is ([\d,.]+) ohms/i);
  if (!match) return null;
  const xc = Number(match[1]!.replace(/,/g, ""));
  const resistance = Number(match[2]!.replace(/,/g, "")) * (match[3]!.startsWith("ohm") ? 1 : 1000);
  const xl = Number(match[4]!.replace(/,/g, ""));
  const reactance = xl - xc;
  const angle = Math.abs((Math.atan2(reactance, resistance) * 180) / Math.PI);
  const relation = reactance < 0 ? "the voltage lagging the current" : "the voltage leading the current";
  return [`Net reactance is XL − XC = ${xl} − ${xc} = ${reactance} ohms. The angle is about ${round(angle)} degrees, with ${relation}.`];
}

function effectiveRadiated(text: string): string[] | null {
  const watts = text.match(/([\d.]+) watts transmitter power output/i);
  if (!watts || !/effective radiated power|effective isotropic radiated power|\bERP\b|\bEIRP\b/i.test(text)) return null;
  const losses = [...text.matchAll(/([\d.]+) dB [^.,]*loss/gi)].reduce((sum, match) => sum + Number(match[1]), 0);
  const gain = text.match(/([\d.]+) dB[di]/i);
  const gainDb = gain ? Number(gain[1]) : 0;
  const net = gainDb - losses;
  const power = Number(watts[1]) * 10 ** (net / 10);
  return [`Net change is ${gainDb} dB minus ${losses} dB of loss. Power ≈ ${watts[1]} × 10^(${round(net)} / 10) ≈ ${Math.round(power)} watts.`];
}

function round(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs >= 100) return String(Math.round(value));
  if (abs >= 10) return String(Math.round(value * 10) / 10);
  return String(Math.round(value * 100) / 100);
}
