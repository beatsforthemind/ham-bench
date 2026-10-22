import type { LicenseClass, PoolRegistryEntry } from "./pool-types";

export function selectActive(
  entries: PoolRegistryEntry[],
  licenseClass: LicenseClass,
  day: string,
): PoolRegistryEntry | null {
  const matches = entries.filter(
    (entry) =>
      entry.licenseClass === licenseClass &&
      entry.effectiveFrom <= day &&
      day <= entry.effectiveThrough,
  );
  if (matches.length !== 1) return null;
  return matches[0] ?? null;
}

export function activeOn(entries: PoolRegistryEntry[], day: string): PoolRegistryEntry[] {
  const classes: LicenseClass[] = ["technician", "general", "extra"];
  return classes.flatMap((licenseClass) => {
    const entry = selectActive(entries, licenseClass, day);
    return entry ? [entry] : [];
  });
}
