import type { Lane } from "./lanes";
import type { PoolQuestion } from "./pool-types";

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
  T4A: "Wire size, supply current, and where the meter leads go decide whether the station can actually run.",
  T4B: "Microphone gain, squelch, and filter width change what the other station hears. A control name by itself is just a label.",
  T7A: "A receiver’s sensitivity is how small a signal it can hear, and its selectivity is how well it ignores the ones next door. A mixer moves that signal to a new frequency.",
  T7B: "Overload, over-deviation, and a radio that folds its power back are what the signal path does when something is too strong.",
  T7D: "A voltmeter goes across a part. An ammeter goes in the path of the current. An ohmmeter is used with the supply off.",
  T8A: "CW is the narrowest common mode, SSB is a few kilohertz, and FM is wider. Which sideband is used is a convention on top of that width.",
  T8B: "A satellite moves, so the signal’s pitch slides. The names of the satellite services are separate from that motion.",
  G4A: "A notch drops a tone, a noise blanker gates a pulse, and ALC holds the drive so the transmitter does not flat-top.",
  G4B: "A scope shows the shape of the signal. A meter that loads the circuit changes the voltage it claims to measure.",
  G4C: "RF in the shack is usually riding the outside of the cable. Bond the enclosures and choke that path.",
  G4D: "An S unit is a power step. A phone signal also has width, so the carrier has to sit inside the band edge by that width.",
  G6A: "A part’s behavior follows from how it is built: a coil can look like a capacitor past its self-resonant frequency, and a tube’s grid controls the stream.",
  G7B: "Class A conducts the whole cycle. Class C conducts a slice and suits FM or CW. An oscillator is an amplifier with feedback.",
  G7C: "SSB is made by a balanced modulator and a filter, then undone by a product detector. I and Q are the same signal a quarter cycle apart.",
  G8A: "AM follows the voice with an envelope. Overmodulation spreads the signal. SSB keeps one side of that envelope and suppresses the carrier.",
  G8B: "A mixer makes the sum and the difference. FM bandwidth is twice the sum of the deviation and the highest audio frequency.",
  G9C: "A reflector is a bit longer than the driven half-wave, and a director is a bit shorter. The lobe points at the director.",
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
  E4C: "Noise figure, the minimum discernible signal, and the intercept point are different rungs on the same receiver ladder.",
  E7B: "Class A conducts the whole RF cycle, AB more than half, B half, and C less than half.",
  E7C: "A low-pass Pi uses two shunt capacitors and a series inductor. The half-power points are where the filter has fallen 3 dB.",
  E7E: "A balanced modulator plus a filter makes SSB. A product detector takes it apart. A reactance modulator makes FM, and a discriminator undoes it.",
  E7H: "Colpitts feedback is a capacitive divider. Pierce feedback is a crystal. A PLL or a DDS is a different way to hold a frequency.",
  E8B: "Modulation index is deviation divided by the modulating frequency. Occupied FM bandwidth is twice the sum of the deviation and the highest audio frequency.",
  E9C: "Two verticals a half wave apart and fed in phase radiate broadside. The same spacing at 180 degrees radiates along the line. A quarter wave of spacing at 90 degrees makes a cardioid.",
  E9D: "A short whip is capacitive. A loading coil cancels that, and the match gets narrower as the antenna gets shorter.",
  E9F: "A shorted eighth-wave looks inductive and an open eighth-wave looks capacitive. A quarter wave flips the far end. A half wave repeats it.",
};

export function groupNote(group: string, title: string): string {
  return NOTES[group] ?? `This group covers ${title}.`;
}

export function explainQuestion(
  question: Pick<PoolQuestion, "text" | "answers" | "correctIndex" | "refs" | "group">,
  groupTitle: string,
  workedSteps: string[],
  lane: Lane,
): { correctExplanation: string; distractors: [string, string, string, string] } {
  const right = question.answers[question.correctIndex] ?? "";
  const citation = question.refs ? ` The pool cites ${question.refs.replace(/[[\]]/g, "")}.` : "";
  const worked = lane === "bench" && workedSteps.length > 0 ? ` ${workedSteps[workedSteps.length - 1]}` : "";
  const lead = lane === "card" ? `For the exam: ${right}.` : groupNote(question.group, groupTitle);
  const correctExplanation = `${lead}${worked} The matching choice is “${right}.”${citation}`;

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
    if (lane === "card") return `“${answer}” is a different rule. This question is asking for “${right}.”`;
    return `“${answer}” describes a different part of the idea. This question is asking for “${right}.”`;
  }) as [string, string, string, string];

  return { correctExplanation, distractors };
}
