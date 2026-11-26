import { describe, it, expect } from "vitest";
import { emptyStatuses } from "./statusEffects";
import {
  initialGame,
  reducer,
  adapt,
  shieldTotal,
  ELEMENTS,
  SPELLS,
  type Game,
  type Spell,
} from "./aiEngine";
const step = (s: Game) => reducer(s, { type: "STEP", phase: s.phase });
const turn = (s: Game, spell: Spell) => {
  let next = reducer(s, { type: "CAST", spell });
  for (let i = 0; i < 4; i++) next = step(next);
  return next;
};
describe("Combat rules", () => {
  it("enforces phase order and ignores stale steps and repeated casts", () => {
    let s = initialGame(1);
    s = reducer(s, { type: "CAST", spell: "FIRE" });
    expect(s.phase).toBe("PLAYER_CASTING");
    expect(reducer(s, { type: "CAST", spell: "VOLT" })).toBe(s);
    expect(reducer(s, { type: "STEP", phase: "AI_ACTING" })).toBe(s);
    for (const phase of [
      "AI_ANALYZING",
      "AI_ACTING",
      "CHECK_OUTCOME",
      "IDLE",
    ]) {
      s = step(s);
      expect(s.phase).toBe(phase);
    }
    expect(s.turn).toBe("player");
  });
  it("learns Fire spam to 75%, caps at 80%, and decays others", () => {
    let m = initialGame().memory;
    for (let i = 0; i < 3; i++) m = adapt(m, "FIRE");
    expect(m.currentResistances.FIRE).toBe(75);
    m = adapt(m, "FIRE");
    expect(m.currentResistances.FIRE).toBe(80);
    m = adapt(m, "FROST");
    expect(m.currentResistances).toEqual({
      FIRE: 70,
      FROST: 25,
      VOLT: 0,
      EARTH: 0,
    });
  });
  it("retains only ten elemental spells and exact window counts", () => {
    let m = initialGame().memory;
    for (let i = 0; i < 12; i++) m = adapt(m, i < 2 ? "FIRE" : "EARTH");
    expect(m.history).toHaveLength(10);
    expect(m.counts).toEqual({ FIRE: 0, FROST: 0, VOLT: 0, EARTH: 10 });
    m = adapt(m, "REST");
    expect(m.history).toHaveLength(10);
    expect(m.currentResistances.EARTH).toBe(70);
  });
  it("uses pre-cast resistance and triggers fire dialogue", () => {
    let s = turn(initialGame(2), "FIRE");
    expect(s.penalty).toBe(0);
    s = turn({ ...s, seed: 1, playerStatuses: emptyStatuses() }, "FIRE");
    expect(s.dialogue).toContain("Fire again?");
    expect(s.penalty).toBeGreaterThan(0);
    s = turn({ ...s, seed: 1, playerStatuses: emptyStatuses() }, "FIRE");
    expect(s.memory.currentResistances.FIRE).toBe(75);
    expect(s.log.some((x) => x.includes("Frost Lance"))).toBe(true);
  });
  it("all four spells cause damage within their range and spend mana", () => {
    for (const e of ELEMENTS) {
      const s = step(reducer(initialGame(1), { type: "CAST", spell: e }));
      expect(s.enemyHp).toBeLessThan(240);
      expect(s.mana).toBe(100 - SPELLS[e].cost);
      expect(240 - s.enemyHp).toBeGreaterThanOrEqual(SPELLS[e].min);
      expect(240 - s.enemyHp).toBeLessThanOrEqual(
        e === "VOLT" ? 57 : SPELLS[e].max,
      );
    }
  });
  it("rejects unaffordable spells and caps meditation", () => {
    const s = { ...initialGame(), mana: 0 };
    expect(reducer(s, { type: "CAST", spell: "FIRE" })).toBe(s);
    expect(turn(s, "REST").mana).toBe(30);
    expect(turn(initialGame(), "REST").mana).toBe(100);
  });
  it("expires shield grants independently after two enemy turns", () => {
    let s = turn(initialGame(1), "EARTH");
    expect(shieldTotal(s)).toBeGreaterThan(0);
    expect(s.shields[0].ttl).toBe(1);
    s = turn(s, "FROST");
    expect(s.shields).toEqual([]);
  });
  it("chill reduces the next enemy attack by 20%", () => {
    const base = initialGame(8);
    let frost = step(reducer(base, { type: "CAST", spell: "FROST" }));
    frost = { ...frost, bossStatuses: emptyStatuses() };
    let plain = { ...frost, chilled: false };
    frost = step(step(frost));
    plain = step(step(plain));
    expect(120 - frost.hp).toBe(Math.round((120 - plain.hp) * 0.8));
  });
  it("dead enemies cannot retaliate and terminal state rejects actions", () => {
    let s = turn({ ...initialGame(1), enemyHp: 1 }, "FIRE");
    expect(s.result).toBe("victory");
    expect(s.hp).toBe(120);
    expect(reducer(s, { type: "CAST", spell: "FIRE" })).toBe(s);
    expect(reducer(s, { type: "RESET", seed: 1 })).toEqual({
      ...initialGame(1),
      epoch: 1,
    });
  });
  it("resolves defeat and bounds every resource across 100 seeded matches", () => {
    let defeats = 0;
    for (let seed = 1; seed <= 100; seed++) {
      let s = initialGame(seed);
      for (let i = 0; i < 100 && !s.result; i++) {
        const element = ELEMENTS[(i * seed + seed) % 4];
        s = turn(s, s.mana >= SPELLS[element].cost ? element : "REST");
        expect(s.hp).toBeGreaterThanOrEqual(0);
        expect(s.hp).toBeLessThanOrEqual(120);
        expect(s.enemyHp).toBeGreaterThanOrEqual(0);
        expect(s.enemyHp).toBeLessThanOrEqual(240);
        expect(s.mana).toBeGreaterThanOrEqual(0);
        expect(s.mana).toBeLessThanOrEqual(100);
        expect(shieldTotal(s)).toBeLessThanOrEqual(100);
      }
      if (s.result === "defeat") defeats++;
      expect(s.result).not.toBeNull();
    }
    expect(defeats).toBeGreaterThan(0);
  });
  it("permits a varied defensive strategy to win", () => {
    let wins = 0;
    for (let seed = 1; seed <= 30; seed++) {
      let s = initialGame(seed);
      const sequence: Spell[] = ["EARTH", "FIRE", "VOLT", "FROST", "REST"];
      for (let i = 0; i < 100 && !s.result; i++) {
        let spell = sequence[i % sequence.length];
        if (spell !== "REST" && s.mana < SPELLS[spell].cost) spell = "REST";
        s = turn(s, spell);
      }
      if (s.result === "victory") wins++;
    }
    expect(wins).toBeGreaterThan(0);
  });
});

describe("Blood meditation", () => {
  it("charges six health through shields while restoring mana", () => {
    const before = {
      ...initialGame(1),
      mana: 20,
      shields: [{ amount: 20, ttl: 2 }],
    };
    const after = step(reducer(before, { type: "CAST", spell: "REST" }));
    expect(after.hp).toBe(114);
    expect(after.mana).toBe(50);
    expect(after.bloodPrice).toBe(6);
    expect(shieldTotal(after)).toBe(25);
    expect(after.effect?.text).toBe("+30 MANA / −6 HP");
    expect(before.hp).toBe(120);
  });
  it("caps restoration and reports the amount actually gained", () => {
    const after = step(
      reducer({ ...initialGame(1), mana: 95 }, { type: "CAST", spell: "REST" }),
    );
    expect(after.mana).toBe(100);
    expect(after.effect?.text).toBe("+5 MANA / −6 HP");
  });
  it("resolves lethal meditation without a posthumous enemy attack", () => {
    const after = turn({ ...initialGame(1), hp: 4, mana: 0 }, "REST");
    expect(after.result).toBe("defeat");
    expect(after.hp).toBe(0);
    expect(after.bloodPrice).toBe(4);
    expect(after.log.some((line) => line.startsWith("Malakor uses"))).toBe(
      false,
    );
    expect(reducer(after, { type: "CAST", spell: "REST" })).toBe(after);
    expect(reducer(after, { type: "RESET", seed: 1 }).bloodPrice).toBe(0);
  });
  it("keeps fatal hits locked until all outcome phases finish", () => {
    let state = step(
      reducer(
        { ...initialGame(1), enemyHp: 1 },
        { type: "CAST", spell: "FIRE" },
      ),
    );
    expect(state.enemyHp).toBe(0);
    expect(state.result).toBeNull();
    expect(state.turn).toBe("ai");
    for (let i = 0; i < 2; i++) {
      expect(reducer(state, { type: "CAST", spell: "FIRE" })).toBe(state);
      state = step(state);
    }
    expect(state.phase).toBe("CHECK_OUTCOME");
    expect(state.hp).toBe(120);
    expect(step(state).result).toBe("victory");
  });
});
