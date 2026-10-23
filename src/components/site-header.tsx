"use client";

import Link from "next/link";
import { LICENSE_CLASSES, type LicenseClass } from "@/lib/pool-types";
import { useBench } from "./bench-provider";

const LINKS = [
  { href: "/", label: "Bench" },
  { href: "/bands", label: "Bands" },
  { href: "/labs", label: "Labs" },
  { href: "/progress", label: "Progress" },
  { href: "/about/sources", label: "Sources" },
];

export function SiteHeader() {
  const { settings, setSettings, ready } = useBench();
  return (
    <header className="border-b border-line bg-card/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="display inline-flex min-h-11 items-center text-2xl text-walnut">
          Ham Bench
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-lg">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center px-2 text-ink-soft hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm text-ink-soft">
            Study
            <select
              className="min-h-11 rounded-xl border border-line bg-paper px-2 text-base text-ink"
              value={settings.studyClass}
              disabled={!ready}
              onChange={(event) => setSettings({ studyClass: event.target.value as LicenseClass })}
            >
              {LICENSE_CLASSES.map((licenseClass) => (
                <option key={licenseClass} value={licenseClass}>
                  {licenseClass}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line px-5 py-6 text-center text-sm text-ink-soft">
      Practice only. A score here is not a CSCE and it is not a license. The exam is still given in person by Volunteer Examiners.
    </footer>
  );
}
