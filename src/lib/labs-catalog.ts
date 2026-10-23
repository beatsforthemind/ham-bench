import type { LicenseClass } from "./pool-types";

export const LAB_SLUGS = [
  "ohms",
  "prefixes",
  "decibels",
  "schematics",
  "antenna",
  "swr",
  "propagation",
  "safety",
  "reactance",
  "dividers",
  "power",
  "resonance",
  "time",
  "phasors",
  "smith",
] as const;

export type LabSlug = (typeof LAB_SLUGS)[number];

export type LabMeta = {
  slug: LabSlug;
  title: string;
  summary: string;
  min: LicenseClass;
};

export const LABS: LabMeta[] = [
  { slug: "ohms", title: "Ohm’s law bench", summary: "Set two of voltage, current, and resistance. The third, and the watts, follow.", min: "technician" },
  { slug: "prefixes", title: "Prefix tape", summary: "Move pico through giga without sliding the decimal the wrong way.", min: "technician" },
  { slug: "decibels", title: "Decibel ladder", summary: "Three decibels doubles power. Ten decibels multiplies it by ten.", min: "technician" },
  { slug: "schematics", title: "Schematic dojo", summary: "Learn the symbol, then name the numbered part on the official figure.", min: "technician" },
  { slug: "antenna", title: "Antenna shop", summary: "Wavelength is 300 divided by megahertz. Dipole length in feet waits for General.", min: "technician" },
  { slug: "swr", title: "Match and SWR", summary: "1:1 is a match. A high reading is power coming back, and many radios then fold power down.", min: "technician" },
  { slug: "propagation", title: "Propagation theater", summary: "Scrub the hour and the frequency. Watch the D layer, skip, and line of sight.", min: "technician" },
  { slug: "safety", title: "Safety scenes", summary: "Charged capacitors, hot batteries, towers, power lines, and who is responsible for exposure.", min: "technician" },
  { slug: "reactance", title: "Reactance bench", summary: "Inductive reactance rises with frequency. Capacitive reactance falls.", min: "general" },
  { slug: "dividers", title: "Dividers and parallels", summary: "Three resistors in parallel, and a series divider that shares one current.", min: "general" },
  { slug: "power", title: "PEP, RMS, and the link", summary: "Peak-to-peak into 50 ohms. The ERP section and the 10 watt link budget wait for Extra.", min: "general" },
  { slug: "resonance", title: "Resonance", summary: "At resonance the reactances cancel. Half-power bandwidth is frequency divided by Q.", min: "extra" },
  { slug: "time", title: "Time constant", summary: "One time constant takes a capacitor to about 63 percent.", min: "extra" },
  { slug: "phasors", title: "Phasors", summary: "Rectangular R and X become a magnitude and an angle, next to figure E5-1.", min: "extra" },
  { slug: "smith", title: "Smith chart", summary: "The official E9-3 chart. Infinity is on the right. The only straight line is resistance.", min: "extra" },
];

export function labBySlug(slug: string): LabMeta | undefined {
  return LABS.find((lab) => lab.slug === slug);
}

export function isLabSlug(slug: string): slug is LabSlug {
  return (LAB_SLUGS as readonly string[]).includes(slug);
}
