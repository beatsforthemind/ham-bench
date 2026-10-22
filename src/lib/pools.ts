import extraJson from "../../content/pools/extra.json";
import generalJson from "../../content/pools/general.json";
import registryJson from "../../content/pools/registry.json";
import technicianJson from "../../content/pools/technician.json";
import { selectActive } from "./active-pool";
import type { LicenseClass, PoolFile, PoolQuestion, PoolRegistry } from "./pool-types";

export const registry = registryJson as PoolRegistry;
export const pools: Record<LicenseClass, PoolFile> = {
  technician: technicianJson as PoolFile,
  general: generalJson as PoolFile,
  extra: extraJson as PoolFile,
};

export function getPool(licenseClass: LicenseClass): PoolFile {
  return pools[licenseClass];
}

export function questionById(pool: PoolFile, id: string): PoolQuestion | undefined {
  return pool.questions.find((question) => question.id === id);
}

export function poolForToday(licenseClass: LicenseClass, day = todayIso()): PoolFile | null {
  const entry = selectActive(registry.pools, licenseClass, day);
  if (!entry) return null;
  const pool = pools[licenseClass];
  if (pool.revision !== entry.revision) return null;
  return pool;
}

export function todayIso(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isLicenseClass(value: string): value is LicenseClass {
  return value === "technician" || value === "general" || value === "extra";
}
