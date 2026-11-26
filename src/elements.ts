export const ELEMENTS = ["FIRE", "FROST", "VOLT", "EARTH"] as const;
export type Element = (typeof ELEMENTS)[number];
export type Spell = Element | "REST";
export const clamp = (val: number, max: number) =>
  Math.max(0, Math.min(max, Number.isFinite(val) ? val : 0));
export const MEDITATE_HEALTH_COST = 6;
export const DEFEAT_ANIMATION_MS = 2800;
export const SPELLS = {
  FIRE: {
    name: "Cinder Blast",
    school: "Pyromancy",
    cost: 20,
    min: 24,
    max: 32,
    detail: "Raw power. No apologies.",
  },
  FROST: {
    name: "Frost Shatter",
    school: "Cryomancy",
    cost: 18,
    min: 16,
    max: 22,
    detail: "Chill: −20% enemy damage.",
  },
  VOLT: {
    name: "Chain Surge",
    school: "Electromancy",
    cost: 22,
    min: 10,
    max: 38,
    detail: "35% chance for a 1.5× crit.",
  },
  EARTH: {
    name: "Stone Bulwark",
    school: "Terramancy",
    cost: 15,
    min: 12,
    max: 16,
    detail: "+20 shield for two turns.",
  },
};
