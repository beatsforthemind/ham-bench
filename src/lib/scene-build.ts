export type SceneTone = "sage" | "quiet" | "warn";

export type SceneGlyph =
  | "radio"
  | "tower"
  | "person"
  | "ear"
  | "speaker"
  | "wave"
  | "faint"
  | "arrow"
  | "cross"
  | "document"
  | "screen"
  | "cloud"
  | "key"
  | "door"
  | "clock"
  | "pin"
  | "ship"
  | "earth"
  | "sun"
  | "battery"
  | "plug"
  | "lock"
  | "harness"
  | "filter"
  | "crowd"
  | "badge"
  | "dial"
  | "room"
  | "slip"
  | "handshake"
  | "meter"
  | "star"
  | "rule"
  | "spill"
  | "drip"
  | "sliver"
  | "slice"
  | "highside"
  | "span"
  | "square"
  | "tones";

export type SceneLayout = "path" | "people" | "exception" | "clock" | "device" | "message";

export type ScenePlacement = {
  glyph: SceneGlyph;
  x: number;
  y: number;
  tone: SceneTone;
  x2?: number;
  y2?: number;
};

export type ScenePicture = {
  kind: "scene";
  layout: SceneLayout;
  caption: string;
  labels: readonly string[];
  panes: readonly (readonly ScenePlacement[])[];
  marks?: readonly string[];
};

export function at(
  glyph: SceneGlyph,
  x: number,
  y: number,
  tone: SceneTone,
  x2?: number,
  y2?: number,
): ScenePlacement {
  return { glyph, x, y, tone, x2, y2 };
}

export function one(layout: SceneLayout, caption: string, label: string, glyphs: ScenePlacement[]): ScenePicture {
  return { kind: "scene", layout, caption, labels: [label], panes: [glyphs] };
}

export function two(
  layout: SceneLayout,
  caption: string,
  labels: readonly [string, string],
  left: ScenePlacement[],
  right: ScenePlacement[],
): ScenePicture {
  return { kind: "scene", layout, caption, labels, panes: [left, right] };
}

/** The crossed glyph is the trap. The sage glyph is the situation the caption names. */
export function contrast(
  layout: SceneLayout,
  caption: string,
  label: string,
  wrong: SceneGlyph,
  right: SceneGlyph,
): ScenePicture {
  return one(layout, caption, label, [at(wrong, 58, 62, "quiet"), at("cross", 58, 62, "warn"), at(right, 156, 62, "sage")]);
}

export function doors(caption: string, label: string, icon: SceneGlyph): ScenePicture {
  return one("exception", caption, label, [
    at("door", 32, 78, "warn"),
    at("door", 78, 78, "warn"),
    at("door", 124, 78, "warn"),
    at("door", 176, 78, "sage"),
    at(icon, 176, 32, "sage"),
  ]);
}

export function shut(caption: string, label: string): ScenePicture {
  return one("exception", caption, label, [
    at("door", 36, 68, "warn"),
    at("door", 84, 68, "warn"),
    at("door", 132, 68, "warn"),
    at("radio", 180, 64, "quiet"),
    at("cross", 180, 64, "warn"),
  ]);
}

export function who(caption: string, label: string, icon: SceneGlyph = "person"): ScenePicture {
  return one("people", caption, label, [at("person", 48, 68, "quiet"), at(icon, 110, 62, "sage"), at("person", 172, 68, "quiet")]);
}
