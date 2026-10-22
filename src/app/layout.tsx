import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { BenchProvider } from "@/components/bench-provider";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ham Bench",
    template: "%s · Ham Bench",
  },
  description:
    "Practice the US amateur radio exams with the public-domain question pools, a one-question-per-group mock, and a workbench for the electrical questions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <BenchProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
          <SiteFooter />
        </BenchProvider>
      </body>
    </html>
  );
}
