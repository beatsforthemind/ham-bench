import Image from "next/image";
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

export function FigureView({ id, hidden }: { id: string | null; hidden: boolean }) {
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
  return (
    <Image
      src={src}
      alt={`Official NCVEC figure ${id}`}
      width={size.width}
      height={size.height}
      unoptimized
      className="block h-auto w-full rounded-2xl bg-white"
    />
  );
}
