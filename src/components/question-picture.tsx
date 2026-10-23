import type { ReactNode } from "react";
import { questionPicture, type BandId, type BenchId, type SceneId, type SymbolId } from "@/lib/question-pictures";

const ink = { fill: "none", stroke: "currentColor", strokeWidth: 2.5 } as const;

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <svg viewBox="0 0 220 120" role="img" aria-label={label} className="w-full text-ink-soft">
        {children}
      </svg>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function trace(width: number, mid: number, amp: number): string {
  return Array.from({ length: 81 }, (_, index) => {
    const t = index / 80;
    const x = 8 + t * (width - 16);
    const y = mid - Math.sin(t * Math.PI * 4) * amp;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function Swing({ amp, label, clipId }: { amp: number; label: string; clipId: string }) {
  const width = 320;
  const mid = 58;
  const rail = 26;
  const points = trace(width, mid, amp);
  const overflows = amp > rail;
  return (
    <div className="min-w-0">
      <svg viewBox={`0 0 ${width} 116`} role="img" aria-label={label} className="w-full text-ink-soft">
        <rect x="8" y={mid - rail} width={width - 16} height={rail * 2} className="fill-sage/15" />
        <line x1="8" y1={mid - rail} x2={width - 8} y2={mid - rail} stroke="currentColor" strokeWidth="1.5" />
        <line x1="8" y1={mid + rail} x2={width - 8} y2={mid + rail} stroke="currentColor" strokeWidth="1.5" />
        {overflows ? (
          <>
            <defs>
              <clipPath id={clipId}>
                <rect x="8" y={mid - rail} width={width - 16} height={rail * 2} />
              </clipPath>
            </defs>
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber" />
            <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sage" clipPath={`url(#${clipId})`} />
          </>
        ) : (
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sage" />
        )}
      </svg>
      <p className="text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function Zigzag({ x, y }: { x: number; y: number }) {
  const pairs = [
    [0, 0],
    [12, -14],
    [24, 14],
    [36, -14],
    [48, 14],
    [60, -14],
    [72, 0],
  ];
  return <polyline points={pairs.map(([dx, dy]) => `${x + dx},${y + dy}`).join(" ")} {...ink} />;
}

function humps(x: number, y: number, width: number, amp: number, cycles: number): string {
  return Array.from({ length: 41 }, (_, index) => {
    const t = index / 40;
    const lift = Math.abs(Math.sin(t * Math.PI * cycles));
    return `${(x + t * width).toFixed(1)},${(y - lift * amp).toFixed(1)}`;
  }).join(" ");
}

function wave(x: number, y: number, width: number, amp: number, cycles: number): string {
  return Array.from({ length: 41 }, (_, index) => {
    const t = index / 40;
    return `${(x + t * width).toFixed(1)},${(y - Math.sin(t * Math.PI * 2 * cycles) * amp).toFixed(1)}`;
  }).join(" ");
}

function SymbolMark({ symbol }: { symbol: SymbolId }) {
  switch (symbol) {
    case "flow":
      return (
        <>
          <line x1="20" y1="60" x2="200" y2="60" {...ink} />
          <polygon points="78,60 64,52 64,68" className="fill-sage" />
          <polygon points="128,60 114,52 114,68" className="fill-sage" />
          <polygon points="178,60 164,52 164,68" className="fill-sage" />
        </>
      );
    case "push":
      return (
        <>
          <circle cx="36" cy="60" r="16" {...ink} />
          <circle cx="184" cy="60" r="16" {...ink} />
          <line x1="52" y1="60" x2="156" y2="60" {...ink} className="text-sage" />
          <polygon points="156,60 140,50 140,70" className="fill-sage" />
        </>
      );
    case "rate":
      return (
        <>
          <circle cx="110" cy="46" r="24" className="fill-amber/25" stroke="currentColor" strokeWidth="2.5" />
          <line x1="98" y1="70" x2="86" y2="98" {...ink} />
          <line x1="122" y1="70" x2="134" y2="98" {...ink} />
          <line x1="82" y1="98" x2="138" y2="98" {...ink} />
        </>
      );
    case "zigzag":
      return <Zigzag x={74} y={60} />;
    case "wiper":
      return (
        <>
          <Zigzag x={74} y={68} />
          <line x1="122" y1="22" x2="110" y2="58" {...ink} className="text-sage" />
          <polygon points="110,58 102,46 118,46" className="fill-sage" />
        </>
      );
    case "plates":
      return (
        <>
          <line x1="24" y1="60" x2="92" y2="60" {...ink} />
          <line x1="128" y1="60" x2="196" y2="60" {...ink} />
          <line x1="92" y1="28" x2="92" y2="92" stroke="currentColor" strokeWidth="4" />
          <line x1="128" y1="28" x2="128" y2="92" stroke="currentColor" strokeWidth="4" />
        </>
      );
    case "plates-gap":
      return (
        <>
          <line x1="24" y1="60" x2="86" y2="60" {...ink} />
          <line x1="134" y1="60" x2="196" y2="60" {...ink} />
          <line x1="86" y1="28" x2="86" y2="92" stroke="currentColor" strokeWidth="4" />
          <line x1="134" y1="28" x2="134" y2="92" stroke="currentColor" strokeWidth="4" />
          <rect x="98" y="36" width="24" height="48" className="fill-ink-soft/20" />
        </>
      );
    case "coil":
      return <path d="M28 78 Q48 28 68 78 Q88 28 108 78 Q128 28 148 78 Q168 28 188 78" {...ink} />;
    case "coil-field":
      return (
        <>
          <path d="M40 86 Q58 48 76 86 Q94 48 112 86 Q130 48 148 86 Q166 48 184 86" {...ink} />
          <path d="M70 40 Q110 8 150 40" {...ink} className="text-sage" />
          <path d="M84 32 Q110 12 136 32" {...ink} className="text-sage" />
        </>
      );
    case "diode":
      return (
        <>
          <line x1="24" y1="60" x2="78" y2="60" {...ink} />
          <polygon points="78,32 78,88 122,60" {...ink} />
          <line x1="122" y1="32" x2="122" y2="88" {...ink} />
          <line x1="122" y1="60" x2="196" y2="60" {...ink} />
          <polygon points="168,60 152,52 152,68" className="fill-sage" />
        </>
      );
    case "switch":
      return (
        <>
          <line x1="24" y1="78" x2="196" y2="78" {...ink} className="text-sage" />
          <circle cx="110" cy="78" r="5" className="fill-sage" />
          <line x1="110" y1="78" x2="110" y2="36" {...ink} />
          <polygon points="110,28 102,42 118,42" className="fill-amber" />
        </>
      );
    case "layers":
      return (
        <>
          <rect x="48" y="22" width="124" height="22" rx="4" className="fill-sage/30" stroke="currentColor" strokeWidth="2" />
          <rect x="48" y="50" width="124" height="22" rx="4" className="fill-amber/25" stroke="currentColor" strokeWidth="2" />
          <rect x="48" y="78" width="124" height="22" rx="4" className="fill-sage/30" stroke="currentColor" strokeWidth="2" />
        </>
      );
    case "gain":
      return (
        <>
          <polyline points={wave(16, 60, 60, 8, 2)} {...ink} />
          <polygon points="84,36 84,84 126,60" {...ink} />
          <line x1="126" y1="36" x2="126" y2="84" {...ink} />
          <polyline points={wave(136, 60, 70, 22, 2)} {...ink} className="text-sage" />
        </>
      );
    case "rectifier":
      return (
        <>
          <polyline points={wave(12, 60, 70, 22, 2)} {...ink} className="text-amber" />
          <polygon points="92,40 92,80 114,60" {...ink} />
          <line x1="114" y1="40" x2="114" y2="80" {...ink} />
          <polyline points={humps(124, 78, 80, 28, 2)} {...ink} className="text-sage" />
        </>
      );
    case "regulator":
      return (
        <>
          <polyline points={wave(16, 60, 80, 18, 3)} {...ink} className="text-amber" />
          <line x1="108" y1="60" x2="204" y2="60" {...ink} className="text-sage" />
        </>
      );
    case "sensitivity":
      return (
        <>
          <polyline points={wave(20, 60, 70, 6, 3)} {...ink} className="text-sage" />
          <path d="M110 44 h28 v32 h-28 q-16 0 -16 -16 q0 -16 16 -16 z" {...ink} />
          <path d="M146 50 q12 10 0 20" {...ink} className="text-sage" />
          <path d="M154 44 q18 16 0 32" {...ink} className="text-sage" />
        </>
      );
    case "mixer":
      return (
        <>
          <polyline points={wave(8, 36, 60, 10, 1)} {...ink} />
          <polyline points={wave(8, 84, 60, 10, 3)} {...ink} />
          <circle cx="112" cy="60" r="22" {...ink} />
          <polyline points={wave(142, 60, 68, 16, 2)} {...ink} className="text-sage" />
        </>
      );
    case "selectivity":
      return (
        <>
          <rect x="78" y="28" width="64" height="72" className="fill-sage/15" />
          <polyline points="20,90 50,90 70,40 90,90 110,30 130,90 150,48 170,90 200,90" {...ink} />
        </>
      );
    case "across":
      return (
        <>
          <line x1="40" y1="72" x2="74" y2="72" {...ink} />
          <Zigzag x={74} y={72} />
          <line x1="146" y1="72" x2="180" y2="72" {...ink} />
          <line x1="40" y1="72" x2="40" y2="102" {...ink} />
          <line x1="180" y1="72" x2="180" y2="102" {...ink} />
          <line x1="40" y1="102" x2="100" y2="102" {...ink} />
          <line x1="120" y1="102" x2="180" y2="102" {...ink} />
          <line x1="106" y1="94" x2="106" y2="110" stroke="currentColor" strokeWidth="2" />
          <line x1="114" y1="88" x2="114" y2="116" stroke="currentColor" strokeWidth="4" />
          <line x1="74" y1="72" x2="74" y2="34" {...ink} />
          <line x1="146" y1="72" x2="146" y2="34" {...ink} />
          <line x1="74" y1="34" x2="96" y2="34" {...ink} />
          <line x1="124" y1="34" x2="146" y2="34" {...ink} />
          <circle cx="110" cy="34" r="14" {...ink} className="text-sage" />
        </>
      );
    case "series-meter":
      return (
        <>
          <line x1="20" y1="60" x2="70" y2="60" {...ink} />
          <circle cx="92" cy="60" r="18" {...ink} className="text-sage" />
          <line x1="110" y1="60" x2="130" y2="60" {...ink} />
          <Zigzag x={130} y={60} />
        </>
      );
    default:
      return null;
  }
}

function Cell({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x} y={y} width="28" height="16" rx="2" stroke="currentColor" strokeWidth="2" className="fill-sage/20" />
      <line x1={x + 6} y1={y + 8} x2={x + 12} y2={y + 8} stroke="currentColor" strokeWidth="2" />
      <line x1={x + 16} y1={y + 5} x2={x + 22} y2={y + 5} stroke="currentColor" strokeWidth="2" />
      <line x1={x + 19} y1={y + 2} x2={x + 19} y2={y + 8} stroke="currentColor" strokeWidth="2" />
    </>
  );
}

function Scene({ scene }: { scene: SceneId }) {
  switch (scene) {
    case "whip":
      return (
        <>
          <line x1="70" y1="100" x2="150" y2="100" {...ink} />
          <line x1="110" y1="100" x2="110" y2="36" {...ink} />
        </>
      );
    case "whip-hat":
      return (
        <>
          <line x1="70" y1="100" x2="150" y2="100" {...ink} />
          <line x1="110" y1="100" x2="110" y2="36" {...ink} />
          <line x1="78" y1="36" x2="142" y2="36" stroke="currentColor" strokeWidth="4" className="text-sage" />
          <line x1="90" y1="28" x2="130" y2="28" {...ink} className="text-sage" />
        </>
      );
    case "tip":
      return (
        <>
          <line x1="110" y1="100" x2="110" y2="28" {...ink} className="text-amber" />
          <polygon points="110,18 104,30 116,30" className="fill-amber" />
          <circle cx="92" cy="24" r="3" className="fill-amber" />
          <circle cx="128" cy="22" r="3" className="fill-amber" />
        </>
      );
    case "ball":
      return (
        <>
          <line x1="110" y1="100" x2="110" y2="40" {...ink} className="text-sage" />
          <circle cx="110" cy="28" r="14" {...ink} className="text-sage" />
        </>
      );
    case "thin-lead":
      return (
        <>
          <rect x="24" y="40" width="36" height="28" rx="4" {...ink} />
          <line x1="60" y1="54" x2="150" y2="54" stroke="currentColor" strokeWidth="1.5" className="text-amber" />
          <rect x="150" y="42" width="28" height="24" rx="4" {...ink} className="text-amber" />
        </>
      );
    case "thick-lead":
      return (
        <>
          <rect x="24" y="40" width="36" height="28" rx="4" {...ink} />
          <line x1="60" y1="54" x2="140" y2="54" stroke="currentColor" strokeWidth="6" className="text-sage" />
          <line x1="156" y1="40" x2="156" y2="80" stroke="currentColor" strokeWidth="4" />
          <line x1="170" y1="48" x2="170" y2="72" stroke="currentColor" strokeWidth="4" className="text-sage" />
        </>
      );
    case "stubby":
      return (
        <>
          <line x1="70" y1="100" x2="120" y2="100" {...ink} />
          <line x1="95" y1="100" x2="95" y2="58" {...ink} className="text-sage" />
          <path d="M112 70 q16 -16 0 -32" {...ink} className="text-sage" />
        </>
      );
    case "full-size":
      return (
        <>
          <line x1="70" y1="100" x2="140" y2="100" {...ink} />
          <line x1="105" y1="100" x2="105" y2="18" {...ink} />
          <path d="M124 78 q20 -28 0 -56" {...ink} />
          <path d="M140 78 q28 -28 0 -56" {...ink} />
        </>
      );
    case "narrow-span":
      return (
        <>
          <line x1="20" y1="78" x2="200" y2="78" {...ink} />
          <rect x="96" y="48" width="28" height="30" className="fill-sage/50" />
        </>
      );
    case "wide-span":
      return (
        <>
          <line x1="20" y1="78" x2="200" y2="78" {...ink} />
          <rect x="48" y="48" width="124" height="30" className="fill-ink-soft/15" />
        </>
      );
    case "one-mark":
      return <circle cx="110" cy="60" r="16" className="fill-amber" />;
    case "every-mark":
      return (
        <>
          <circle cx="60" cy="60" r="16" className="fill-sage" />
          <circle cx="110" cy="60" r="16" className="fill-sage" />
          <circle cx="160" cy="60" r="16" className="fill-sage" />
        </>
      );
    case "one-string":
      return (
        <>
          <Cell x={96} y={18} />
          <Cell x={96} y={40} />
          <Cell x={96} y={62} />
          <Cell x={96} y={84} />
        </>
      );
    case "side-strings":
      return (
        <>
          <Cell x={58} y={28} />
          <Cell x={58} y={52} />
          <Cell x={58} y={76} />
          <Cell x={134} y={28} />
          <Cell x={134} y={52} />
          <Cell x={134} y={76} />
        </>
      );
    case "backfeed":
      return (
        <>
          <rect x="24" y="36" width="40" height="48" {...ink} />
          <line x1="64" y1="60" x2="140" y2="60" {...ink} className="text-amber" />
          <polygon points="64,60 80,52 80,68" className="fill-amber" />
          <line x1="156" y1="40" x2="156" y2="80" stroke="currentColor" strokeWidth="4" />
          <line x1="170" y1="48" x2="170" y2="72" stroke="currentColor" strokeWidth="4" />
        </>
      );
    case "blocked":
      return (
        <>
          <rect x="24" y="36" width="40" height="48" {...ink} />
          <line x1="64" y1="60" x2="96" y2="60" {...ink} />
          <polygon points="96,44 96,76 120,60" {...ink} className="text-sage" />
          <line x1="120" y1="44" x2="120" y2="76" {...ink} className="text-sage" />
          <line x1="120" y1="60" x2="148" y2="60" {...ink} />
          <line x1="156" y1="40" x2="156" y2="80" stroke="currentColor" strokeWidth="4" />
          <line x1="170" y1="48" x2="170" y2="72" stroke="currentColor" strokeWidth="4" />
        </>
      );
    case "ring":
      return <circle cx="110" cy="60" r="36" {...ink} className="text-amber" />;
    case "beam":
      return (
        <>
          <line x1="40" y1="60" x2="100" y2="60" {...ink} />
          <path d="M100 60 Q150 20 190 60 Q150 100 100 60" className="fill-sage/30" stroke="currentColor" strokeWidth="2.5" />
        </>
      );
    case "both-sides":
      return (
        <>
          <line x1="20" y1="60" x2="200" y2="60" {...ink} />
          <path d="M40 60 Q70 16 110 60 Q150 16 180 60" {...ink} className="text-amber" />
          <path d="M40 60 Q70 104 110 60 Q150 104 180 60" {...ink} className="text-amber" />
        </>
      );
    case "one-side":
      return (
        <>
          <line x1="20" y1="78" x2="200" y2="78" {...ink} />
          <path d="M40 78 Q80 24 120 78 Q160 24 190 78" className="fill-sage/25" stroke="currentColor" strokeWidth="2.5" />
        </>
      );
    case "flat-grid":
      return (
        <>
          <rect x="36" y="24" width="148" height="76" {...ink} />
          <line x1="36" y1="50" x2="184" y2="50" stroke="currentColor" strokeWidth="1.5" />
          <line x1="36" y1="76" x2="184" y2="76" stroke="currentColor" strokeWidth="1.5" />
          <line x1="86" y1="24" x2="86" y2="100" stroke="currentColor" strokeWidth="1.5" />
          <line x1="136" y1="24" x2="136" y2="100" stroke="currentColor" strokeWidth="1.5" />
        </>
      );
    case "from-spot":
      return (
        <>
          <circle cx="110" cy="64" r="8" className="fill-sage" />
          <path d="M110 64 Q150 20 190 50" {...ink} className="text-sage" />
          <path d="M110 64 Q40 30 30 70" {...ink} className="text-sage" />
          <path d="M40 90 Q110 40 180 96" {...ink} />
          <path d="M24 70 Q110 110 196 64" {...ink} />
        </>
      );
    case "short-way":
      return (
        <>
          <circle cx="40" cy="60" r="8" className="fill-ink-soft" />
          <line x1="52" y1="60" x2="160" y2="40" {...ink} className="text-amber" />
          <polygon points="168,36 150,32 156,50" className="fill-amber" />
        </>
      );
    case "opposite-way":
      return (
        <>
          <circle cx="110" cy="60" r="8" className="fill-sage" />
          <line x1="122" y1="60" x2="176" y2="60" {...ink} className="text-sage" />
          <polygon points="186,60 170,52 170,68" className="fill-sage" />
          <line x1="98" y1="60" x2="44" y2="60" {...ink} className="text-sage" />
          <polygon points="34,60 50,52 50,68" className="fill-sage" />
        </>
      );
    case "core-a":
      return (
        <>
          <circle cx="110" cy="60" r="36" {...ink} />
          <circle cx="110" cy="60" r="16" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
          <path d="M86 36 Q110 60 86 84" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M110 28 Q140 60 110 92" stroke="currentColor" strokeWidth="2" fill="none" />
        </>
      );
    case "core-b":
      return (
        <>
          <circle cx="110" cy="60" r="36" {...ink} />
          <circle cx="110" cy="60" r="16" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="110" cy="60" r="26" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="3 3" className="text-sage" />
        </>
      );
    case "hungry":
      return (
        <>
          <rect x="78" y="36" width="64" height="48" rx="6" {...ink} />
          <line x1="24" y1="60" x2="78" y2="60" stroke="currentColor" strokeWidth="8" className="text-amber" />
        </>
      );
    case "sipping":
      return (
        <>
          <rect x="78" y="36" width="64" height="48" rx="6" {...ink} className="text-sage" />
          <line x1="24" y1="60" x2="78" y2="60" stroke="currentColor" strokeWidth="1.5" className="text-sage" />
        </>
      );
    case "stepped":
      return <polyline points="20,80 20,40 70,40 70,80 120,80 120,40 170,40 170,80 210,80" {...ink} className="text-amber" />;
    case "smooth":
      return <polyline points={wave(16, 60, 188, 28, 2)} {...ink} className="text-sage" />;
    case "lamp-dark":
      return (
        <>
          <polygon points="70,70 110,28 150,70" {...ink} className="text-amber" />
          <line x1="150" y1="36" x2="150" y2="84" {...ink} />
          <circle cx="110" cy="86" r="10" {...ink} />
        </>
      );
    case "lamp-lit":
      return (
        <>
          <polygon points="70,78 110,36 150,78" {...ink} className="text-sage" />
          <line x1="150" y1="44" x2="150" y2="92" {...ink} />
          <polygon points="168,70 154,62 154,78" className="fill-sage" />
          <circle cx="110" cy="96" r="10" className="fill-amber/40" stroke="currentColor" strokeWidth="2" />
          <line x1="110" y1="18" x2="110" y2="28" {...ink} className="text-amber" />
          <line x1="86" y1="28" x2="94" y2="36" {...ink} className="text-amber" />
          <line x1="134" y1="28" x2="126" y2="36" {...ink} className="text-amber" />
        </>
      );
    case "bare-braid":
      return (
        <>
          <line x1="20" y1="60" x2="200" y2="60" stroke="currentColor" strokeWidth="8" />
          <line x1="20" y1="60" x2="200" y2="60" stroke="currentColor" strokeWidth="2" className="text-card" />
        </>
      );
    case "bead-braid":
      return (
        <>
          <line x1="20" y1="60" x2="200" y2="60" stroke="currentColor" strokeWidth="8" />
          <line x1="20" y1="60" x2="200" y2="60" stroke="currentColor" strokeWidth="2" className="text-card" />
          <circle cx="120" cy="60" r="22" {...ink} className="text-sage" />
          <circle cx="120" cy="60" r="10" className="fill-card" stroke="currentColor" strokeWidth="2" />
        </>
      );
    default:
      return null;
  }
}

function BandMark({ band, marks }: { band: BandId; marks: readonly string[] }) {
  if (band === "low" || band === "high") {
    const high = band === "high";
    return (
      <>
        <line x1="48" y1="16" x2="48" y2="104" {...ink} />
        <rect x="48" y="64" width="90" height="40" className={high ? "fill-ink-soft/15" : "fill-sage/40"} />
        <rect x="48" y="20" width="90" height="40" className={high ? "fill-sage/40" : "fill-ink-soft/15"} />
        <text x="148" y="46" fontSize="14" fill="currentColor">
          {marks[0]}
        </text>
        <text x="148" y="90" fontSize="14" fill="currentColor">
          {marks[1]}
        </text>
      </>
    );
  }
  if (band === "long" || band === "short") {
    const long = band === "long";
    return (
      <>
        <line x1="20" y1="78" x2="200" y2="78" {...ink} />
        <rect x="24" y="40" width={long ? 168 : 48} height="38" className="fill-sage/40" />
      </>
    );
  }
  const above = band === "above";
  return (
    <>
      <line x1="16" y1="60" x2="204" y2="60" {...ink} />
      <path
        d={above ? "M50 60 Q110 16 170 60" : "M50 60 Q110 104 170 60"}
        className="fill-sage/30"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </>
  );
}

function BenchMark({ bench, marks }: { bench: BenchId; marks: readonly string[] }) {
  if (bench === "prefixes") {
    const ticks = [28, 48, 68, 108, 128, 148];
    return (
      <>
        <line x1="20" y1="78" x2="200" y2="78" {...ink} />
        {ticks.map((x) => (
          <line key={x} x1={x} y1="66" x2={x} y2="90" stroke="currentColor" strokeWidth="2" />
        ))}
        <path d="M28 50 H68" {...ink} className="text-sage" />
        <path d="M108 50 H148" {...ink} className="text-sage" />
        <polygon points="168,50 152,44 152,56" className="fill-sage" />
        <line x1="88" y1="50" x2="152" y2="50" {...ink} className="text-sage" />
      </>
    );
  }
  if (bench === "db-small" || bench === "db-large" || bench === "db-two") {
    const small = bench === "db-small" || bench === "db-two";
    return (
      <>
        <line x1="40" y1="16" x2="40" y2="104" {...ink} />
        {bench === "db-two" ? (
          <>
            <rect x="40" y="28" width="48" height="24" className="fill-sage/40" />
            <rect x="96" y="64" width="48" height="24" className="fill-sage/40" />
          </>
        ) : (
          <>
            <rect x="40" y="62" width="44" height="28" className={small ? "fill-sage/50" : "fill-ink-soft/15"} />
            <rect x="96" y="28" width="44" height="62" className={small ? "fill-ink-soft/15" : "fill-sage/50"} />
          </>
        )}
      </>
    );
  }
  const [formula, unknown] = marks;
  return (
    <>
      <text x="110" y="42" textAnchor="middle" fontSize="22" fill="currentColor">
        {formula}
      </text>
      {bench === "dipole" ? <line x1="36" y1="58" x2="184" y2="58" {...ink} /> : null}
      <rect x="70" y="68" width="80" height="36" rx="6" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" className="text-sage" />
      <text x="110" y="93" textAnchor="middle" fontSize="22" className="fill-sage">
        {unknown}
      </text>
    </>
  );
}

/** The picture that makes a choice recognizable. Absent when this question has no picture yet. */
export function QuestionPicture({ questionId }: { questionId: string }) {
  const picture = questionPicture(questionId);
  if (!picture) return null;
  const split = picture.kind === "rails" || picture.kind === "pair";
  return (
    <figure className={split ? "mt-4 grid gap-4 sm:grid-cols-2" : "mx-auto mt-4 w-full max-w-md"} data-testid="question-picture">
      {picture.kind === "rails" ? (
        <>
          <Swing amp={14} label={picture.labels[0]} clipId={`${questionId}-quiet`} />
          <Swing amp={46} label={picture.labels[1]} clipId={`${questionId}-peak`} />
        </>
      ) : null}
      {picture.kind === "symbol" ? (
        <Panel label={picture.labels[0]}>
          <SymbolMark symbol={picture.symbol} />
        </Panel>
      ) : null}
      {picture.kind === "pair" ? (
        <>
          <Panel label={picture.labels[0]}>
            <Scene scene={picture.pair[0]} />
          </Panel>
          <Panel label={picture.labels[1]}>
            <Scene scene={picture.pair[1]} />
          </Panel>
        </>
      ) : null}
      {picture.kind === "band" ? (
        <Panel label={picture.labels[0]}>
          <BandMark band={picture.band} marks={picture.marks ?? []} />
        </Panel>
      ) : null}
      {picture.kind === "bench" ? (
        <Panel label={picture.labels[0]}>
          <BenchMark bench={picture.bench} marks={picture.marks ?? []} />
        </Panel>
      ) : null}
    </figure>
  );
}
