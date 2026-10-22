import type { LicenseClass } from "./pool-types";

export const CLASS_RANK: Record<LicenseClass, number> = {
  technician: 0,
  general: 1,
  extra: 2,
};

export function classAtLeast(have: LicenseClass, need: LicenseClass): boolean {
  return CLASS_RANK[have] >= CLASS_RANK[need];
}

export const CLASS_INFO: Record<
  LicenseClass,
  { name: string; element: string; tone: string; summary: string }
> = {
  technician: {
    name: "Technician",
    element: "Element 2",
    tone: "text-sage",
    summary: "A Technician can miss nine questions and still pass. Only a couple of those thirty-five are math.",
  },
  general: {
    name: "General",
    element: "Element 3",
    tone: "text-brass",
    summary: "General adds HF privileges and the next layer of circuits: reactance, decibels, dividers, and the dipole formula in feet.",
  },
  extra: {
    name: "Extra",
    element: "Element 4",
    tone: "text-extra",
    summary: "Extra is the long paper. Resonance, time constants, phasors, and the Smith chart are where the picture helps.",
  },
};
