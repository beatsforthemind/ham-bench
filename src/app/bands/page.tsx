import type { Metadata } from "next";
import { BandMap } from "@/components/band-map";

export const metadata: Metadata = { title: "Bands" };

export default function BandsPage() {
  return (
    <div className="space-y-6">
      <h1 className="display text-6xl">Band map</h1>
      <p className="max-w-3xl text-xl">
        Privilege edges come from Part 97, not from a publisher’s chart. Ask the map whether 28.4 MHz phone is legal for a Technician.
      </p>
      <BandMap />
    </div>
  );
}
