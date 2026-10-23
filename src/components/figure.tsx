"use client";

import Image from "next/image";
import { useState } from "react";
import { FIGURE_ASSETS } from "@/lib/pool-facts";

const FIGURE_SIZE: Record<string, { width: number; height: number }> = {
  "T-1": { width: 1800, height: 1200 },
  "T-2": { width: 1800, height: 1200 },
  "T-3": { width: 1800, height: 1200 },
  "G7-1": { width: 1845, height: 1455 },
  "E5-1": { width: 276, height: 277 },
  "E6-1": { width: 288, height: 207 },
  "E6-2": { width: 252, height: 175 },
  "E6-3": { width: 268, height: 183 },
  "E7-1": { width: 252, height: 231 },
  "E7-2": { width: 253, height: 212 },
  "E7-3": { width: 214, height: 210 },
  "E9-1": { width: 244, height: 215 },
  "E9-2": { width: 277, height: 168 },
  "E9-3": { width: 199, height: 218 },
};

export function FigureView({
  id,
  hidden,
  compact = false,
  enlarge = true,
}: {
  id: string | null;
  hidden: boolean;
  compact?: boolean;
  enlarge?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!id) return null;
  const src = FIGURE_ASSETS[id];
  if (!src) return <p>Figure {id} is not in this copy of the bench.</p>;
  if (hidden) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-paper-deep px-4 py-6 text-ink-soft">
        Figure {id} is hidden on this diagram-free paper.
      </p>
    );
  }
  const size = FIGURE_SIZE[id] ?? { width: 1200, height: 800 };
  const alt = `Official NCVEC figure ${id}. It is a numbered drawing.`;
  if (!enlarge) {
    return <Image src={src} alt={alt} width={size.width} height={size.height} unoptimized className="block h-auto w-full rounded-2xl bg-white" />;
  }
  return (
    <div>
      <button type="button" className="block w-full text-left" onClick={() => setOpen(true)} aria-label={`Enlarge figure ${id}`}>
        <Image
          src={src}
          alt={alt}
          width={size.width}
          height={size.height}
          unoptimized
          className={compact ? "mx-auto block h-auto w-auto max-h-[40vh] max-w-full rounded-2xl bg-white object-contain" : "block h-auto w-full rounded-2xl bg-white"}
          style={compact ? { width: "auto", height: "auto" } : undefined}
        />
        {compact ? <span className="mt-2 block text-sm text-ink-soft">Enlarge</span> : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-walnut-deep/80" role="dialog" aria-modal="true" aria-label={`Figure ${id}`}>
          <div className="flex shrink-0 justify-end p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button type="button" className="min-h-11 rounded-full bg-paper px-4 text-ink" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Image
              src={src}
              alt={alt}
              width={size.width}
              height={size.height}
              unoptimized
              className="mx-auto h-auto w-auto max-h-[85vh] max-w-full rounded-2xl bg-white object-contain"
              style={{ width: "auto", height: "auto" }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
