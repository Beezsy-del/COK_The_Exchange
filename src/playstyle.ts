import { ELEMENTS, clamp, type Element } from "./elements";
export interface Playstyle {
  version: 1;
  matches: number;
  casts: Record<Element, number>;
  openings: Record<Element, number>;
  shieldCasts: number;
  actions: number;
}
export const MEMORY_KEY = "aetherduel.playstyle.v1";
const counts = () => ({ FIRE: 0, FROST: 0, VOLT: 0, EARTH: 0 });
export const emptyPlaystyle = (): Playstyle => ({
  version: 1,
  matches: 0,
  casts: counts(),
  openings: counts(),
  shieldCasts: 0,
  actions: 0,
});
const safeNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.floor(clamp(value, 1_000_000))
    : 0;
export function validatePlaystyle(input: unknown): Playstyle {
  const out = emptyPlaystyle();
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  const data = input as Record<string, unknown>;
  if (data.version !== 1) return out;
  out.matches = safeNumber(data.matches);
  out.actions = safeNumber(data.actions);
  out.shieldCasts = Math.min(out.actions, safeNumber(data.shieldCasts));
  for (const field of ["casts", "openings"] as const) {
    const values = data[field];
    if (values && typeof values === "object")
      for (const e of ELEMENTS)
        out[field][e] = safeNumber((values as Record<string, unknown>)[e]);
  }
  return out;
}
export function readPlaystyle(): Playstyle {
  try {
    return validatePlaystyle(
      JSON.parse(localStorage.getItem(MEMORY_KEY) || "null"),
    );
  } catch {
    return emptyPlaystyle();
  }
}
export function savePlaystyle(profile: Playstyle): boolean {
  try {
    localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify(validatePlaystyle(profile)),
    );
    return true;
  } catch {
    return false;
  }
}
export function forgetPlaystyle(): boolean {
  try {
    localStorage.removeItem(MEMORY_KEY);
    return true;
  } catch {
    return false;
  }
}
export function recordMatch(
  profile: Playstyle,
  match: {
    usage: Record<Element, number>;
    opening: Element | null;
    round: number;
  },
): Playstyle {
  const next = validatePlaystyle(profile);
  next.matches = clamp(next.matches + 1, 1_000_000);
  next.actions = clamp(next.actions + match.round, 1_000_000);
  next.shieldCasts = clamp(next.shieldCasts + match.usage.EARTH, 1_000_000);
  for (const e of ELEMENTS)
    next.casts[e] = clamp(next.casts[e] + match.usage[e], 1_000_000);
  if (match.opening)
    next.openings[match.opening] = clamp(
      next.openings[match.opening] + 1,
      1_000_000,
    );
  return next;
}
export function favorite(count: Record<Element, number>): Element {
  return ELEMENTS.reduce((a, b) => (count[b] > count[a] ? b : a));
}
export const defensiveRate = (p: Playstyle) =>
  p.actions ? p.shieldCasts / p.actions : 0;
