"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { LICENSE_CLASSES, type LicenseClass } from "@/lib/pool-types";
import { useBench } from "./bench-provider";

const LINKS = [
  { href: "/", label: "Bench" },
  { href: "/bands", label: "Bands" },
  { href: "/labs", label: "Labs" },
  { href: "/progress", label: "Progress" },
  { href: "/about/sources", label: "Sources" },
];

const SetSessionBarContext = createContext<(active: boolean) => void>(() => {});
const SessionBarOnContext = createContext(false);

export function PhoneChromeProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(false);
  return (
    <SetSessionBarContext.Provider value={setSession}>
      <SessionBarOnContext.Provider value={session}>
        <div className="phone-shell flex min-h-full flex-1 flex-col" data-session={session ? "on" : "off"}>
          {children}
        </div>
      </SessionBarOnContext.Provider>
    </SetSessionBarContext.Provider>
  );
}

function useSessionBar(active: boolean) {
  const setActive = useContext(SetSessionBarContext);
  useLayoutEffect(() => {
    setActive(active);
    return () => setActive(false);
  }, [active, setActive]);
}

function classFromPath(pathname: string): LicenseClass | null {
  const [root, value] = pathname.split("/").slice(1);
  if (root !== "license") return null;
  return LICENSE_CLASSES.find((item) => item === value) ?? null;
}

export function StudyClassPicker({ licenseClass }: { licenseClass?: LicenseClass }) {
  const { settings, setSettings, ready } = useBench();
  const pathname = usePathname();
  const router = useRouter();
  const value = licenseClass ?? settings.studyClass;
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-ink-soft md:hidden">
      Study
      <select
        className="min-h-11 rounded-xl border border-line bg-paper px-2 text-base text-ink"
        value={value}
        disabled={!ready}
        onChange={(event) => {
          const next = event.target.value as LicenseClass;
          setSettings({ studyClass: next });
          if (licenseClass && licenseClass !== next) {
            router.push(pathname.replace(`/license/${licenseClass}`, `/license/${next}`));
          }
        }}
      >
        {LICENSE_CLASSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SessionBar({ children }: { children: ReactNode }) {
  useSessionBar(true);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:inset-auto md:z-auto md:border-0 md:bg-transparent md:px-0 md:py-0">
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </div>
  );
}

export function SiteHeader() {
  const { settings, setSettings, ready } = useBench();
  const sessionOn = useContext(SessionBarOnContext);
  const pathname = usePathname();
  const navClass = classFromPath(pathname) ?? settings.studyClass;
  const onStudy =
    Boolean(classFromPath(pathname)) && !pathname.includes("/practice") && !pathname.includes("/exam") && !pathname.includes("/learn");
  const phoneLinks = [
    { href: "/", label: "Bench", on: pathname === "/" },
    { href: `/license/${navClass}`, label: "Study", on: onStudy },
    { href: `/license/${navClass}/learn`, label: "Learn", on: pathname.includes("/learn") },
    { href: `/license/${navClass}/exam`, label: "Exam", on: pathname.includes("/exam") },
    { href: "/progress", label: "Progress", on: pathname.startsWith("/progress") },
  ];
  return (
    <>
      <header className="border-b border-line bg-card/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="display inline-flex min-h-11 items-center text-2xl text-walnut">
            Ham Bench
          </Link>
          <nav className="hidden flex-wrap items-center gap-2 text-lg md:flex">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center px-2 text-ink-soft hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden flex-wrap items-center gap-3 md:flex">
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
      {sessionOn ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 md:hidden" aria-label="Sections">
          <ul className="flex pb-[env(safe-area-inset-bottom)]">
            {phoneLinks.map((link) => (
              <li key={link.label} className="min-w-0 flex-1">
                <Link
                  href={link.href}
                  aria-current={link.on ? "page" : undefined}
                  className={`flex min-h-11 items-center justify-center px-1 text-center text-xs whitespace-nowrap min-[380px]:text-sm ${link.on ? "text-ink" : "text-ink-soft"}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line px-5 py-6 text-center text-sm text-ink-soft">
      Practice only. A score here is not a CSCE and it is not a license. The exam is still given in person by Volunteer Examiners.
    </footer>
  );
}
