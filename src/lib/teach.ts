import { groupNote } from "./explain";
import { chartHref } from "./lanes";
import { labHref } from "./presets";
import type { Lane } from "./lanes";
import type { PoolQuestion } from "./pool-types";

const HOOKS: Record<string, string> = {
  T1B01: "On 10 meters, Technician phone is a small slice, not the whole band.",
  T1C05: "Group D calls look like two letters, a digit, and three letters.",
  T2A01: "A usual 2-meter repeater is split by 600 kHz, above or below its output.",
  T2A02: "146.520 MHz is where 2-meter FM simplex calls start.",
  T8A06: "From 10 meters up, phone uses upper sideband. That is a convention, not a property of the wave.",
  G1C01: "Power limits change with the band. Read the section the pool cites before trusting a round number.",
  G1D10: "A Volunteer Examiner has to be an adult.",
  G2C04: "QRL asks whether the frequency is already in use.",
  E1A07: "The 2200-meter band has its own power ceiling, lower than the HF bands.",
  E2E06: "FT8 trades a long message for a short, timed cycle.",
};

export function cardFact(answer: string): string {
  const fact = answer.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return `For the exam: ${fact}.`;
}

export function conventionHook(id: string): string | null {
  return HOOKS[id] ?? null;
}

const PEGS: Record<string, string> = {
  T5A01: "Current is a flow of charge. Its unit carries the name of André-Marie Ampère.",
  T5A02: "Power is how fast that energy is spent. Its unit carries the name of James Watt.",
  T5A06: "Frequency counts the cycles in one second. Its unit carries the name of Heinrich Hertz.",
  T5C02: "Capacitance is charge stored in an electric field. Its unit carries the name of Michael Faraday.",
  T5C04: "Inductance is energy stored in a coil. Its unit carries the name of Joseph Henry.",
  T5C05: "Impedance is opposition to current. Its unit carries the name of Georg Ohm.",
  T5C06: "A thousand cycles each second takes a k in front of the hertz abbreviation.",
  T5C07: "A million cycles each second takes an M in front of the hertz abbreviation.",
  T2B10: "Other stations are stepping on you. The code for that man-made mess ends in M.",
  T2B11: "You are leaving this frequency. The code for the move ends in Y.",
  T1A02: "Picture the government office that writes the amateur rules.",
  T1B06: "Technician phone on HF lives on one band, the highest of the HF bands.",
  T1C01: "The FCC currently issues three classes. A list that still names a retired class is a neighbor.",
  T1E01: "A station with nobody at the controls stays silent. No occasion opens the way.",
  T1F04: "Phone identification in the United States uses the language the FCC rules are written in.",
  T2A11: "One frequency does both jobs, talking and listening.",
  T6C01: "The drawing made of standard part symbols is the one whose name starts with S.",
  T1D02: "One-way to the general public is broadcasting. Ham events, code practice, and telecommand stay amateur work.",
  T2C08: "Call-sign email rides Winlink. FT8, PSK31, and AMTOR are keyboard modes, not a mailbox.",
  T2C12: "Civil defense certifies RACES. ARES is the club team, MARS is military, and SKYWARN watches the weather.",
  T3A03: "Long-haul VHF and UHF CW and SSB lie flat, on horizontal polarization.",
  T6A11: "The common dry cell is carbon-zinc, and it does not go back on the charger. Nickel, lead, and lithium do.",
  T6B05: "A gate, a drain, and a source mean field-effect. A base means the bipolar junction transistor beside it.",
  T8A03: "Weak-signal distance on VHF and UHF uses SSB. FM is the strong local voice.",
  T8B11: "Satellite telemetry is open for anyone to hear. A required encryption key is the trap in the longer choices.",
  T8C03: "Working as many stations as you can in a set period is contesting.",
  T8C09: "EchoLink lets you key a repeater from the internet with no radio at your end. IRLP still starts on a radio.",
  T8C11: "The station that joins other hams to the internet is a gateway.",
  T0A03: "In a US 120-volt cable the black wire is hot. White is neutral and green is the equipment ground.",
  G1B11: "Where Part 97 is silent, the FCC still decides what good amateur practice means.",
  G1D02: "A General class volunteer examiner gives the Technician exam only.",
  G2C08: "AR is the CW prosign that ends a formal message. SK ends the whole contact.",
  G2E01: "RTTY sent as audio through an SSB transmitter uses lower sideband.",
  G2E05: "JT65, JT9, FT4, and FT8 on SSB use upper sideband.",
  G2E13: "A Winlink Remote Message Server is also called a gateway.",
  G5A07: "Turn impedance upside down and the name is admittance. Conductance is the inverse of resistance alone.",
  G5A09: "Reactance uses ohms, the same unit as resistance.",
  G5A11: "Reactance takes the letter X. Impedance takes Z.",
  G8B03: "Mixing two RF signals is called heterodyning. Both the sum and the difference come out.",
  G8C02: "The low-power beacon for watching HF paths is WSPR, said like whisper.",
  G8C03: "Routing and handling live in the packet header. The trailer only closes the frame.",
  G8C07: "FT8 still copies when the signal is down in the noise, and it stays narrow.",
  E2B09: "DRM slow-scan television is received on SSB.",
  E2C12: "The wait between your action and the change on the air is latency.",
  E2D01: "Meteor scatter uses MSK144.",
  E2D03: "Earth-moon-earth uses Q65. MSK144 is the meteor mode.",
  E2D04: "Balloons are tracked in real time with APRS.",
  E2E01: "Data below 30 MHz is sent by frequency-shift keying, FSK.",
  E2E05: "WSPR is a beacon, so there is no keyboard conversation. RTTY and PSK31 still have one.",
  E2E10: "FT8 is the narrowest of these digital modes.",
  E3C08: "Geomagnetic storms use the G scale. A G5 is the extreme one. X and M belong to solar flares.",
  E4D06: "A strong signal nearby that makes the receiver deaf is desensitization.",
  E5B02: "Susceptance uses the letter B. Reactance uses X.",
  E6E02: "The through-hole package with two rows of pins is a DIP.",
};

const STOP = new Set("a an the of to for in on by with from or and is are be it as at its their than then this that these those".split(" "));
const TOKEN = /[A-Za-z0-9]+(?:[./+-][A-Za-z0-9]+)*/g;

function tokens(value: string): string[] {
  return value.match(TOKEN) ?? [];
}

function givesAway(hint: string, answer: string): boolean {
  const fact = answer.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  if (fact.length >= 4 && new RegExp(`\\b${escapeRegExp(fact)}\\b`, "i").test(hint)) return true;
  const numbers = fact.match(/\d+(?:\.\d+)?/g) ?? [];
  return numbers.some((number) => number.length >= 2 && hint.includes(number));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cloze(answer: string, wrongs: string[]): string | null {
  const wrongText = wrongs.join(" ");
  const parts = tokens(answer);
  const unique = parts.filter((token) => !new RegExp(`\\b${escapeRegExp(token)}\\b`, "i").test(wrongText));
  const pivots = unique.filter((token) => /\d/.test(token) || !STOP.has(token.toLowerCase()));
  if (pivots.length === 0) return null;
  const ranked = [...pivots].sort((a, b) => {
    const aNum = /\d/.test(a) ? 1 : 0;
    const bNum = /\d/.test(b) ? 1 : 0;
    if (aNum !== bNum) return bNum - aNum;
    return b.length - a.length;
  });
  const content = parts.filter((token) => !STOP.has(token.toLowerCase()));
  const blankBudget = content.length >= 8 ? 2 : 1;
  const chosen: string[] = [];
  for (const token of ranked) {
    if (chosen.length >= blankBudget) break;
    const remaining = content.filter(
      (item) => item.toLowerCase() !== token.toLowerCase() && !chosen.some((pick) => pick.toLowerCase() === item.toLowerCase()),
    );
    if (remaining.length === 0 && parts.length > 1) continue;
    chosen.push(token);
  }
  if (chosen.length === 0 && parts.length > 1) chosen.push(ranked[0]!);
  if (chosen.length === 0) return null;
  const skip = new Set(chosen.map((token) => token.toLowerCase()));
  const frame = answer.replace(TOKEN, (token) => (skip.has(token.toLowerCase()) ? "blank" : token));
  const left = tokens(frame).filter((token) => token !== "blank" && !STOP.has(token.toLowerCase()));
  if (left.length === 0) return null;
  return frame.replace(/\s+/g, " ").trim();
}

function initial(answer: string): string | null {
  const word = answer.trim().replace(/^(the|a|an)\s+/i, "");
  const letter = word.match(/[A-Za-z0-9]/);
  return letter ? letter[0]!.toUpperCase() : null;
}

function pointer(text: string, answer: string, wrongs: string[]): string {
  const normalized = answer.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  const quiet = /^(never|at no time|no|none)$/i.test(normalized) || /^no,/i.test(normalized);
  if (quiet) return "The rule leaves this situation quiet. The choice says that no occasion qualifies.";
  const question = text.toLowerCase();
  let line = "Read the question’s exact rule, then find the choice that states it.";
  if (/^who\b|which agency|who must|who may|who recommends|who selects/.test(question)) {
    line = "Name the person or office that carries this duty.";
  } else if (/maximum|minimum|how many|how long|normal term|grace period|how often/.test(question)) {
    line = "The rule uses one figure. Find the choice that carries it.";
  } else if (/frequency|which band|mhz|meter band|wavelength/.test(question)) {
    line = "Find the range or band where this privilege actually sits.";
  } else if (/^when\b/.test(question)) {
    line = "Find the occasion this rule is about.";
  } else if (/unit of|measured in which|abbreviation for/.test(question)) {
    line = "The question is asking for the name of the measure.";
  } else if (/q signal/.test(question)) {
    line = "The letters are a short code for the situation in the question.";
  }
  const letter = initial(normalized);
  const short = normalized.split(" ").length <= 3;
  const uniqueLetter = letter != null && /[A-Z]/.test(letter) && wrongs.every((wrong) => initial(wrong) !== letter);
  if (short && uniqueLetter) return `${line} It begins with the letter ${letter}.`;
  return line;
}

export function cardLead(question: Pick<PoolQuestion, "id" | "text" | "answers" | "correctIndex">): string {
  const answer = question.answers[question.correctIndex] ?? "";
  const wrongs = question.answers.filter((_, index) => index !== question.correctIndex);
  const trimmed = answer.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  if (/^all these choices are correct$/i.test(trimmed)) {
    return "Each of the other choices belongs. The line you want is the one that gathers them.";
  }
  const hook = conventionHook(question.id);
  if (hook && !givesAway(hook, answer)) return hook;
  const peg = PEGS[question.id];
  if (peg) return peg;
  const frame = cloze(trimmed, wrongs);
  if (frame) return `Find the choice that completes this line: “${frame}.”`;
  if (wrongs.some((wrong) => /all these choices are correct/i.test(wrong))) {
    return "Stay with the single line this question is asking for. The choice that gathers every line can wait.";
  }
  return pointer(question.text, trimmed, wrongs);
}

export function ideaBeforeAnswer(question: Pick<PoolQuestion, "group" | "answers" | "correctIndex">, title: string, steps: string[]): string {
  const note = groupNote(question.group, title);
  if (noteGivesAway(note, question.answers[question.correctIndex] ?? "", steps)) return `This one follows from ${title}.`;
  return note;
}

export function noteGivesAway(note: string, answer: string, steps: string[]): boolean {
  const last = steps.at(-1);
  if (last && note.includes(last)) return true;
  const fact = answer.trim();
  if (fact.length < 3) return false;
  return note.toLowerCase().includes(fact.toLowerCase());
}

export function stepsBeforeAnswer(steps: string[]): string[] {
  if (steps.length <= 1) return [];
  return steps.slice(0, -1);
}

export function practiceHref(question: PoolQuestion, licenseClass: string): string | null {
  return labHref(question, licenseClass) ?? chartHref(question.id, question.group, licenseClass);
}

export type MissReview = {
  lane: Lane;
  kicker: string;
  fact: string;
  href: string | null;
  hrefLabel: string | null;
};

export function missReview(question: PoolQuestion, licenseClass: string, groupTitle: string): MissReview {
  if (question.lane === "card") {
    const chart = chartHref(question.id, question.group, licenseClass);
    const answer = question.answers[question.correctIndex] ?? "";
    const lead = cardLead(question);
    const hook = conventionHook(question.id);
    return {
      lane: "card",
      kicker: "Exam card",
      fact: [lead, cardFact(answer), hook !== lead ? hook : null].filter(Boolean).join(" "),
      href: chart,
      hrefLabel: chart ? "Open the band chart" : null,
    };
  }
  const href = practiceHref(question, licenseClass);
  return {
    lane: "bench",
    kicker: "Radio idea",
    fact: ideaBeforeAnswer(question, groupTitle, question.workedSteps),
    href,
    hrefLabel: href?.startsWith("/bands") ? "Open the band chart" : href ? "Open the bench" : null,
  };
}
