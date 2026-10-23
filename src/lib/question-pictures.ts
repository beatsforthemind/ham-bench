import { CARD_MEMORIES } from "./card-memories";
import { CARD_SCENES, type ScenePicture } from "./card-scenes";

/**
 * A picture plus a short caption for one question.
 * The caption and every label must stay free of the correct line's private tokens.
 * A question with no honest picture is absent, and that count is capped in tests.
 */
export type SymbolId =
  | "flow"
  | "push"
  | "rate"
  | "zigzag"
  | "wiper"
  | "plates"
  | "plates-gap"
  | "coil-field"
  | "coil"
  | "diode"
  | "switch"
  | "layers"
  | "gain"
  | "rectifier"
  | "regulator"
  | "sensitivity"
  | "mixer"
  | "selectivity"
  | "across"
  | "series-meter";

export type SceneId =
  | "whip"
  | "whip-hat"
  | "tip"
  | "ball"
  | "thin-lead"
  | "thick-lead"
  | "stubby"
  | "full-size"
  | "narrow-span"
  | "wide-span"
  | "one-mark"
  | "every-mark"
  | "one-string"
  | "side-strings"
  | "backfeed"
  | "blocked"
  | "ring"
  | "beam"
  | "both-sides"
  | "one-side"
  | "flat-grid"
  | "from-spot"
  | "short-way"
  | "opposite-way"
  | "core-a"
  | "core-b"
  | "hungry"
  | "sipping"
  | "stepped"
  | "smooth"
  | "lamp-dark"
  | "lamp-lit"
  | "bare-braid"
  | "bead-braid";

export type BandId = "low" | "high" | "long" | "short" | "above" | "below";

export type BenchId =
  | "ohms"
  | "power-ei"
  | "power-er"
  | "power-ir"
  | "power-i"
  | "prefixes"
  | "db-small"
  | "db-large"
  | "db-two"
  | "dipole";

type Painted = { marks?: readonly string[] };
type RailsPicture = { kind: "rails"; caption: string; labels: readonly [string, string] } & Painted;
type SymbolPicture = { kind: "symbol"; symbol: SymbolId; caption: string; labels: readonly [string] } & Painted;
type PairPicture = { kind: "pair"; pair: readonly [SceneId, SceneId]; caption: string; labels: readonly [string, string] } & Painted;
type BandPicture = { kind: "band"; band: BandId; caption: string; labels: readonly [string] } & Painted;
type BenchPicture = { kind: "bench"; bench: BenchId; caption: string; labels: readonly [string] } & Painted;

export type { SceneGlyph, SceneLayout, ScenePicture, ScenePlacement, SceneTone } from "./card-scenes";

export type PictureSpec = RailsPicture | SymbolPicture | PairPicture | BandPicture | BenchPicture | ScenePicture;

const pictures: Record<string, PictureSpec> = {};

function put(id: string, spec: PictureSpec) {
  if (pictures[id]) throw new Error(`duplicate picture for ${id}`);
  pictures[id] = spec;
}

function putMany(ids: readonly string[], spec: PictureSpec) {
  for (const id of ids) put(id, spec);
}

const RAILS_CAPTION =
  "On FM, a bigger voice swings the signal farther. The receiver follows only the part that stays between the rails. A peak that crosses a rail is the piece of the word that disappears.";

put("T2B05", {
  kind: "rails",
  caption: RAILS_CAPTION,
  labels: [
    "A smaller voice stays between the rails. The sound comes through.",
    "A bigger voice crosses the rails. The sound is gone on those peaks.",
  ],
});

function symbol(id: string, symbolId: SymbolId, caption: string, label: string) {
  put(id, { kind: "symbol", symbol: symbolId, caption, labels: [label] });
}

symbol("T5A03", "flow", "Electrons moving along a wire.", "Moving electrons");
symbol("T5A05", "push", "A push between two points starts those electrons moving.", "A push");
symbol("T5A10", "rate", "How fast energy is spent.", "Energy spent");
symbol("T6A01", "zigzag", "Opposition to current is drawn as a zigzag.", "A zigzag");
symbol("T6A02", "wiper", "A zigzag with a sliding arrow is the adjustable control.", "A sliding arrow");
symbol("T6A04", "plates", "Energy sits in the field between two plates.", "Two plates");
symbol("T6A05", "plates-gap", "Two plates sit apart with an insulator between them.", "A gap between plates");
symbol("T6A06", "coil-field", "Energy sits in the field around a coil.", "A coil and its field");
symbol("T6A07", "coil", "The part is drawn as a coil of wire.", "A coil of wire");
symbol("T6B02", "diode", "Charge passes one way and is blocked the other way.", "A one-way arrow");
symbol("T6B03", "switch", "A small input opens or closes a larger path.", "Opens or closes");
symbol("T6B04", "layers", "Three layers of semiconductor material.", "Three layers");
symbol("T6B10", "gain", "A small signal at the control lead controls a larger one.", "Small in, large out");
symbol("T6D01", "rectifier", "A wave that swings both ways comes out swinging one way.", "One way out");
symbol("T6D05", "regulator", "The output is held steady while the input wanders.", "Held steady");
symbol("T7A01", "sensitivity", "How small a signal can still be heard.", "Still heard");
symbol("T7A03", "mixer", "Two signals go in and a new frequency comes out.", "A new frequency");
symbol("T7A04", "selectivity", "One signal is kept and the ones beside it are ignored.", "Neighbors ignored");
symbol("T7D01", "across", "The meter sits across the part while the circuit stays closed.", "Across the part");
symbol("T7D04", "series-meter", "The meter sits in the path of the flow.", "In the path");

function pair(id: string, left: SceneId, right: SceneId, caption: string, leftLabel: string, rightLabel: string) {
  put(id, { kind: "pair", pair: [left, right], caption, labels: [leftLabel, rightLabel] });
}

pair("G4E01", "whip", "whip-hat", "A hat on a stubby whip makes the radio treat it as taller.", "A stubby whip alone.", "The same whip with a hat.");
pair("G4E02", "tip", "ball", "A ball on the end spreads the charge so it does not spray off.", "A bare end sprays charge.", "A ball on the end holds the charge.");
pair("G4E03", "thin-lead", "thick-lead", "The sturdy path is a thick lead straight to the battery.", "A thin convenience lead.", "A thick lead straight to the battery.");
pair("G4E04", "thin-lead", "thick-lead", "A thin convenience outlet cannot feed a hundred-watt radio.", "A thin convenience outlet.", "A thick lead straight to the battery.");
pair(
  "G4E05",
  "stubby",
  "full-size",
  "How little a stubby radiator can send out is what most limits the mobile station.",
  "A stubby radiator.",
  "A full-size radiator.",
);
pair("G4E06", "narrow-span", "wide-span", "A stubby radiator only works well across a narrow slice.", "A narrow slice.", "A wide usable span.");
pair("G4E07", "one-mark", "every-mark", "Each of the other lines belongs in the answer.", "One cause on its own.", "Each of the other causes belongs.");
pair("G4E08", "one-string", "side-strings", "Strings of cells, then those strings placed side by side.", "One string of cells.", "Strings placed side by side.");
pair("G4E10", "backfeed", "blocked", "A one-way part keeps the battery from feeding the panel after dark.", "The battery feeds the panel after dark.", "A one-way part stops that.");
pair("T8C02", "ring", "beam", "A beam you can turn toward the hidden signal.", "A signal leaves equally all around.", "A beam you can turn.");
pair("G2A06", "both-sides", "one-side", "One side of the voice is kept, so the signal takes less room and the energy goes into that side.", "Both sides and the carrier.", "One side kept.");
pair("G2A07", "both-sides", "one-side", "The voice keeps one side and throws the carrier and the other side away.", "Both sides and the carrier.", "One side kept.");
pair("G2D04", "flat-grid", "from-spot", "A map drawn so every direction and range is measured from one spot.", "A flat grid.", "Ranges and directions from one spot.");
pair("G2D06", "short-way", "opposite-way", "The long way around leaves in the opposite direction from the short way around.", "The short way around.", "The opposite direction.");
pair("G2E14", "one-mark", "every-mark", "Each of the other lines belongs in the answer.", "One cause on its own.", "Each of the other causes belongs.");
pair("G6B01", "core-a", "core-b", "What the core is made of decides which frequencies it likes.", "One recipe for the core.", "Another recipe for the core.");
pair("G6B03", "hungry", "sipping", "These chips draw only a little from the supply.", "A hungry chip.", "A chip that sips.");
pair("G6B05", "one-mark", "every-mark", "Each of the other lines belongs in the answer.", "One cause on its own.", "Each of the other causes belongs.");
pair("G6B06", "stepped", "smooth", "The signal that goes through stays a smooth wave.", "A stepped wave.", "A smooth wave.");
pair("G6B08", "lamp-dark", "lamp-lit", "The arrow points the way the current must go for the lamp to light.", "The lamp stays dark.", "The lamp lights when current follows the arrow.");
pair("G6B10", "bare-braid", "bead-braid", "A bead on the outside of the cable chokes the current that rides the braid.", "A bare braid.", "A bead on the braid.");

function band(id: string, bandId: BandId, caption: string, label: string, marks: readonly string[] = []) {
  put(id, { kind: "band", band: bandId, caption, labels: [label], marks });
}

const ceilingMarks = ["above 30", "HF"] as const;

band("T1B11", "low", CARD_MEMORIES.T1B11, "The lower ceiling is on HF. Above 30 MHz the ceiling rises.", ceilingMarks);
band("T1B12", "high", CARD_MEMORIES.T1B12, "Above 30 MHz the ceiling is the full amateur limit.", ceilingMarks);
band("T1C08", "long", CARD_MEMORIES.T1C08, "A decade.");
band("T1C09", "short", CARD_MEMORIES.T1C09, "A short pair of years.");
band("T8A06", "above", CARD_MEMORIES.T8A06, "The voice sits above the carrier.");
band("G2A01", "above", CARD_MEMORIES.G2A01, "The voice sits above the carrier.");
band("G2A03", "above", CARD_MEMORIES.G2A03, "The voice sits above the carrier.");
band("G2A04", "above", CARD_MEMORIES.G2A04, "The voice sits above the carrier.");
band("G2E05", "above", CARD_MEMORIES.G2E05, "The tones sit above the carrier.");
band("G2A02", "below", CARD_MEMORIES.G2A02, "The voice sits below the carrier.");
band("G2E01", "below", CARD_MEMORIES.G2E01, "The tones sit below the carrier.");

const ohms: PictureSpec = {
  kind: "bench",
  bench: "ohms",
  caption: "Voltage, current, and resistance meet here. The one the question asks for stays empty.",
  labels: ["The missing quantity"],
  marks: ["V = I × R", "?"],
};
putMany(["T5D04", "T5D05", "T5D06", "T5D07", "T5D08", "T5D09", "T5D10", "T5D11", "T5D12"], ohms);

const powerRate: PictureSpec = {
  kind: "bench",
  bench: "power-ei",
  caption: "Voltage times current is the rate energy is used. That rate stays empty.",
  labels: ["The rate stays empty"],
  marks: ["P = E × I", "?"],
};
putMany(["T5C09", "T5C10", "G5B04"], powerRate);

put("T5C11", {
  kind: "bench",
  bench: "power-i",
  caption: "Voltage and the rate are given. The flow the question asks for stays empty.",
  labels: ["The flow stays empty"],
  marks: ["I = P / E", "?"],
});

put("G5B03", {
  kind: "bench",
  bench: "power-er",
  caption: "Voltage and resistance fix the rate energy is used. That rate stays empty.",
  labels: ["The rate stays empty"],
  marks: ["P = E² / R", "?"],
});

put("G5B05", {
  kind: "bench",
  bench: "power-ir",
  caption: "Current and resistance fix the rate energy is used. That rate stays empty.",
  labels: ["The rate stays empty"],
  marks: ["P = I² × R", "?"],
});

const prefixes: PictureSpec = {
  kind: "bench",
  bench: "prefixes",
  caption: "A prefix slides the decimal by threes.",
  labels: ["The decimal slides by threes"],
};
putMany(["T5B01", "T5B02", "T5B03", "T5B04", "T5B05", "T5B06", "T5B07", "T5B08", "T5B12", "T5B13"], prefixes);

const dbSmall: PictureSpec = {
  kind: "bench",
  bench: "db-small",
  caption: "This change is a small step. A small step doubles the power.",
  labels: ["The small step"],
};
putMany(["T5B09", "G5B01"], dbSmall);

put("T5B10", {
  kind: "bench",
  bench: "db-two",
  caption: "The power falls through two small steps.",
  labels: ["Two small steps down"],
});

put("T5B11", {
  kind: "bench",
  bench: "db-large",
  caption: "This change is a large step. A large step multiplies the power many times over.",
  labels: ["The large step"],
});

const dipole: PictureSpec = {
  kind: "bench",
  bench: "dipole",
  caption: "The length in feet is about 468 divided by the frequency in megahertz. The length stays empty.",
  labels: ["468 divided by the frequency"],
  marks: ["468 / f", "?"],
};
putMany(["G9B10", "G9B11"], dipole);

for (const [id, spec] of Object.entries(CARD_SCENES)) {
  if (spec.labels.length !== spec.panes.length) throw new Error(`${id} picture panes do not match its labels`);
  put(id, spec);
}

export function questionPicture(id: string): PictureSpec | null {
  return pictures[id] ?? null;
}

/** Caption and image labels, in the order a reader meets them. */
export function pictureStrings(id: string): string[] {
  const picture = questionPicture(id);
  if (!picture) return [];
  return [picture.caption, ...picture.labels, ...(picture.marks ?? [])];
}
