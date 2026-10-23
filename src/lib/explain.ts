import type { PoolQuestion } from "./pool-types";

const GROUP_LAB: Record<string, string> = {
  T5A: "ohms",
  T5B: "prefixes",
  T5C: "ohms",
  T5D: "ohms",
  T6A: "schematics",
  T6B: "schematics",
  T6C: "schematics",
  T6D: "schematics",
  T3A: "propagation",
  T3B: "antenna",
  T3C: "propagation",
  T7C: "swr",
  T9A: "antenna",
  T9B: "swr",
  T0A: "safety",
  T0B: "safety",
  T0C: "safety",
  T1B: "bands",
  G1A: "bands",
  G5A: "reactance",
  G5B: "power",
  G5C: "dividers",
  G7A: "schematics",
  G9A: "swr",
  G9B: "antenna",
  G3A: "propagation",
  G3B: "propagation",
  G3C: "propagation",
  G0A: "safety",
  G0B: "safety",
  E1A: "bands",
  E3A: "propagation",
  E3B: "propagation",
  E3C: "propagation",
  E4D: "power",
  E5A: "resonance",
  E5C: "phasors",
  E7G: "schematics",
  E9G: "smith",
  E0A: "safety",
};

const QUESTION_LAB: Record<string, string> = {
  T5B09: "decibels",
  T5B10: "decibels",
  T5B11: "decibels",
  G5B01: "decibels",
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
  E9B01: "antenna",
  E9B02: "antenna",
  E9B03: "antenna",
  E9B04: "antenna",
  E9B05: "antenna",
  E9B06: "antenna",
};

export function labForQuestion(id: string, group: string): string | null {
  return QUESTION_LAB[id] ?? GROUP_LAB[group] ?? null;
}

const NOTES: Record<string, string> = {
  T5A: "Current is the flow of electrons, measured in amperes. Voltage is the push that makes them move. Power, in watts, is how fast that energy is used.",
  T5B: "A prefix moves the decimal by threes: milli is one thousandth, kilo is one thousand, mega is one million. Three decibels doubles power, and ten decibels multiplies it by ten.",
  T5C: "Capacitance stores energy in an electric field and is measured in farads. Inductance stores energy in a magnetic field and is measured in henries. In a DC circuit, power is voltage times current.",
  T5D: "Ohm’s law is E = I × R. Rearrange it for the missing quantity. In series, the same current flows through every part. In parallel, the same voltage appears across every branch.",
  T6A: "A resistor opposes current, a capacitor stores charge, and an inductor is a coil that stores energy in a magnetic field. A potentiometer is the adjustable resistor used as a volume control.",
  T6B: "A diode lets current pass one way. A transistor uses a small current at the base to control a larger current from collector to emitter.",
  T6C: "A schematic shows how parts connect, using standard symbols. It does not show the physical size of the parts or the length of the wires.",
  T6D: "A rectifier turns AC into a varying DC. A relay is a switch operated by a coil. A regulator holds the supply voltage steady.",
  T3A: "Radio waves can fade, bounce, and arrive by more than one path. Polarization is the orientation of the electric field, so a vertical antenna prefers a vertical signal.",
  T3B: "Wavelength in meters is about 300 divided by frequency in megahertz. Higher frequency means a shorter wave. HF, VHF, and UHF are names for those ranges.",
  T3C: "VHF and UHF are mostly line of sight. HF can skip off the ionosphere. Sporadic-E, meteor scatter, and tropospheric ducting are the odd paths the exam asks you to name.",
  T7C: "An SWR of 1:1 means the antenna and the feed line agree. A high reading means power is reflecting back, and many solid-state radios then reduce output.",
  T9A: "Shortening a dipole raises its resonant frequency. A half-wave dipole radiates strongest broadside to the wire, not off the ends. A 19-inch vertical is a quarter wave on 2 meters.",
  T9B: "Coax loss rises with frequency. Outdoor connectors need weather sealing. An antenna tuner matches the radio to the line; it does not fix a poor antenna by itself.",
  T0A: "A charged filter capacitor can still shock you after the supply is unplugged. A fuse protects the wiring. Charging a battery too hard can overheat it or vent gas.",
  T0B: "Never climb a tower alone. Ground wires should be short and direct, without sharp bends. Keep any falling antenna at least 10 feet away from power lines.",
  T0C: "Radio energy is non-ionizing. Exposure depends on power, frequency, distance, antenna pattern, and duty cycle. The station licensee is responsible for the evaluation.",
  T1B: "Technician HF is a few slices: CW on 80, 40, and 15 meters, and a phone segment on 10 meters from 28.300 to 28.500 MHz. From 6 meters up, Technician privileges are broad.",
  T8A: "CW is the narrowest common mode, SSB is a few kilohertz, and FM is wider. Upper sideband is used on 10 meters and above; lower sideband is used on 40 meters and below.",
  G5A: "Inductive reactance rises with frequency. Capacitive reactance falls. In a series LC circuit they cancel at resonance, leaving the resistance.",
  G5B: "Power is still E × I, and also E² / R. RMS is the AC value that heats like the same DC voltage. PEP uses the peak of the envelope. Three decibels is a doubling of power.",
  G5C: "Parallel resistors share current, and the total is less than the smallest one. Capacitors in series combine the way resistors do in parallel. A transformer’s voltage follows the turns ratio, and impedance follows the square of that ratio.",
  G7A: "Figure G7-1 is a power-supply schematic. Learn the symbols for the Zener, the NPN transistor, the FET, the transformer, and the tapped inductor.",
  G9A: "SWR is the ratio of the larger impedance to the smaller one when both are resistive. A 50-ohm line into 200 ohms is 4:1.",
  G9B: "A practical half-wave dipole in feet is about 468 divided by frequency in megahertz. That is shorter than a free-space half wave because of end effect.",
  G3A: "More sunspots generally mean better HF. The A and K indexes describe the geomagnetic field. A disturbed field hurts HF paths.",
  G3B: "The MUF is the highest frequency that will still refract back to Earth on that path. The LUF is the lowest frequency that still gets through the absorption.",
  G3C: "The D layer absorbs HF in the daytime and fades after sunset. NVIS uses a high takeoff angle on the lower HF bands for regional coverage.",
  G0A: "RF exposure limits are tightest in the VHF range, where the body absorbs energy well. Re-evaluate the station when the transmitter or antenna changes.",
  G0B: "Bond station equipment to a single-point ground. A fuse belongs in the positive lead, close to the battery, sized to protect the wire.",
  E5A: "Resonant frequency falls as L or C grows. Half-power bandwidth is the resonant frequency divided by Q. A higher Q means a sharper peak.",
  E5B: "One time constant charges a capacitor to about 63 percent of the applied voltage. With resistors or capacitors combined, use the equivalent R and C in τ = RC.",
  E5C: "Figure E5-1 is a rectangular impedance chart. Resistance runs one way and reactance the other. A series RC circuit sits off the resistance axis by its capacitive reactance.",
  E7G: "The op-amp in figure E7-3 has a gain set by the feedback resistor over the input resistor. The sign of the output follows the way the circuit is drawn.",
  E4D: "Link margin adds gains and subtracts losses, all in decibels. The errata questions use 10 watts, which is +40 dBm, not the older 100-watt figure.",
  E9A: "dBi compares an antenna to an isotropic source. dBd compares it to a dipole. ERP and EIRP fold transmitter power, line loss, and antenna gain into one number.",
  E9B: "Figures E9-1 and E9-2 are radiation patterns. The 3 dB beamwidth is the angle between the half-power points.",
  E9G: "On the Smith chart, the only straight line is the resistance axis. The outer circle is where the reactance arcs end. Figure E9-3 has infinity on the right.",
  E0A: "Extra safety adds RF exposure quantities such as MPE and SAR, plus station grounding and tower fall protection.",
  E1A: "Extra licensees have the band edges that General and Advanced do not. Watch the 630-meter and 2200-meter power limits and the automatic-control segments.",
};

export function groupNote(group: string, title: string): string {
  return NOTES[group] ?? `This group covers ${title}. Choose the statement that matches that rule, and leave the nearby lookalikes.`;
}

export function explainQuestion(
  question: Pick<PoolQuestion, "text" | "answers" | "correctIndex" | "refs" | "group">,
  groupTitle: string,
  workedSteps: string[],
): { correctExplanation: string; distractors: [string, string, string, string] } {
  const right = question.answers[question.correctIndex] ?? "";
  const citation = question.refs ? ` The pool cites ${question.refs.replace(/[[\]]/g, "")}.` : "";
  const worked = workedSteps.length > 0 ? ` ${workedSteps[workedSteps.length - 1]}` : "";
  const correctExplanation = `${groupNote(question.group, groupTitle)}${worked} The matching choice is “${right}.”${citation}`;

  const distractors = question.answers.map((answer, index) => {
    if (index === question.correctIndex) return "";
    if (/all these choices are correct/i.test(answer)) {
      return "“All these choices are correct” is right only when every other choice actually fits. Here, at least one does not.";
    }
    if (/all these choices are correct/i.test(right)) {
      return `“${answer}” is only one piece. Each of the other choices also fits, so the matching selection is “${right}.”`;
    }
    if (/none of these/i.test(answer)) {
      return `“${answer}” would mean the real idea is missing. It is listed: “${right}.”`;
    }
    return `“${answer}” does not answer this question. The choice that does is “${right}.”`;
  }) as [string, string, string, string];

  return { correctExplanation, distractors };
}
