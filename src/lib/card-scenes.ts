import { HIGHER_SCENES } from "./card-scenes-higher";
import { TECH_SCENES } from "./card-scenes-tech";

export type { SceneGlyph, SceneLayout, ScenePicture, ScenePlacement, SceneTone } from "./scene-build";

/**
 * Exam cards that differ only by private numbers or private names.
 * A drawing without those words would not pick out the right line.
 */
export const SCENES_LEFT_BARE = ["T8B08", "G1A01", "G1A08", "G8C15", "E1A09", "E1D07", "E8D10"] as const;

export const CARD_SCENES = { ...TECH_SCENES, ...HIGHER_SCENES };
