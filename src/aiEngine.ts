import {
  ELEMENTS,
  SPELLS,
  clamp,
  MEDITATE_HEALTH_COST,
  type Element,
  type Spell,
} from "./elements";
import { BOSSES, type BossId } from "./bosses";
import {
  beginStatusTurn,
  emptyStatuses,
  inflict,
  procStatus,
  STATUS_RULES,
  type StatusSet,
  type StatusType,
} from "./statusEffects";
import {
  emptyPlaystyle,
  validatePlaystyle,
  favorite,
  defensiveRate,
  type Playstyle,
} from "./playstyle";
export * from "./elements";
export type Phase =
  "IDLE" | "PLAYER_CASTING" | "AI_ANALYZING" | "AI_ACTING" | "CHECK_OUTCOME";
export interface Memory {
  history: Element[];
  counts: Record<Element, number>;
  currentResistances: Record<Element, number>;
}
export type Target = "player" | "enemy";
export interface Notice {
  id: number;
  target: Target;
  text: string;
  kind: StatusType | "HIJACK" | "TICK";
  round: number;
}
export interface Game {
  phase: Phase;
  epoch: number;
  turn: "player" | "ai";
  bossId: BossId;
  round: number;
  hp: number;
  mana: number;
  enemyHp: number;
  enemyShield: number;
  shields: { amount: number; ttl: number }[];
  memory: Memory;
  usage: Record<Element, number>;
  opening: Element | null;
  echo: Playstyle;
  playerStatuses: StatusSet;
  bossStatuses: StatusSet;
  notices: Notice[];
  eventSeq: number;
  shieldBreaks: number;
  hijacks: number;
  nextHijack: "STEAL" | "INVERT" | null;
  inverted: boolean;
  pending: Spell | null;
  seed: number;
  chilled: boolean;
  prediction: Element | null;
  confidence: number;
  stance: string;
  dialogue: string;
  log: string[];
  result: "victory" | "defeat" | null;
  penalty: number;
  rawDamage: number;
  bloodPrice: number;
  effect: {
    target: Target;
    text: string;
    element: Spell;
    heavy: boolean;
  } | null;
}
const zero = (): Record<Element, number> => ({
  FIRE: 0,
  FROST: 0,
  VOLT: 0,
  EARTH: 0,
});
export const initialGame = (
  seed = Date.now() >>> 0,
  bossId: BossId = "MALAKOR",
  echo: Playstyle = emptyPlaystyle(),
): Game => ({
  phase: "IDLE",
  epoch: 0,
  turn: "player",
  bossId,
  round: 0,
  hp: 120,
  mana: 100,
  enemyHp: 240,
  enemyShield: 0,
  shields: [],
  memory: { history: [], counts: zero(), currentResistances: zero() },
  usage: zero(),
  opening: null,
  echo: validatePlaystyle(echo),
  playerStatuses: emptyStatuses(),
  bossStatuses: emptyStatuses(),
  notices: [],
  eventSeq: 0,
  shieldBreaks: 0,
  hijacks: 0,
  nextHijack: null,
  inverted: false,
  pending: null,
  seed: seed || 1,
  chilled: false,
  prediction: null,
  confidence: 0,
  stance: "Observing",
  dialogue: BOSSES[bossId].intro,
  log: [`${BOSSES[bossId].name} enters the sanctum.`],
  result: null,
  penalty: 0,
  rawDamage: 0,
  bloodPrice: 0,
  effect: null,
});
export const shieldTotal = (s: Game) =>
  clamp(
    s.shields.reduce((a, b) => a + b.amount, 0),
    100,
  );
export const canAfford = (s: Game, spell: Spell) =>
  spell === "REST" || s.nextHijack === "INVERT" || s.mana >= SPELLS[spell].cost;
export function adapt(memory: Memory, spell: Spell): Memory {
  const history =
    spell === "REST" ? memory.history : [...memory.history, spell].slice(-10);
  const counts = zero();
  history.forEach((e) => counts[e]++);
  const currentResistances = zero();
  ELEMENTS.forEach(
    (e) =>
      (currentResistances[e] = clamp(
        memory.currentResistances[e] + (e === spell ? 25 : -10),
        80,
      )),
  );
  return { history, counts, currentResistances };
}
export function predict(m: Memory) {
  const element = favorite(m.counts);
  return {
    element: m.history.length ? element : null,
    confidence: m.history.length
      ? Math.round((m.counts[element] / m.history.length) * 100)
      : 0,
  };
}
function random(s: Game) {
  s.seed = (Math.imul(1664525, s.seed) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
function addLog(s: Game, text: string) {
  s.log = [text, ...s.log].slice(0, 40);
}
function notice(s: Game, target: Target, text: string, kind: Notice["kind"]) {
  s.eventSeq++;
  s.notices = [
    ...s.notices,
    { id: s.eventSeq, target, text, kind, round: s.round },
  ].slice(-8);
  addLog(s, text);
}
function damagePlayer(s: Game, amount: number, bypass = false) {
  let remaining = clamp(amount, 100);
  const before = shieldTotal(s);
  if (!bypass)
    for (const shield of s.shields) {
      const used = Math.min(shield.amount, remaining);
      shield.amount = clamp(shield.amount - used, 100);
      remaining = clamp(remaining - used, 100);
    }
  s.hp = clamp(s.hp - remaining, 120);
  // Expiring shields never count as a break. Only damage that consumed the final point does.
  if (!bypass && before > 0 && shieldTotal(s) === 0 && amount > 0)
    s.shieldBreaks++;
  return remaining;
}
function damageBoss(s: Game, amount: number, bypass = false) {
  const absorbed = bypass ? 0 : Math.min(s.enemyShield, amount);
  s.enemyShield = clamp(s.enemyShield - absorbed, 100);
  s.enemyHp = clamp(s.enemyHp - (amount - absorbed), 240);
  return amount - absorbed;
}
function startTurn(s: Game, target: Target) {
  const key = target === "player" ? "playerStatuses" : "bossStatuses";
  const resolution = beginStatusTurn(s[key], () => random(s));
  s[key] = resolution.statuses;
  if (resolution.burnDamage) {
    if (target === "player") damagePlayer(s, 8, true);
    else damageBoss(s, 8, true);
    notice(s, target, "🔥 Burn ticks for 8 damage", "TICK");
  }
  if ((target === "player" ? s.hp : s.enemyHp) === 0) return false;
  if (resolution.skip) {
    notice(
      s,
      target,
      resolution.message,
      target === "player" && resolution.message.includes("Paralysis")
        ? "PARALYZE"
        : resolution.message.includes("FROZEN")
          ? "FREEZE"
          : "PARALYZE",
    );
    return false;
  }
  return true;
}
function applyProc(s: Game, element: Element, target: Target) {
  if ((target === "player" ? s.hp : s.enemyHp) === 0) return;
  const type = procStatus(element, () => random(s));
  if (!type) return;
  const key = target === "player" ? "playerStatuses" : "bossStatuses";
  s[key] = inflict(s[key], type);
  notice(s, target, STATUS_RULES[type].message, type);
  if (target === "enemy")
    s.dialogue =
      BOSSES[s.bossId][
        type === "BURN" ? "burned" : type === "FREEZE" ? "frozen" : "paralyzed"
      ];
}
function hijack(s: Game, target: Target): boolean {
  if (s.bossId !== "GLITCH") return false;
  let mode = target === "player" ? s.nextHijack : null;
  if (target === "player") s.nextHijack = null;
  if (!mode && random(s) < 0.2) {
    mode = random(s) < 0.5 ? "STEAL" : "INVERT";
    s.hijacks++;
    notice(
      s,
      "player",
      `⚠️ GLITCH HIJACKED YOUR THREAD! ${mode === "STEAL" ? "Turn stolen" : "Mana costs inverted"}`,
      "HIJACK",
    );
    s.dialogue = BOSSES.GLITCH.counter;
  }
  if (!mode) return false;
  if (target === "enemy") {
    s.nextHijack = mode;
    return false;
  }
  s.inverted = mode === "INVERT";
  if (mode === "STEAL") {
    addLog(s, "Your action was reallocated to the void. No mana spent.");
    return true;
  }
  addLog(s, "Inverted costs: this elemental cast restores its mana cost.");
  return false;
}
function updateDialogueForOutcome(s: Game) {
  const boss = BOSSES[s.bossId];
  if (s.enemyHp === 0) s.dialogue = boss.defeat;
  else if (s.hp === 0) s.dialogue = boss.victory;
  else if (s.hp < 36) s.dialogue = boss.low;
  else if (s.enemyHp < 72) s.dialogue = boss.desperate;
}
function playerAction(s: Game) {
  const spell = s.pending!;
  if (!startTurn(s, "player") || hijack(s, "player")) return;
  if (spell === "REST") {
    const restored = Math.min(30, 100 - s.mana),
      paid = Math.min(MEDITATE_HEALTH_COST, s.hp);
    damagePlayer(s, MEDITATE_HEALTH_COST, true);
    s.bloodPrice += paid;
    s.mana = clamp(s.mana + 30, 100);
    s.shields.push({ amount: Math.min(5, 100 - shieldTotal(s)), ttl: 1 });
    s.effect = {
      target: "player",
      text: `+${restored} MANA / −${paid} HP`,
      element: spell,
      heavy: false,
    };
    addLog(
      s,
      `Blood meditation: +${restored} mana, −${paid} health (bypasses shields), +5 shield.`,
    );
    s.dialogue =
      s.bossId === "MALAKOR"
        ? "Borrowing from your own pulse? That interest rate is murder."
        : BOSSES[s.bossId].counter;
  } else {
    const spec = SPELLS[spell];
    s.mana = clamp(s.mana + (s.inverted ? spec.cost : -spec.cost), 100);
    s.usage[spell]++;
    s.opening ??= spell;
    const base = spec.min + Math.floor(random(s) * (spec.max - spec.min + 1));
    const crit = spell === "VOLT" && random(s) < 0.35;
    const raw = clamp(Math.round(base * (crit ? 1.5 : 1)), 100);
    const resisted = Math.round(
      (raw * s.memory.currentResistances[spell]) / 100,
    );
    const damage = clamp(raw - resisted, 100);
    const dealt = damageBoss(s, damage);
    s.penalty += resisted;
    s.rawDamage += raw;
    if (spell === "EARTH")
      s.shields.push({ amount: Math.min(20, 100 - shieldTotal(s)), ttl: 2 });
    s.chilled = spell === "FROST";
    s.effect = {
      target: "enemy",
      text: `${resisted >= raw * 0.5 ? "RESISTED " : crit ? "CRIT! " : ""}−${dealt}`,
      element: spell,
      heavy: crit || damage >= 28,
    };
    const previous = s.memory.history.at(-1);
    s.dialogue =
      s.bossId === "MALAKOR"
        ? resisted >= raw * 0.5
          ? "Your pathetic sparks couldn't even warm my tea!"
          : spell === "FIRE" && previous === "FIRE"
            ? "Fire again? Did you forget your other spellbooks at home?"
            : previous && previous !== spell
              ? "Oh, so you DO have more than one brain cell!"
              : "A respectable attempt. For someone of your… stature."
        : BOSSES[s.bossId].counter;
    addLog(
      s,
      `${spec.name}: ${dealt} damage${resisted ? ` · ${resisted} resisted` : ""}${crit ? " · critical!" : ""}`,
    );
    applyProc(s, spell, "enemy");
  }
  s.memory = adapt(s.memory, spell);
  if (s.bossId !== "MALAKOR") s.memory.currentResistances = zero();
}
function enemyAction(s: Game) {
  if (s.enemyHp === 0 || s.hp === 0) return;
  if (!startTurn(s, "enemy")) return;
  hijack(s, "enemy");
  let damage = 8 + Math.floor(random(s) * 5),
    element: Element = "VOLT",
    name = "Arcane Rebuke";
  if (s.bossId === "MALAKOR") {
    if (s.enemyHp <= 65 && s.round % 3 === 0) {
      s.enemyShield = clamp(s.enemyShield + 22, 100);
      damage = 0;
      name = "Aegis of Spite";
    } else if (s.enemyHp <= 65 && s.round % 2 === 1) {
      damage = 10;
      s.enemyHp = clamp(s.enemyHp + 10, 240);
      name = "Void Leech";
      element = "EARTH";
    } else if (s.memory.currentResistances.FIRE >= 50) {
      damage = 22;
      name = "Frost Lance";
      element = "FROST";
    } else if (s.prediction && s.confidence >= 60) {
      damage += 4;
      name = `${s.prediction.toLowerCase()} counter`;
      element =
        s.prediction === "FIRE"
          ? "FROST"
          : s.prediction === "FROST"
            ? "FIRE"
            : s.prediction === "VOLT"
              ? "EARTH"
              : "VOLT";
    }
  } else if (s.bossId === "GLITCH") {
    element = ELEMENTS[Math.floor(random(s) * 4)];
    name = {
      FIRE: "Thermal Overflow",
      FROST: "Process Suspend",
      VOLT: "Voltage Fault",
      EARTH: "Memory Corruption",
    }[element];
    damage = 9 + Math.floor(random(s) * 7);
  } else {
    const profile = s.echo;
    const defensive =
      profile.matches > 0
        ? defensiveRate(profile) >= 0.35
        : s.usage.EARTH / Math.max(1, s.round) >= 0.35;
    if (defensive && s.round % 2 === 0) {
      s.enemyShield = clamp(s.enemyShield + 16, 100);
      s.enemyHp = clamp(s.enemyHp + 6, 240);
      damage = 0;
      name = "Reflected Bulwark (+16 shield, +6 health)";
      element = "EARTH";
    } else {
      element = profile.matches
        ? s.round === 1
          ? favorite(profile.openings)
          : favorite(profile.casts)
        : favorite(s.memory.counts);
      name = `Echo: ${SPELLS[element].name}`;
      damage = element === "FIRE" ? 16 : element === "EARTH" ? 10 : 13;
      s.dialogue = BOSSES.MIRROR.counter;
    }
  }
  const critical = damage > 0 && random(s) < 0.12;
  damage = clamp(
    Math.round(damage * (critical ? 1.5 : 1) * (s.chilled ? 0.8 : 1)),
    100,
  );
  const dealt = damagePlayer(s, damage);
  s.effect = {
    target: damage ? "player" : "enemy",
    text: damage
      ? dealt
        ? `${critical ? "CRIT! " : ""}−${dealt}`
        : "BLOCKED"
      : "WARD RAISED",
    element,
    heavy: critical || dealt >= 20,
  };
  if (critical) s.dialogue = BOSSES[s.bossId].crit;
  addLog(
    s,
    `${BOSSES[s.bossId].name} uses ${name}: ${dealt} damage${s.chilled ? " · chilled −20%" : ""}${critical ? " · critical!" : ""}.`,
  );
  if (damage > 0) applyProc(s, element, "player");
}
export type Action =
  | { type: "CAST"; spell: Spell }
  | { type: "STEP"; phase: Phase; epoch?: number; round?: number }
  | { type: "RESET"; seed?: number; bossId?: BossId; echo?: Playstyle };
export function reducer(state: Game, action: Action): Game {
  if (action.type === "RESET")
    return {
      ...initialGame(
        action.seed ?? (Math.imul(state.seed, 1664525) + 1013904223) >>> 0,
        action.bossId ?? state.bossId,
        action.echo ?? state.echo,
      ),
      epoch: state.epoch + 1,
    };
  if (state.result) return state;
  if (action.type === "CAST") {
    if (
      state.phase !== "IDLE" ||
      state.turn !== "player" ||
      !canAfford(state, action.spell)
    )
      return state;
    return {
      ...state,
      phase: "PLAYER_CASTING",
      turn: "ai",
      pending: action.spell,
      round: state.round + 1,
      effect: null,
      inverted: false,
      notices: [],
    };
  }
  if (
    action.phase !== state.phase ||
    state.phase === "IDLE" ||
    (action.epoch !== undefined && action.epoch !== state.epoch) ||
    (action.round !== undefined && action.round !== state.round)
  )
    return state;
  const s: Game = {
    ...state,
    shields: state.shields.map((x) => ({ ...x })),
    usage: { ...state.usage },
    playerStatuses: { ...state.playerStatuses },
    bossStatuses: { ...state.bossStatuses },
  };
  if (s.phase === "PLAYER_CASTING") {
    playerAction(s);
    updateDialogueForOutcome(s);
    s.phase = "AI_ANALYZING";
    return s;
  }
  if (s.phase === "AI_ANALYZING") {
    const p = predict(s.memory);
    s.prediction = p.element;
    s.confidence = p.confidence;
    s.stance =
      s.enemyHp === 0
        ? "Ego shattered"
        : s.bossId === "GLITCH"
          ? s.nextHijack
            ? "Thread hijacked"
            : "Unstable process"
          : s.bossId === "MIRROR"
            ? defensiveRate(s.echo) >= 0.35
              ? "Defensive echo"
              : "Reflecting your habits"
            : s.enemyHp <= 65
              ? "Survival instinct"
              : s.memory.currentResistances.FIRE >= 50
                ? "Fire ward active"
                : p.confidence >= 60
                  ? "Counter prepared"
                  : "Aggressive";
    s.phase = "AI_ACTING";
    s.effect = null;
    return s;
  }
  if (s.phase === "AI_ACTING") {
    enemyAction(s);
    s.shields = s.shields
      .map((x) => ({ ...x, ttl: x.ttl - 1 }))
      .filter((x) => x.ttl > 0 && x.amount > 0);
    s.chilled = false;
    updateDialogueForOutcome(s);
    s.phase = "CHECK_OUTCOME";
    return s;
  }
  s.result = s.enemyHp === 0 ? "victory" : s.hp === 0 ? "defeat" : null;
  s.phase = "IDLE";
  s.turn = "player";
  s.pending = null;
  s.effect = null;
  return s;
}
export function mastery(s: Game) {
  const ratio = s.rawDamage ? s.penalty / s.rawDamage : 1,
    diversity = ELEMENTS.filter((e) => s.usage[e] > 0).length;
  return diversity === 4 && ratio < 0.15
    ? "S"
    : diversity >= 3 && ratio < 0.25
      ? "A"
      : diversity >= 2 && ratio < 0.4
        ? "B"
        : "C";
}
