"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { classAtLeast } from "@/lib/class-info";
import { practiceOrder } from "@/lib/exam";
import { labBySlug } from "@/lib/labs-catalog";
import { getPool, isLicenseClass } from "@/lib/pools";
import type { LicenseClass, PoolQuestion } from "@/lib/pool-types";
import { FIGURE_ASSETS } from "@/lib/pool-facts";
import { FigureView } from "../figure";
import { useBench } from "../bench-provider";

export function Workbench({ slug }: { slug: string }) {
  const search = useSearchParams();
  const bench = useBench();
  const lab = labBySlug(slug);
  const [touched, setTouched] = useState(false);
  if (!lab) return <p>That bench is not on the wall.</p>;
  if (!bench.ready) return <p>Opening the bench.</p>;
  const queryClass = search.get("class");
  const requested = queryClass && isLicenseClass(queryClass) ? queryClass : bench.settings.studyClass;
  if (!classAtLeast(requested, lab.min)) {
    return (
      <section className="max-w-2xl space-y-4">
        <h1 className="display text-5xl">{lab.title}</h1>
        <p className="text-xl">
          This bench belongs to the {lab.min} pool. Technician study stays on the earlier benches unless you open this one on purpose.
        </p>
        <button
          type="button"
          className="rounded-full bg-walnut px-4 py-2 text-paper"
          onClick={() => bench.setSettings({ ...bench.settings, studyClass: lab.min })}
        >
          I’m studying for {lab.min}. Open this bench.
        </button>
      </section>
    );
  }
  const showFormula = bench.settings.fastLane || touched || search.has("q");
  return (
    <div className="space-y-4">
      {lab.min !== "technician" ? <p className="text-sm uppercase tracking-widest text-ink-soft">{lab.min} bench</p> : null}
      <LabBody slug={lab.slug} requested={requested} showFormula={showFormula} poke={() => setTouched(true)} />
    </div>
  );
}

function LabBody({
  slug,
  requested,
  showFormula,
  poke,
}: {
  slug: string;
  requested: LicenseClass;
  showFormula: boolean;
  poke: () => void;
}) {
  if (slug === "ohms") return <OhmsLab showFormula={showFormula} poke={poke} />;
  if (slug === "prefixes") return <PrefixLab showFormula={showFormula} poke={poke} />;
  if (slug === "decibels") return <DecibelLab showFormula={showFormula} poke={poke} />;
  if (slug === "schematics") return <SchematicLab requested={requested} />;
  if (slug === "antenna") return <AntennaLab requested={requested} showFormula={showFormula} poke={poke} />;
  if (slug === "swr") return <SwrLab showFormula={showFormula} poke={poke} />;
  if (slug === "propagation") return <PropagationLab requested={requested} poke={poke} />;
  if (slug === "safety") return <SafetyLab />;
  if (slug === "reactance") return <ReactanceLab showFormula={showFormula} poke={poke} />;
  if (slug === "dividers") return <DividerLab showFormula={showFormula} poke={poke} />;
  if (slug === "power") return <PowerLab showFormula={showFormula} poke={poke} />;
  if (slug === "resonance") return <ResonanceLab showFormula={showFormula} poke={poke} />;
  if (slug === "time") return <TimeLab showFormula={showFormula} poke={poke} />;
  if (slug === "phasors") return <PhasorLab showFormula={showFormula} poke={poke} />;
  return <SmithLab />;
}

function OhmsLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const given = {
    volts: search.has("volts"),
    amps: search.has("amps"),
    ohms: search.has("ohms"),
  };
  const initialSolve = !given.ohms && given.volts && given.amps ? "ohms" : !given.amps && given.volts ? "amps" : !given.volts && given.amps ? "volts" : "ohms";
  const [solve, setSolve] = useState<"ohms" | "amps" | "volts">(initialSolve);
  const [volts, setVolts] = useState(num(search.get("volts"), 90));
  const [amps, setAmps] = useState(num(search.get("amps"), 3));
  const [ohms, setOhms] = useState(num(search.get("ohms"), 30));
  const [pair, setPair] = useState(false);
  const [r1, setR1] = useState(100);
  const [r2, setR2] = useState(100);
  const shownOhms = solve === "ohms" ? (amps === 0 ? 0 : volts / amps) : ohms;
  const shownAmps = solve === "amps" ? (ohms === 0 ? 0 : volts / ohms) : amps;
  const shownVolts = solve === "volts" ? amps * ohms : volts;
  const watts = shownVolts * shownAmps;
  const seriesCurrent = shownVolts / (r1 + r2);
  const parallel = 1 / (1 / r1 + 1 / r2);

  return (
    <section className="space-y-6">
      <h1 className="display text-5xl">Ohm’s law bench</h1>
      <p className="text-xl">Set any two. The needle shows the third, and the resistor warms with the watts.</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <Field label="Volts, E" value={solve === "volts" ? shownVolts : volts} readOnly={solve === "volts" || given.volts} testId="ohms-volts" onChange={(value) => { setVolts(value); poke(); }} />
          <Field label="Amperes, I" value={solve === "amps" ? shownAmps : amps} readOnly={solve === "amps" || given.amps} testId="ohms-amps" onChange={(value) => { setAmps(value); poke(); }} />
          <Field label="Ohms, R" value={solve === "ohms" ? shownOhms : ohms} readOnly={solve === "ohms" || given.ohms} testId="ohms-ohms" onChange={(value) => { setOhms(value); poke(); }} />
          <label className="block text-sm">
            Solve for
            <select className="ml-2 rounded-xl border border-line bg-paper px-2 py-1" value={solve} onChange={(event) => { setSolve(event.target.value as "ohms" | "amps" | "volts"); poke(); }}>
              <option value="ohms">resistance</option>
              <option value="amps">current</option>
              <option value="volts">voltage</option>
            </select>
          </label>
        </div>
        <div>
          <Needle fraction={Math.min(shownOhms / 200, 1)} />
          <p className="num text-center text-4xl" data-testid="ohms-readout">
            {round(solve === "ohms" ? shownOhms : solve === "amps" ? shownAmps : shownVolts)}
          </p>
          <p className="text-center text-ink-soft">{solve === "ohms" ? "ohms" : solve === "amps" ? "amperes" : "volts"}</p>
          <div className="mx-auto mt-4 h-4 w-32 rounded-full" style={{ background: `rgba(196, 122, 44, ${Math.min(watts / 20, 1)})` }} />
          <p className="num mt-2 text-center text-xl">{round(watts)} W</p>
        </div>
      </div>
      {showFormula ? <p>E = I × R. Power is I × E, and the same watts are I²R and E²/R.</p> : <p className="text-ink-soft">Move a value and the formula stays up. Fast lane shows it immediately.</p>}
      <div className="rounded-3xl border border-line bg-card p-4">
        <button type="button" className="rounded-full border border-line px-4 py-2" onClick={() => { setPair((value) => !value); poke(); }}>
          {pair ? "Parallel" : "Series"}
        </button>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Resistor 1" value={r1} onChange={(value) => { setR1(value); poke(); }} />
          <Field label="Resistor 2" value={r2} onChange={(value) => { setR2(value); poke(); }} />
        </div>
        {pair ? (
          <p className="mt-3">Voltage stays common at {round(shownVolts)} V. The branches draw {round(shownVolts / r1)} A and {round(shownVolts / r2)} A. Together the resistors look like {round(parallel)} ohms.</p>
        ) : (
          <p className="mt-3">Current stays common at {round(seriesCurrent)} A. The resistors share the voltage and add to {round(r1 + r2)} ohms.</p>
        )}
      </div>
    </section>
  );
}

const PREFIXES = [
  { name: "pico", exp: -12 },
  { name: "nano", exp: -9 },
  { name: "micro", exp: -6 },
  { name: "milli", exp: -3 },
  { name: "unit", exp: 0 },
  { name: "kilo", exp: 3 },
  { name: "mega", exp: 6 },
  { name: "giga", exp: 9 },
];

function PrefixLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const [value, setValue] = useState(1.5);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(-3);
  const converted = value * 10 ** (from - to);
  const marker = ((from - -12) / 21) * 100;
  return (
    <section className="space-y-5">
      <h1 className="display text-5xl">Prefix tape</h1>
      <p>Each step of three is a thousand. The miss is almost always the direction of the decimal.</p>
      <div className="relative h-16 rounded-full bg-paper-deep">
        {PREFIXES.map((prefix) => (
          <span key={prefix.name} className="absolute top-4 text-xs" style={{ left: `${((prefix.exp + 12) / 21) * 100}%` }}>
            {prefix.name}
          </span>
        ))}
        <span className="absolute top-0 h-16 w-1 bg-amber" style={{ left: `${marker}%` }} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Amount" value={value} onChange={(next) => { setValue(next); poke(); }} />
        <PrefixSelect label="From" value={from} onChange={(next) => { setFrom(next); poke(); }} />
        <PrefixSelect label="To" value={to} onChange={(next) => { setTo(next); poke(); }} />
      </div>
      <p className="num text-4xl" data-testid="prefix-readout">{round(converted)} {PREFIXES.find((prefix) => prefix.exp === to)?.name}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="rounded-full border border-line px-3 py-2" onClick={() => { setValue(1.5); setFrom(0); setTo(-3); poke(); }}>1.5 A to milliamperes</button>
        <button type="button" className="rounded-full border border-line px-3 py-2" onClick={() => { setValue(2425); setFrom(6); setTo(9); poke(); }}>2425 MHz to gigahertz</button>
      </div>
      {showFormula ? <p>Move right on the tape and the number gets smaller. 1.5 amperes is 1500 milliamperes. 2425 MHz is 2.425 GHz.</p> : null}
    </section>
  );
}

function DecibelLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const [watts, setWatts] = useState(num(search.get("dbFrom"), 5));
  const [steps, setSteps] = useState<number[]>(search.has("dbTo") ? [dbChange(num(search.get("dbFrom"), 5), num(search.get("dbTo"), 10))] : []);
  const rows = steps.reduce<Array<{ db: number; power: number }>>((list, db) => {
    const previous = list.at(-1)?.power ?? watts;
    return [...list, { db, power: previous * 10 ** (db / 10) }];
  }, []);
  const power = rows.at(-1)?.power ?? watts;
  return (
    <section className="space-y-5">
      <h1 className="display text-5xl">Decibel ladder</h1>
      <p>Stack the transmitter, the line loss, and the antenna gain. Three decibels doubles power. Ten multiplies by ten.</p>
      <Field label="Start, watts" value={watts} onChange={(value) => { setWatts(value); poke(); }} />
      <div className="flex flex-wrap gap-2">
        {[3, -3, 10, -10].map((db) => (
          <button key={db} type="button" className="rounded-full border border-line px-4 py-2" onClick={() => { setSteps((current) => [...current, db]); poke(); }}>
            {db > 0 ? `+${db}` : db} dB
          </button>
        ))}
        <button type="button" className="rounded-full border border-line px-4 py-2" onClick={() => setSteps([])}>Clear</button>
      </div>
      <ol className="space-y-2">
        {rows.map((row, index) => (
          <li key={`${row.db}-${index}`} className="rounded-2xl bg-card px-4 py-3">
            {row.db} dB → <span className="num">{round(row.power)} W</span>
          </li>
        ))}
      </ol>
      <p className="num text-4xl">{round(power)} W</p>
      {showFormula ? <p>dB = 10 log10(P2 / P1). A doubling is about +3 dB. A tenfold change is 10 dB.</p> : null}
    </section>
  );
}

const HOTSPOTS: Record<string, Array<{ n: number; x: number; y: number }>> = {
  "T-1": [
    { n: 1, x: 42, y: 50 },
    { n: 2, x: 52, y: 51 },
    { n: 3, x: 63, y: 33 },
    { n: 4, x: 68, y: 50 },
    { n: 5, x: 30, y: 68 },
  ],
  "T-2": [
    { n: 3, x: 32, y: 38 },
    { n: 4, x: 40, y: 52 },
    { n: 6, x: 57, y: 56 },
    { n: 8, x: 64, y: 58 },
    { n: 9, x: 75, y: 42 },
  ],
  "T-3": [
    { n: 3, x: 50, y: 55 },
    { n: 4, x: 65, y: 18 },
  ],
  "G7-1": [
    { n: 1, x: 46, y: 52 },
    { n: 2, x: 74, y: 52 },
    { n: 5, x: 52, y: 30 },
    { n: 6, x: 75, y: 38 },
    { n: 7, x: 17, y: 72 },
  ],
};

function SchematicLab({ requested }: { requested: LicenseClass }) {
  const figures = requested === "technician" ? ["T-1", "T-2", "T-3"] : ["T-1", "T-2", "T-3", "G7-1"];
  const [figure, setFigure] = useState(figures[0]!);
  const pool = requested === "technician" ? getPool("technician") : getPool("general");
  const questions = pool.questions.filter((question) => question.figure === figure);
  const [index, setIndex] = useState(0);
  const [mark, setMark] = useState<number | null>(null);
  const question = questions[index];
  const match = question?.text.match(/component (\d+)|symbol (\d+)/i);
  const mentioned = Number(match?.[1] ?? match?.[2]);
  return (
    <section className="space-y-5">
      <h1 className="display text-5xl">Schematic dojo</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Symbol name="Resistor" path="M2 10 h4 l2 -6 l4 12 l4 -12 l4 12 l2 -6 h4" />
        <Symbol name="Capacitor" path="M4 3 v14 M12 3 v14 M2 10 h2 M14 10 h4" />
        <Symbol name="Inductor" path="M2 12 q4 -10 8 0 q4 -10 8 0 q4 -10 8 0" />
        <Symbol name="Diode" path="M3 4 l10 6 l-10 6 z M13 4 v12" />
      </div>
      <div className="flex flex-wrap gap-2">
        {figures.map((id) => (
          <button key={id} type="button" className={`rounded-full px-4 py-2 ${id === figure ? "bg-walnut text-paper" : "border border-line"}`} onClick={() => { setFigure(id); setIndex(0); setMark(null); }}>
            Figure {id}
          </button>
        ))}
      </div>
      <div className="relative">
        <FigureView id={figure} hidden={false} />
        {(HOTSPOTS[figure] ?? []).map((spot) => (
          <button
            key={spot.n}
            type="button"
            data-testid={`schematic-part-${spot.n}`}
            className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm ${spot.n === mentioned ? "border-amber bg-amber text-walnut-deep" : "border-walnut bg-card/80"}`}
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            onClick={() => {
              const next = questions.findIndex((item) => new RegExp(`(?:component|symbol)\\s+${spot.n}\\b`, "i").test(item.text));
              if (next >= 0) {
                setIndex(next);
                setMark(null);
              }
            }}
          >
            {spot.n}
          </button>
        ))}
      </div>
      {question ? <DojoQuestion question={question} mark={mark} onMark={setMark} onNext={() => { setIndex((current) => (current + 1) % questions.length); setMark(null); }} /> : null}
      {classAtLeast(requested, "extra") ? <OpAmp /> : null}
    </section>
  );
}

function DojoQuestion({ question, mark, onMark, onNext }: { question: PoolQuestion; mark: number | null; onMark: (index: number) => void; onNext: () => void }) {
  const order = useMemo(() => practiceOrder([...question.answers], question.id), [question]);
  return (
    <div className="space-y-3">
      <h2 className="text-2xl">{question.text}</h2>
      {order.map((answerIndex) => (
        <button key={answerIndex} type="button" className="block w-full rounded-2xl border border-line bg-card px-4 py-3 text-left" onClick={() => onMark(answerIndex)}>
          {question.answers[answerIndex]}
        </button>
      ))}
      {mark != null ? (
        <div>
          <p>The matching choice is “{question.answers[question.correctIndex]}.”</p>
          {mark !== question.correctIndex ? <p>{question.distractors[mark]}</p> : null}
          <button type="button" className="mt-2 rounded-full border border-line px-4 py-2" onClick={onNext}>Next part</button>
        </div>
      ) : null}
    </div>
  );
}

function OpAmp() {
  const search = useSearchParams();
  const [r1, setR1] = useState(num(search.get("r1"), 10));
  const [rf, setRf] = useState(num(search.get("r2"), 470));
  const [vin, setVin] = useState(num(search.get("volts"), 0));
  const gain = -rf / r1;
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <h2 className="display text-3xl">Figure E7-3</h2>
      <FigureView id="E7-3" hidden={false} />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="R1, ohms" value={r1} onChange={setR1} />
        <Field label="RF, ohms" value={rf} onChange={setRf} />
        <Field label="Input volts" value={vin} onChange={setVin} />
      </div>
      <p className="num mt-3 text-3xl">Gain {round(gain)}{vin ? `, output ${round(gain * vin)} V` : ""}</p>
      <p>The magnitude is RF / R1. The inverting drawing makes the sign negative.</p>
    </div>
  );
}

function AntennaLab({ requested, showFormula, poke }: { requested: LicenseClass; showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const { settings, setFrequency } = useBench();
  const [mhz, setMhz] = useState(num(search.get("mhz"), settings.frequencyMhz));
  const [dipole, setDipole] = useState(requested !== "technician");
  const wavelength = 300 / mhz;
  function update(value: number) {
    setMhz(value);
    setFrequency(value);
    poke();
  }
  return (
    <section className="space-y-5">
      <h1 className="display text-5xl">Antenna shop</h1>
      <Field label="Frequency, MHz" value={mhz} testId="antenna-mhz" onChange={update} />
      <p className="num text-5xl" data-testid="antenna-wavelength">{round(wavelength)} m</p>
      <p>That is one wavelength. Higher frequency, shorter wave. A half-wave dipole radiates strongest broadside to the wire.</p>
      {!dipole ? (
        <p>A 19-inch vertical is used on 2 meters because it is a shortened quarter wave. This bench does not ask a Technician to compute antenna length in inches. Shortening a dipole raises its resonant frequency.</p>
      ) : (
        <p className="num text-2xl">
          Practical half wave ≈ {round(468 / mhz)} feet. Free-space half wave ≈ {round(492 / mhz)} feet. The gap is end effect.
        </p>
      )}
      <button type="button" className="rounded-full border border-line px-4 py-2" onClick={() => setDipole((value) => !value)}>
        {dipole ? "Back to the Technician picture" : "Show the General dipole in feet"}
      </button>
      {showFormula ? <p>Wavelength in meters ≈ 300 / f(MHz). The General length in feet is about 468 / f(MHz).</p> : null}
    </section>
  );
}

function SwrLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const [line, setLine] = useState(num(search.get("swrLine"), 50));
  const [load, setLoad] = useState(num(search.get("swrLoad"), 50));
  const ratio = Math.max(line, load) / Math.min(line, load);
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Match and SWR</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Feed line, ohms" value={line} onChange={(value) => { setLine(value); poke(); }} />
        <Field label="Resistive load, ohms" value={load} onChange={(value) => { setLoad(value); poke(); }} />
      </div>
      <Needle fraction={Math.min((ratio - 1) / 9, 1)} />
      <p className="num text-5xl">{round(ratio)} : 1</p>
      <p>{ratio < 1.5 ? "That is close to a match." : "That is a large mismatch. A solid-state radio folds power back as this reading rises."}</p>
      {showFormula ? <p>For two resistances, SWR is the larger divided by the smaller.</p> : null}
    </section>
  );
}

function PropagationLab({ requested, poke }: { requested: LicenseClass; poke: () => void }) {
  const { settings, setFrequency } = useBench();
  const [hour, setHour] = useState(14);
  const [mhz, setMhz] = useState(settings.frequencyMhz);
  const [angle, setAngle] = useState(30);
  const day = hour > 7 && hour < 19;
  const hf = mhz < 30;
  const d = day && hf ? 0.85 : 0.15;
  const muf = day ? 21 : 10;
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Propagation theater</h1>
      <svg viewBox="0 0 640 280" className="w-full rounded-3xl bg-[#1e2a3a]">
        <ellipse cx="320" cy="300" rx="280" ry="80" fill="#3f6b4e" />
        <path d="M40 180 Q320 40 600 180" fill="#24344a" opacity={0.9} />
        <path d="M80 150 Q320 70 560 150" fill="#6d533c" opacity={d} />
        <path d={`M120 210 Q ${220 + angle} ${40 + (hf ? 0 : 80)} 520 210`} fill="none" stroke="#e7c27a" strokeWidth="3" />
      </svg>
      <label className="block">Hour {hour}<input type="range" min={0} max={24} value={hour} onChange={(event) => { setHour(Number(event.target.value)); poke(); }} className="w-full" /></label>
      <label className="block">Frequency {mhz} MHz<input type="range" min={3} max={148} value={mhz} onChange={(event) => { const value = Number(event.target.value); setMhz(value); setFrequency(value); poke(); }} className="w-full" /></label>
      <label className="block">Takeoff angle {angle}°<input type="range" min={5} max={80} value={angle} onChange={(event) => setAngle(Number(event.target.value))} className="w-full" /></label>
      <p>{hf ? "HF can skip off the ionosphere. The D layer absorbs it in the daytime and fades after sunset." : "VHF and UHF are mostly line of sight. The layers above are not the path."}</p>
      <p>{angle > 50 ? "A high angle is the NVIS picture: regional coverage on the lower HF bands." : "A low angle is the DX picture: the wave leaves toward the horizon."}</p>
      {classAtLeast(requested, "general") ? <p>Sketch, not a forecast: this scene’s daytime MUF is near {muf} MHz and the LUF rises while the D layer is absorbing. More sunspots generally lift the MUF.</p> : null}
    </section>
  );
}

const SCENES = [
  { title: "After the supply is unplugged", body: "The filter capacitor can still be charged. Discharge it before you touch the circuit. A fuse protects the wiring, not you." },
  { title: "A battery on a hard charge", body: "Rapid charge or discharge of an unprotected battery can overheat it or vent gas. Stop and let it cool if it is hot." },
  { title: "The tower", body: "Never climb alone. Ground wires should be short and direct, without sharp bends." },
  { title: "The power line", body: "Stay far enough that a falling antenna cannot come within 10 feet of the line." },
  { title: "The exposure question", body: "Radio energy at these frequencies is non-ionizing. It can burn. Exposure depends on power, frequency, distance, pattern, and duty cycle, and the station licensee is responsible for the evaluation." },
];

function SafetyLab() {
  const [open, setOpen] = useState(0);
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Safety scenes</h1>
      <div className="grid gap-3">
        {SCENES.map((scene, index) => (
          <button key={scene.title} type="button" className="rounded-2xl border border-line bg-card px-4 py-4 text-left" onClick={() => setOpen(index)}>
            <span className="text-xl">{scene.title}</span>
            {open === index ? <span className="mt-2 block text-ink-soft">{scene.body}</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function ReactanceLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const { settings, setFrequency } = useBench();
  const [mhz, setMhz] = useState(settings.frequencyMhz);
  const [microhenry, setMicrohenry] = useState(10);
  const [picofarad, setPicofarad] = useState(100);
  const f = mhz * 1e6;
  const xl = 2 * Math.PI * f * microhenry * 1e-6;
  const xc = 1 / (2 * Math.PI * f * picofarad * 1e-12);
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Reactance bench</h1>
      <Field label="Frequency, MHz" value={mhz} onChange={(value) => { setMhz(value); setFrequency(value); poke(); }} />
      <Field label="Inductance, µH" value={microhenry} onChange={(value) => { setMicrohenry(value); poke(); }} />
      <Field label="Capacitance, pF" value={picofarad} onChange={(value) => { setPicofarad(value); poke(); }} />
      <p className="num text-3xl">XL {round(xl)} Ω · XC {round(xc)} Ω</p>
      <p>Raise the frequency and the coil’s opposition grows. The capacitor’s opposition falls.</p>
      {showFormula ? <p>XL = 2πfL. XC = 1 / (2πfC).</p> : null}
    </section>
  );
}

function DividerLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const [r1, setR1] = useState(num(search.get("r1"), 100));
  const [r2, setR2] = useState(num(search.get("r2"), 200));
  const [r3, setR3] = useState(num(search.get("r3"), 300));
  const [vin, setVin] = useState(12);
  const parallel = 1 / (1 / r1 + 1 / r2 + 1 / r3);
  const vout = vin * (r2 / (r1 + r2));
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Dividers and parallels</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="R1" value={r1} onChange={(value) => { setR1(value); poke(); }} />
        <Field label="R2" value={r2} onChange={(value) => { setR2(value); poke(); }} />
        <Field label="R3" value={r3} onChange={(value) => { setR3(value); poke(); }} />
      </div>
      <p className="num text-3xl">Three in parallel ≈ {round(parallel)} Ω, less than the smallest.</p>
      <Field label="Divider input, volts" value={vin} onChange={setVin} />
      <p>Series divider across R2: {round(vout)} V. The same current runs through both resistors. Capacitors in series combine the way resistors do in parallel.</p>
      {showFormula ? <p>1/R = 1/R1 + 1/R2 + 1/R3. Vout = Vin × R2 / (R1 + R2).</p> : null}
    </section>
  );
}

function PowerLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const [vpp, setVpp] = useState(num(search.get("peakToPeak"), 100));
  const [ohms, setOhms] = useState(num(search.get("ohms"), 50));
  const [gain, setGain] = useState(6);
  const [loss, setLoss] = useState(2);
  const peak = vpp / 2;
  const rms = peak / Math.SQRT2;
  const pep = (rms * rms) / ohms;
  const dbm = 40 + gain - loss;
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">PEP, RMS, and the link</h1>
      <Field label="Peak-to-peak volts" value={vpp} onChange={(value) => { setVpp(value); poke(); }} />
      <Field label="Load, ohms" value={ohms} onChange={(value) => { setOhms(value); poke(); }} />
      <p className="num text-3xl">RMS {round(rms)} V · PEP {round(pep)} W</p>
      <p>10 W is +40 dBm. Add {gain} dB of gain and subtract {loss} dB of loss and the link is {round(dbm)} dBm.</p>
      <Field label="Antenna gain, dB" value={gain} onChange={setGain} />
      <Field label="Line loss, dB" value={loss} onChange={setLoss} />
      {showFormula ? <p>RMS = (Vpp / 2) / √2. PEP = Vrms² / R. The errata link questions use 10 W, which is 40 dBm.</p> : null}
    </section>
  );
}

function ResonanceLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const [microhenry, setMicrohenry] = useState(10);
  const [picofarad, setPicofarad] = useState(100);
  const [q, setQ] = useState(10);
  const f = 1 / (2 * Math.PI * Math.sqrt(microhenry * 1e-6 * picofarad * 1e-12));
  const mhz = f / 1e6;
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Resonance</h1>
      <Field label="L, µH" value={microhenry} onChange={(value) => { setMicrohenry(value); poke(); }} />
      <Field label="C, pF" value={picofarad} onChange={(value) => { setPicofarad(value); poke(); }} />
      <Field label="Q" value={q} onChange={setQ} />
      <p className="num text-4xl">{round(mhz)} MHz</p>
      <p>At that frequency XL cancels XC and the series circuit looks like the resistance. Half-power bandwidth is {round((mhz / q) * 1000)} kHz. A higher Q is a sharper peak.</p>
      {showFormula ? <p>f = 1 / (2π√LC). Bandwidth = f / Q.</p> : null}
    </section>
  );
}

function TimeLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const [ohms, setOhms] = useState(10000);
  const [microfarad, setMicrofarad] = useState(10);
  const tau = ohms * microfarad * 1e-6;
  const points = Array.from({ length: 21 }, (_, index) => {
    const t = (index / 20) * tau * 5;
    return { t, v: 1 - Math.exp(-t / tau) };
  });
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Time constant</h1>
      <Field label="R, ohms" value={ohms} onChange={(value) => { setOhms(value); poke(); }} />
      <Field label="C, µF" value={microfarad} onChange={(value) => { setMicrofarad(value); poke(); }} />
      <svg viewBox="0 0 200 80" className="w-full rounded-2xl bg-card">
        <polyline fill="none" stroke="#c47a2c" strokeWidth="2" points={points.map((point, index) => `${index * 10},${80 - point.v * 70}`).join(" ")} />
        <line x1="40" y1="0" x2="40" y2="80" stroke="#3a2a22" strokeDasharray="2 2" />
      </svg>
      <p className="num text-3xl">τ = {round(tau)} s · about 63% charged</p>
      {showFormula ? <p>τ = RC. One time constant reaches about 63 percent of the applied voltage.</p> : null}
    </section>
  );
}

function PhasorLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const [ohms, setOhms] = useState(300);
  const [reactance, setReactance] = useState(-40);
  const magnitude = Math.hypot(ohms, reactance);
  const angle = (Math.atan2(reactance, ohms) * 180) / Math.PI;
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Phasors</h1>
      <FigureView id="E5-1" hidden={false} />
      <Field label="Resistance, ohms" value={ohms} onChange={(value) => { setOhms(value); poke(); }} />
      <Field label="Reactance, ohms" value={reactance} onChange={(value) => { setReactance(value); poke(); }} />
      <p className="num text-3xl">{round(magnitude)} Ω at {round(angle)}°</p>
      <p>Resistance runs one way on figure E5-1 and reactance the other. A series capacitor sits below the resistance axis.</p>
      {showFormula ? <p>Magnitude is √(R² + X²). The angle is arctan(X / R).</p> : null}
    </section>
  );
}

function SmithLab() {
  const [r, setR] = useState(1);
  const gamma = (r - 1) / (r + 1);
  const x = ((92 + gamma * 80) / 199) * 100;
  const y = (118 / 218) * 100;
  return (
    <section className="space-y-4">
      <h1 className="display text-5xl">Smith chart</h1>
      <div className="relative">
        <FigureView id="E9-3" hidden={false} />
        <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber" style={{ left: `${x}%`, top: `${y}%` }} />
      </div>
      <label className="block">
        Normalized resistance {r}
        <input type="range" min={0} max={20} step={0.1} value={r} onChange={(event) => setR(Number(event.target.value))} className="w-full" />
      </label>
      <p>Infinity is on the right. Zero is on the left. The only straight line is the resistance axis, and the large outer circle is the reactance axis.</p>
      <p className="text-sm text-ink-soft">The marker rides the resistance axis of the official figure {FIGURE_ASSETS["E9-3"]}.</p>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  readOnly,
  testId,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  testId?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="block text-lg">
      {label}
      <input
        data-testid={testId}
        className="num mt-1 w-full rounded-2xl border border-line bg-card px-3 py-2"
        inputMode="decimal"
        readOnly={readOnly}
        value={readOnly ? (Number.isFinite(value) ? round(value) : "") : (draft ?? formatInput(value))}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          const parsed = Number(next);
          if (next.trim() !== "" && Number.isFinite(parsed)) onChange(parsed);
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

function PrefixSelect({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      {label}
      <select className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-2" value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {PREFIXES.map((prefix) => (
          <option key={prefix.name} value={prefix.exp}>
            {prefix.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Symbol({ name, path }: { name: string; path: string }) {
  return (
    <figure className="rounded-2xl border border-line bg-card p-3 text-center">
      <svg viewBox="0 0 24 20" className="mx-auto h-12 w-full">
        <path d={path} fill="none" stroke="#2a211c" strokeWidth="1.4" />
      </svg>
      <figcaption>{name}</figcaption>
    </figure>
  );
}

function Needle({ fraction }: { fraction: number }) {
  const angle = -70 + Math.min(1, Math.max(0, fraction)) * 140;
  return (
    <svg viewBox="0 0 200 120" className="mx-auto w-48 text-walnut">
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="100" y1="100" x2="100" y2="38" stroke="#c47a2c" strokeWidth="3" style={{ transformOrigin: "100px 100px", transform: `rotate(${angle}deg)` }} />
      <circle cx="100" cy="100" r="5" fill="#2a211c" />
    </svg>
  );
}

function num(raw: string | null, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function formatInput(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.round(value * 1e6) / 1e6);
}

function round(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 100) return String(Math.round(value));
  if (abs >= 10) return String(Math.round(value * 10) / 10);
  return String(Math.round(value * 100) / 100);
}

function dbChange(from: number, to: number): number {
  if (from <= 0 || to <= 0) return 0;
  return Math.round((10 * Math.log10(to / from)) * 10) / 10;
}
