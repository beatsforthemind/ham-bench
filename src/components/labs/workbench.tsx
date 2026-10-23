"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { classAtLeast } from "@/lib/class-info";
import { practiceOrder } from "@/lib/exam";
import { labBySlug } from "@/lib/labs-catalog";
import { getPool, isLicenseClass, pools } from "@/lib/pools";
import { presetFromQuestion } from "@/lib/presets";
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
        <h1 className="display text-4xl sm:text-5xl">{lab.title}</h1>
        <p className="text-xl">
          This bench belongs to the {lab.min} pool. Technician study stays on the earlier benches unless you open this one on purpose.
        </p>
        <button
          type="button"
          className="rounded-full bg-walnut px-4 py-2 text-paper"
          onClick={() => bench.setSettings({ studyClass: lab.min })}
        >
          I’m studying for {lab.min}. Open this bench.
        </button>
      </section>
    );
  }
  const showFormula = touched || search.has("q");
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
  if (slug === "power") return <PowerLab requested={requested} showFormula={showFormula} poke={poke} />;
  if (slug === "resonance") return <ResonanceLab showFormula={showFormula} poke={poke} />;
  if (slug === "time") return <TimeLab showFormula={showFormula} poke={poke} />;
  if (slug === "phasors") return <PhasorLab showFormula={showFormula} poke={poke} />;
  if (slug === "smith") return <SmithLab />;
  if (slug === "bandwidth") return <BandwidthLab showFormula={showFormula} poke={poke} />;
  return <p>That bench is not on the wall.</p>;
}

function OhmsLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const given = {
    volts: search.has("volts"),
    amps: search.has("amps"),
    ohms: search.has("ohms"),
    watts: search.has("watts"),
  };
  const wattsGiven = num(search.get("watts"), NaN);
  const voltsGiven = num(search.get("volts"), 90);
  const fromPower = given.watts && given.volts && !given.amps && voltsGiven !== 0 && Number.isFinite(wattsGiven);
  const initialSolve = fromPower ? "amps" : !given.ohms && given.volts && given.amps ? "ohms" : !given.amps && given.volts && given.ohms ? "amps" : !given.volts && given.amps && given.ohms ? "volts" : "ohms";
  const [solve, setSolve] = useState<"ohms" | "amps" | "volts">(initialSolve);
  const [volts, setVolts] = useState(voltsGiven);
  const [amps, setAmps] = useState(fromPower ? wattsGiven / voltsGiven : num(search.get("amps"), 3));
  const [ohms, setOhms] = useState(fromPower ? (voltsGiven * voltsGiven) / wattsGiven : num(search.get("ohms"), 30));
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
      <h1 className="display text-4xl sm:text-5xl">Ohm’s law bench</h1>
      <p className="text-xl">Set any two. The needle shows the third, and the resistor warms with the watts.</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-4">
          <Field label="Volts, E" value={solve === "volts" ? shownVolts : volts} readOnly={solve === "volts"} testId="ohms-volts" onChange={(value) => { setVolts(value); poke(); }} />
          <Field label="Amperes, I" value={solve === "amps" ? shownAmps : amps} readOnly={solve === "amps"} testId="ohms-amps" onChange={(value) => { setAmps(value); poke(); }} />
          <Field label="Ohms, R" value={solve === "ohms" ? shownOhms : ohms} readOnly={solve === "ohms"} testId="ohms-ohms" onChange={(value) => { setOhms(value); poke(); }} />
          <label className="block text-base">
            Solve for
            <select className="mt-1 min-h-11 w-full rounded-xl border border-line bg-paper px-3 text-base" value={solve} onChange={(event) => { setSolve(event.target.value as "ohms" | "amps" | "volts"); poke(); }}>
              <option value="ohms">resistance</option>
              <option value="amps">current</option>
              <option value="volts">voltage</option>
            </select>
          </label>
        </div>
        <div>
          <Needle fraction={Math.min(shownOhms / 200, 1)} />
          <output className="num block text-center text-4xl" data-testid="ohms-readout">
            {round(solve === "ohms" ? shownOhms : solve === "amps" ? shownAmps : shownVolts)}
          </output>
          <p className="text-center text-ink-soft">{solve === "ohms" ? "ohms" : solve === "amps" ? "amperes" : "volts"}</p>
          <div className="mx-auto mt-4 h-4 w-32 rounded-full" style={{ background: `rgba(196, 122, 44, ${Math.min(watts / 20, 1)})` }} />
          <p className="num mt-2 text-center text-xl">{round(watts)} W</p>
        </div>
      </div>
      {showFormula ? <p>E = I × R. Power is I × E, and the same watts are I²R and E²/R.</p> : <p className="text-ink-soft">Move a value and the formula appears.</p>}
      {search.get("leads") === "1" ? (
        <div className="rounded-3xl border border-line bg-card p-4">
          <h2 className="display text-3xl">Meter leads</h2>
          <p className="mt-2">Voltage is measured across the resistor. Current is measured in series with it. Resistance is measured with the supply off.</p>
          <p className="num mt-3 text-xl">
            Across {round(shownVolts)} V. Through {round(shownAmps)} A. Supply off, the resistor still reads {round(shownOhms)} ohms.
          </p>
          {search.get("q") === "T7D10" ? <p className="mt-2">A discharged capacitor reads low, then climbs as it charges.</p> : null}
        </div>
      ) : null}
      <div className="rounded-3xl border border-line bg-card p-4">
        <button type="button" aria-pressed={pair} className="min-h-11 rounded-full border border-line px-4" onClick={() => { setPair((value) => !value); poke(); }}>
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

function questionByQuery(id: string | null): PoolQuestion | undefined {
  if (!id) return undefined;
  for (const pool of Object.values(pools)) {
    const found = pool.questions.find((question) => question.id === id);
    if (found) return found;
  }
  return undefined;
}

function PrefixLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const asked = questionByQuery(search.get("q"));
  const preset = asked ? presetFromQuestion(asked) : {};
  const [value, setValue] = useState(preset.mhz ?? 1.5);
  const [from, setFrom] = useState(preset.mhz ? 6 : 0);
  const [to, setTo] = useState(preset.mhz ? 3 : -3);
  const converted = value * 10 ** (from - to);
  const marker = ((from - -12) / 21) * 100;
  return (
    <section className="space-y-5">
      <h1 className="display text-4xl sm:text-5xl">Prefix tape</h1>
      <p>Each step of three is a thousand. The miss is almost always the direction of the decimal.</p>
      <div className="relative h-16 rounded-full bg-paper-deep">
        {PREFIXES.map((prefix) => (
          <span key={prefix.name} className="absolute top-4 -translate-x-1/2 text-xs" style={{ left: `${8 + ((prefix.exp + 12) / 21) * 84}%` }}>
            {prefix.name}
          </span>
        ))}
        <span className="absolute top-0 h-16 w-1 bg-amber-deep" style={{ left: `${8 + (marker / 100) * 84}%` }} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Amount" value={value} onChange={(next) => { setValue(next); poke(); }} />
        <PrefixSelect label="From" value={from} onChange={(next) => { setFrom(next); poke(); }} />
        <PrefixSelect label="To" value={to} onChange={(next) => { setTo(next); poke(); }} />
      </div>
      <output className="num block text-4xl" data-testid="prefix-readout">{round(converted)} {PREFIXES.find((prefix) => prefix.exp === to)?.name}</output>
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
      <h1 className="display text-4xl sm:text-5xl">Decibel ladder</h1>
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
  const search = useSearchParams();
  const asked = questionByQuery(search.get("q"));
  const extraFigures = ["E6-1", "E6-2", "E6-3", "E7-1", "E7-2"];
  const figures = requested === "technician" ? ["T-1", "T-2", "T-3"] : ["T-1", "T-2", "T-3", "G7-1"];
  if (classAtLeast(requested, "extra") || (asked?.figure != null && extraFigures.includes(asked.figure))) {
    for (const id of extraFigures) {
      if (!figures.includes(id)) figures.push(id);
    }
  }
  const initialFigure = asked?.figure && figures.includes(asked.figure) ? asked.figure : figures[0]!;
  const [figure, setFigure] = useState(initialFigure);
  const pool = figure.startsWith("E") ? getPool("extra") : figure.startsWith("G") ? getPool("general") : getPool("technician");
  const questions = pool.questions.filter((question) => question.figure === figure);
  const [index, setIndex] = useState(() => {
    const start = questions.findIndex((item) => item.id === asked?.id);
    return start >= 0 ? start : 0;
  });
  const [mark, setMark] = useState<number | null>(null);
  const question = questions[index];
  const match = question?.text.match(/component (\d+)|symbol (\d+)/i);
  const mentioned = Number(match?.[1] ?? match?.[2]);
  return (
    <section className="space-y-5">
      <h1 className="display text-4xl sm:text-5xl">Schematic dojo</h1>
      <div className="grid grid-cols-4 gap-2">
        <Symbol name="Resistor" path="M2 10 h4 l2 -6 l4 12 l4 -12 l4 12 l2 -6 h4" />
        <Symbol name="Capacitor" path="M4 3 v14 M12 3 v14 M2 10 h2 M14 10 h4" />
        <Symbol name="Inductor" path="M2 12 q4 -10 8 0 q4 -10 8 0 q4 -10 8 0" />
        <Symbol name="Diode" path="M3 4 l10 6 l-10 6 z M13 4 v12" />
      </div>
      <div className="flex flex-wrap gap-2">
        {figures.map((id) => (
          <button key={id} type="button" aria-pressed={id === figure} className={`min-h-11 rounded-full px-4 ${id === figure ? "bg-walnut text-paper" : "border border-line"}`} onClick={() => { setFigure(id); setIndex(0); setMark(null); }}>
            Figure {id}
          </button>
        ))}
      </div>
      <div className="max-h-[17vh] overflow-auto overscroll-contain rounded-2xl border border-line [touch-action:pan-x_pan-y]">
        <div className="relative min-w-[880px]">
        <FigureView id={figure} hidden={false} enlarge={false} />
        {(HOTSPOTS[figure] ?? []).map((spot) => (
          <button
            key={spot.n}
            type="button"
            aria-label={`Component ${spot.n} on figure ${figure}`}
            data-testid={`schematic-part-${spot.n}`}
            className={`absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm ${spot.n === mentioned ? "border-amber-deep bg-amber-deep text-paper" : "border-walnut bg-card/80"}`}
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
        <button key={answerIndex} type="button" aria-pressed={mark === answerIndex} className="flex min-h-11 w-full items-start rounded-2xl border border-line bg-card px-4 py-3 text-left" onClick={() => onMark(answerIndex)}>
          <span>
            {question.answers[answerIndex]}
            {mark != null && answerIndex === question.correctIndex ? <span className="sr-only"> Correct answer.</span> : null}
            {mark === answerIndex ? <span className="sr-only"> Your choice.</span> : null}
          </span>
        </button>
      ))}
      {mark != null ? (
        <div role="status">
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
  const magnitude = r1 === 0 ? 0 : rf / r1;
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <h2 className="display text-3xl">Figure E7-3</h2>
      <FigureView id="E7-3" hidden={false} />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <Field label="R1, ohms" value={r1} onChange={setR1} />
        <Field label="RF, ohms" value={rf} onChange={setRf} />
        <Field label="Input volts" value={vin} onChange={setVin} />
      </div>
      <output className="num mt-3 block text-3xl">Gain {round(magnitude)}{vin ? `, output ${round(-magnitude * vin)} V` : ""}</output>
      <p>The big number is the gain magnitude, RF / R1. The minus sign belongs to the output voltage.</p>
    </div>
  );
}

function AntennaLab({ requested, showFormula, poke }: { requested: LicenseClass; showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const { settings, setFrequency } = useBench();
  const queryMhz = num(search.get("mhz"), NaN);
  const [mhz, setMhz] = useState(queryMhz > 0 ? queryMhz : settings.frequencyMhz);
  const [dipole, setDipole] = useState(requested !== "technician");
  const asked = questionByQuery(search.get("q"));
  const pattern = asked?.figure === "E9-1" || asked?.figure === "E9-2" ? asked.figure : null;
  const wavelength = mhz > 0 ? 300 / mhz : 0;
  useEffect(() => {
    if (queryMhz > 0) setFrequency(queryMhz);
  }, [queryMhz, setFrequency]);
  function update(value: number) {
    setMhz(value);
    if (value > 0) setFrequency(value);
    poke();
  }
  return (
    <section className="space-y-5">
      <h1 className="display text-4xl sm:text-5xl">Antenna shop</h1>
      {pattern ? (
        <div className="space-y-2">
          <FigureView id={pattern} hidden={false} />
          <p>This pattern question uses the official figure. The wavelength shop is still here for the length questions.</p>
        </div>
      ) : null}
      {search.get("yagi") === "1" ? <YagiPicture /> : null}
      {search.get("array") === "1" ? <ArrayPicture poke={poke} /> : null}
      <Field label="Frequency, MHz" value={mhz} testId="antenna-mhz" onChange={update} />
      <output className="num block text-4xl sm:text-5xl" data-testid="antenna-wavelength">{round(wavelength)} m</output>
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
      {showFormula ? (
        dipole ? <p>Half-wave dipole in feet ≈ 468 / f. A quarter-wave vertical is about half of that.</p> : <p>Wavelength in meters ≈ 300 / f. A quarter wave is about a quarter of that length.</p>
      ) : (
        <p className="text-ink-soft">Move a value and the formula appears.</p>
      )}
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
      <h1 className="display text-4xl sm:text-5xl">Match and SWR</h1>
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
  const search = useSearchParams();
  const { settings, setFrequency } = useBench();
  const queryMhz = num(search.get("mhz"), NaN);
  const startMhz = Math.min(148, Math.max(3, queryMhz > 0 ? queryMhz : settings.frequencyMhz > 0 ? settings.frequencyMhz : 14));
  const [hour, setHour] = useState(14);
  const [mhz, setMhz] = useState(startMhz);
  const [angle, setAngle] = useState(30);
  const day = hour > 7 && hour < 19;
  const hf = mhz < 30;
  const d = day && hf ? 0.85 : 0.15;
  const muf = day ? 21 : 10;
  return (
    <section className="space-y-4">
      <h1 className="display text-4xl sm:text-5xl">Propagation theater</h1>
      <svg viewBox="0 0 640 280" className="w-full rounded-3xl bg-[#1e2a3a]">
        <ellipse cx="320" cy="300" rx="280" ry="80" fill="#3f6b4e" />
        <path d="M40 180 Q320 40 600 180" fill="#24344a" opacity={0.9} />
        <path d="M80 150 Q320 70 560 150" fill="#6d533c" opacity={d} />
        <path d={`M120 210 Q ${220 + angle} ${40 + (hf ? 0 : 80)} 520 210`} fill="none" stroke="#e7c27a" strokeWidth="3" />
      </svg>
      <label className="block">Hour {hour}<input type="range" min={0} max={24} value={hour} onChange={(event) => { setHour(Number(event.target.value)); poke(); }} className="w-full" /></label>
      <label className="block">Frequency {mhz} MHz<input type="range" min={3} max={148} value={mhz} onChange={(event) => { const value = Math.min(148, Math.max(3, Number(event.target.value))); setMhz(value); if (value > 0) setFrequency(value); poke(); }} className="w-full" /></label>
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
  return (
    <section className="space-y-4">
      <h1 className="display text-4xl sm:text-5xl">Safety scenes</h1>
      <div className="grid gap-3">
        {SCENES.map((scene) => (
          <details key={scene.title} className="rounded-2xl border border-line bg-card px-4 py-3">
            <summary className="min-h-11 cursor-pointer text-xl">{scene.title}</summary>
            <p className="mt-2 text-ink-soft">{scene.body}</p>
          </details>
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
      <h1 className="display text-4xl sm:text-5xl">Reactance bench</h1>
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
  const twoOnly = search.has("r1") && search.has("r2") && !search.has("r3");
  const [r1, setR1] = useState(num(search.get("r1"), 100));
  const [r2, setR2] = useState(num(search.get("r2"), 200));
  const [r3, setR3] = useState(twoOnly ? Number.NaN : num(search.get("r3"), 300));
  const [vin, setVin] = useState(12);
  const useThird = Number.isFinite(r3);
  const parallel = useThird ? 1 / (1 / r1 + 1 / r2 + 1 / r3) : 1 / (1 / r1 + 1 / r2);
  const vout = vin * (r2 / (r1 + r2));
  return (
    <section className="space-y-4">
      <h1 className="display text-4xl sm:text-5xl">Dividers and parallels</h1>
      <div className={`grid gap-3 ${useThird ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <Field label="R1" value={r1} onChange={(value) => { setR1(value); poke(); }} />
        <Field label="R2" value={r2} onChange={(value) => { setR2(value); poke(); }} />
        {useThird ? <Field label="R3" value={r3} onChange={(value) => { setR3(value); poke(); }} /> : null}
      </div>
      <output className="num block text-3xl">{useThird ? "Three" : "Two"} in parallel ≈ {Math.round(parallel)} Ω, less than the smallest.</output>
      <Field label="Divider input, volts" value={vin} onChange={setVin} />
      <p>Series divider across R2: {round(vout)} V. The same current runs through both resistors. Capacitors in series combine the way resistors do in parallel.</p>
      {showFormula ? <p>{useThird ? "1/R = 1/R1 + 1/R2 + 1/R3." : "1/R = 1/R1 + 1/R2."} Vout = Vin × R2 / (R1 + R2).</p> : null}
    </section>
  );
}

function PowerLab({ requested, showFormula, poke }: { requested: LicenseClass; showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const extra = classAtLeast(requested, "extra");
  const [vpp, setVpp] = useState(num(search.get("peakToPeak"), 100));
  const [ohms, setOhms] = useState(num(search.get("ohms"), 50));
  const [tx, setTx] = useState(num(search.get("watts"), 150));
  const [gain, setGain] = useState(num(search.get("gain"), 7));
  const [loss, setLoss] = useState(num(search.get("loss"), 4.2));
  const peak = vpp / 2;
  const rms = peak / Math.SQRT2;
  const pep = ohms === 0 ? 0 : (rms * rms) / ohms;
  const erp = tx * 10 ** ((gain - loss) / 10);
  return (
    <section className="space-y-4">
      <h1 className="display text-4xl sm:text-5xl">PEP, RMS, and the link</h1>
      <Field label="Peak-to-peak volts" value={vpp} onChange={(value) => { setVpp(value); poke(); }} />
      <Field label="Load, ohms" value={ohms} onChange={(value) => { setOhms(value); poke(); }} />
      <output className="num block text-3xl">RMS {round(rms)} V · PEP {round(pep)} W</output>
      {extra ? (
        <div className="space-y-3 rounded-3xl border border-line bg-card p-4">
          <h2 className="text-2xl">Effective radiated power</h2>
          <Field label="Transmitter watts" value={tx} onChange={(value) => { setTx(value); poke(); }} />
          <Field label="Gain, dB" value={gain} onChange={(value) => { setGain(value); poke(); }} />
          <Field label="Losses, dB" value={loss} onChange={(value) => { setLoss(value); poke(); }} />
          <output className="num block text-3xl">About {round(erp)} W</output>
          <p>10 W is +40 dBm. That link-budget example stays on the Extra bench.</p>
        </div>
      ) : null}
      {showFormula ? <p>RMS = (Vpp / 2) / √2. PEP = Vrms² / R. ERP is transmitter watts times 10 to the power of (gain − loss) / 10.</p> : null}
    </section>
  );
}

function ResonanceLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const stated = num(search.get("mhz"), NaN);
  const [microhenry, setMicrohenry] = useState(num(search.get("henries"), 10e-6) / 1e-6);
  const [picofarad, setPicofarad] = useState(num(search.get("farads"), 100e-12) / 1e-12);
  const [q, setQ] = useState(num(search.get("quality"), 10));
  const f = 1 / (2 * Math.PI * Math.sqrt(microhenry * 1e-6 * picofarad * 1e-12));
  const mhz = Number.isFinite(stated) ? stated : f / 1e6;
  return (
    <section className="space-y-4">
      <h1 className="display text-4xl sm:text-5xl">Resonance</h1>
      <Field label="L, µH" value={microhenry} onChange={(value) => { setMicrohenry(value); poke(); }} />
      <Field label="C, pF" value={picofarad} onChange={(value) => { setPicofarad(value); poke(); }} />
      <Field label="Q" value={q} onChange={setQ} />
      <output className="num block text-4xl">{round(mhz)} MHz</output>
      <p>At that frequency XL cancels XC and the series circuit looks like the resistance. Half-power bandwidth is {round((mhz / q) * 1000)} kHz. A higher Q is a sharper peak.</p>
      {showFormula ? <p>f = 1 / (2π√LC). Bandwidth = f / Q.</p> : null}
    </section>
  );
}

function TimeLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const [ohms, setOhms] = useState(num(search.get("ohms"), 10000));
  const [microfarad, setMicrofarad] = useState(num(search.get("microfarad"), 10));
  const tau = ohms * microfarad * 1e-6;
  const points = Array.from({ length: 21 }, (_, index) => {
    const t = (index / 20) * tau * 5;
    return { t, v: 1 - Math.exp(-t / tau) };
  });
  return (
    <section className="space-y-4">
      <h1 className="display text-4xl sm:text-5xl">Time constant</h1>
      <Field label="R, ohms" value={ohms} onChange={(value) => { setOhms(value); poke(); }} />
      <Field label="C, µF" value={microfarad} onChange={(value) => { setMicrofarad(value); poke(); }} />
      <svg viewBox="0 0 200 80" className="w-full rounded-2xl bg-card text-ink">
        <polyline fill="none" stroke="#c47a2c" strokeWidth="2" points={points.map((point, index) => `${index * 10},${80 - point.v * 70}`).join(" ")} />
        <line x1="40" y1="0" x2="40" y2="80" stroke="currentColor" strokeDasharray="2 2" />
      </svg>
      <output className="num block text-3xl">τ = {round(tau)} s · about 63% charged</output>
      {showFormula ? <p>τ = RC. One time constant reaches about 63 percent of the applied voltage.</p> : null}
    </section>
  );
}

function PhasorLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const [ohms, setOhms] = useState(num(search.get("ohms"), 300));
  const [reactance, setReactance] = useState(num(search.get("reactance"), -40));
  const magnitude = Math.hypot(ohms, reactance);
  const angle = (Math.atan2(reactance, ohms) * 180) / Math.PI;
  return (
    <section className="space-y-4">
      <h1 className="display text-4xl sm:text-5xl">Phasors</h1>
      <FigureView id="E5-1" hidden={false} />
      <Field label="Resistance, ohms" value={ohms} onChange={(value) => { setOhms(value); poke(); }} />
      <Field label="Reactance, ohms" value={reactance} onChange={(value) => { setReactance(value); poke(); }} />
      <output className="num block text-3xl">{round(magnitude)} Ω at {round(angle)}°</output>
      <p>Resistance runs one way on figure E5-1 and reactance the other. A series capacitor sits below the resistance axis.</p>
      {showFormula ? <p>Magnitude is √(R² + X²). The angle is arctan(X / R).</p> : null}
    </section>
  );
}

function BandwidthLab({ showFormula, poke }: { showFormula: boolean; poke: () => void }) {
  const search = useSearchParams();
  const asked = questionByQuery(search.get("q"));
  const parsedDeviation = asked ? parseKhz(asked.text, "deviation") : null;
  const parsedAudio = asked ? parseKhz(asked.text, "audio") : null;
  const repeater = asked?.id === "T8A09";
  const [deviation, setDeviation] = useState(parsedDeviation ?? 5);
  const [audio, setAudio] = useState(parsedAudio ?? (repeater ? 2.5 : 3));
  const fm = 2 * (deviation + audio);
  const index = audio === 0 ? 0 : deviation / audio;
  const scale = Math.max(fm, 3, 0.15);
  return (
    <section className="space-y-5">
      <h1 className="display text-4xl sm:text-5xl">Occupied bandwidth</h1>
      <p className="text-xl">The same carrier can occupy a sliver, a voice channel, or a wide FM channel.</p>
      <div className="space-y-3 rounded-3xl border border-line bg-card p-4">
        <Strip label="CW" width={barWidth(0.15, scale)} tone="bg-walnut" note="About 150 Hz" />
        <Strip label="SSB" width={barWidth(3, scale)} tone="bg-sage" note="About 3 kHz" />
        <Strip label="FM" width={barWidth(fm, scale)} tone="bg-amber-deep" note={`${round(fm)} kHz`} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="FM deviation, kHz" value={deviation} onChange={(value) => { setDeviation(value); poke(); }} />
        <Field label="Audio frequency, kHz" value={audio} onChange={(value) => { setAudio(value); poke(); }} />
      </div>
      <output className="num block text-4xl" data-testid="bandwidth-readout">{round(fm)} kHz</output>
      <output className="num block text-2xl" data-testid="bandwidth-index">Deviation ÷ audio = {audio === 0 ? "—" : round(index)}</output>
      {asked?.id === "T8A09" ? <p>Repeater FM voice is about 10–15 kHz.</p> : null}
      {asked?.id === "T8A10" ? <p>Fast-scan TV is about 6 MHz.</p> : null}
      {showFormula ? <p>FM bandwidth is twice the sum of the deviation and the highest audio frequency. The modulation index is the deviation divided by that audio frequency.</p> : <p className="text-ink-soft">Move a value and the formula appears.</p>}
    </section>
  );
}

function barWidth(kHz: number, scale: number): string {
  const share = scale === 0 ? 0 : (kHz / scale) * 100;
  return `${Math.min(100, Math.max(share, kHz < 1 ? 2 : 0))}%`;
}

function parseKhz(text: string, kind: "deviation" | "audio"): number | null {
  const source = text.replace(/±/g, "plus or minus");
  const match = kind === "audio"
    ? source.match(/highest modulat(?:ing|ion) frequency(?:\s+is)?\s+([\d.]+)\s*(kHz|Hz)/i) ?? source.match(/([\d.]+)\s*(kHz|Hz)\s+(?:modulating|audio)/i)
    : source.match(/deviation of\s+(?:plus or minus\s+)?([\d.]+)\s*(kHz|Hz)/i)
      ?? source.match(/(?:frequency swing of\s+)?plus or minus\s+([\d.]+)\s*(kHz|Hz)/i)
      ?? source.match(/([\d.]+)\s*(kHz|Hz)\s+(?:either side|deviation)/i);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  return /khz/i.test(match[2] ?? "") ? value : value / 1000;
}

function Strip({ label, width, tone, note }: { label: string; width: string; tone: string; note: string }) {
  return (
    <div className="grid grid-cols-[4rem_1fr_auto] items-center gap-3">
      <span>{label}</span>
      <span className="block h-6 rounded-full bg-paper-deep">
        <span className={`block h-6 rounded-full ${tone}`} style={{ width }} />
      </span>
      <span className="num text-sm text-ink-soft">{note}</span>
    </div>
  );
}

function YagiPicture() {
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <h2 className="display text-3xl">A three-element Yagi</h2>
      <svg viewBox="0 0 360 160" className="mt-3 w-full text-ink" role="img" aria-label="A reflector longer than the driven element, and a director shorter, with the lobe pointing at the director">
        <line x1="70" y1="20" x2="70" y2="140" stroke="currentColor" strokeWidth="6" />
        <line x1="170" y1="36" x2="170" y2="124" stroke="#c47a2c" strokeWidth="6" />
        <line x1="270" y1="52" x2="270" y2="108" stroke="var(--color-sage)" strokeWidth="6" />
        <line x1="70" y1="80" x2="270" y2="80" stroke="currentColor" strokeWidth="2" />
        <polygon points="310,80 286,70 286,90" fill="var(--color-extra)" />
      </svg>
      <p className="mt-2">The reflector is the long element. The director is the short one. The lobe points toward the director.</p>
    </div>
  );
}

function ArrayPicture({ poke }: { poke: () => void }) {
  const asked = questionByQuery(useSearchParams().get("q"));
  const start = asked?.id === "E9C01" ? { spacing: "half" as const, phase: 180 as const } : asked?.id === "E9C02" ? { spacing: "quarter" as const, phase: 90 as const } : { spacing: "half" as const, phase: 0 as const };
  const [spacing, setSpacing] = useState<"half" | "quarter">(start.spacing);
  const [phase, setPhase] = useState<0 | 90 | 180>(start.phase);
  const picture =
    spacing === "half" && phase === 0
      ? "A figure-eight broadside to the line of the verticals."
      : spacing === "half" && phase === 180
        ? "A figure-eight along the line of the verticals."
        : spacing === "quarter" && phase === 90
          ? "A cardioid, one direction favored."
          : "That spacing and phase is not one of the three exam pictures.";
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <h2 className="display text-3xl">Two verticals</h2>
      <div className="mt-3 flex items-end gap-16">
        <span className="block h-24 w-2 bg-walnut" />
        <span className="block h-24 w-2 bg-walnut" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={`min-h-11 rounded-full px-4 ${spacing === "half" ? "bg-walnut text-paper" : "border border-line"}`} onClick={() => { setSpacing("half"); poke(); }}>Half wave apart</button>
        <button type="button" className={`min-h-11 rounded-full px-4 ${spacing === "quarter" ? "bg-walnut text-paper" : "border border-line"}`} onClick={() => { setSpacing("quarter"); poke(); }}>Quarter wave apart</button>
        {([0, 90, 180] as const).map((value) => (
          <button key={value} type="button" className={`min-h-11 rounded-full px-4 ${phase === value ? "bg-walnut text-paper" : "border border-line"}`} onClick={() => { setPhase(value); poke(); }}>
            {value}° phase
          </button>
        ))}
      </div>
      <p className="mt-3">{picture}</p>
    </div>
  );
}

function SmithLab() {
  const [r, setR] = useState(1);
  const gamma = (r - 1) / (r + 1);
  const axisLeft = 5.6;
  const axisRight = 181.6;
  const axisY = 119.1;
  const x = (((axisLeft + axisRight) / 2 + gamma * ((axisRight - axisLeft) / 2)) / 199) * 100;
  const y = (axisY / 218) * 100;
  return (
    <section className="space-y-4">
      <h1 className="display text-4xl sm:text-5xl">Smith chart</h1>
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
        className={`num mt-1 min-h-11 w-full rounded-2xl border border-line px-3 py-2 ${readOnly ? "bg-paper-deep" : "bg-card"}`}
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
      <select className="mt-1 min-h-11 w-full rounded-2xl border border-line bg-card px-3 py-2 text-base" value={value} onChange={(event) => onChange(Number(event.target.value))}>
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
      <svg viewBox="0 0 24 20" className="mx-auto h-12 w-full text-ink">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="1.4" />
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
      <circle cx="100" cy="100" r="5" fill="currentColor" />
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
