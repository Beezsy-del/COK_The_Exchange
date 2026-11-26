import type { Element } from "./elements";
export type StatusType = "BURN" | "FREEZE" | "PARALYZE";
export type StatusSet = Record<StatusType, number>;
export const emptyStatuses = (): StatusSet => ({
  BURN: 0,
  FREEZE: 0,
  PARALYZE: 0,
});
export const STATUS_RULES = {
  BURN: {
    label: "Burned",
    icon: "🔥",
    turns: 2,
    chance: 0.3,
    message: "🔥 BURNED!",
  },
  FREEZE: {
    label: "Frozen",
    icon: "❄️",
    turns: 1,
    chance: 0.25,
    message: "❄️ FROZEN! Turn Skipped",
  },
  PARALYZE: {
    label: "Paralyzed",
    icon: "⚡",
    turns: 2,
    chance: 0.3,
    message: "⚡ PARALYZED!",
  },
} as const;
export function procStatus(
  element: Element,
  random: () => number,
): StatusType | null {
  const type =
    element === "FIRE"
      ? "BURN"
      : element === "FROST"
        ? "FREEZE"
        : element === "VOLT"
          ? "PARALYZE"
          : null;
  return type && random() < STATUS_RULES[type].chance ? type : null;
}
export function inflict(statuses: StatusSet, type: StatusType): StatusSet {
  return { ...statuses, [type]: STATUS_RULES[type].turns }; // Refresh, never stack duration or damage.
}
/** One call per owner turn. Tick and decrement even when another status skips the action. */
export function beginStatusTurn(statuses: StatusSet, random: () => number) {
  const next = emptyStatuses();
  for (const type of Object.keys(next) as StatusType[])
    next[type] = Math.max(0, statuses[type] - 1);
  const frozen = statuses.FREEZE > 0;
  const disrupted = !frozen && statuses.PARALYZE > 0 && random() < 0.5;
  return {
    statuses: next,
    burnDamage: statuses.BURN > 0 ? 8 : 0,
    skip: frozen || disrupted,
    message: frozen
      ? "❄️ FROZEN! Turn Skipped"
      : disrupted
        ? "⚡ Disrupted by Paralysis!"
        : "",
  };
}
