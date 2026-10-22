"use client";

import Link from "next/link";
import { useBench } from "./bench-provider";

const LINKS = [
  { href: "/", label: "Bench" },
  { href: "/bands", label: "Bands" },
  { href: "/labs", label: "Labs" },
  { href: "/progress", label: "Progress" },
  { href: "/about/sources", label: "Sources" },
];

export function SiteHeader() {
  const { settings, setSettings } = useBench();
  return (
    <header className="border-b border-line bg-card/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="display text-2xl text-walnut">
          Ham Bench
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-lg">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-ink-soft hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={settings.fastLane}
            onChange={(event) => setSettings({ ...settings, fastLane: event.target.checked })}
          />
          Fast lane
        </label>
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
