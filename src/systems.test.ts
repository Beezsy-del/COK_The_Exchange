import { describe, it, expect, vi, afterEach } from "vitest";
import {
  beginStatusTurn,
  emptyStatuses,
  inflict,
  procStatus,
} from "./statusEffects";
import {
  initialGame,
  reducer,
  canAfford,
  type Game,
  type Spell,
} from "./aiEngine";
import { BOSS_IDS } from "./bosses";
import {
  emptyPlaystyle,
  validatePlaystyle,
  recordMatch,
  readPlaystyle,
  savePlaystyle,
  forgetPlaystyle,
  MEMORY_KEY,
} from "./playstyle";
const step = (s: Game) => reducer(s, { type: "STEP", phase: s.phase });
const turn = (s: Game, spell: Spell) => {
  let next = reducer(s, { type: "CAST", spell });
  for (let i = 0; i < 4; i++) next = step(next);
  return next;
};
afterEach(() => vi.unstubAllGlobals());
describe("Status contracts", () => {
  it("uses exact proc boundaries and never procs Earth", () => {
    expect(procStatus("FIRE", () => 0.299)).toBe("BURN");
    expect(procStatus("FIRE", () => 0.3)).toBeNull();
    expect(procStatus("FROST", () => 0.249)).toBe("FREEZE");
    expect(procStatus("FROST", () => 0.25)).toBeNull();
    expect(procStatus("VOLT", () => 0.299)).toBe("PARALYZE");
    expect(procStatus("VOLT", () => 0.3)).toBeNull();
    const random = vi.fn(() => 0);
    expect(procStatus("EARTH", random)).toBeNull();
    expect(random).not.toHaveBeenCalled();
  });
  it("burn ticks exactly twice, including a frozen turn", () => {
    let s = inflict(inflict(emptyStatuses(), "BURN"), "FREEZE");
    const first = beginStatusTurn(s, () => 1);
    expect(first.burnDamage).toBe(8);
    expect(first.skip).toBe(true);
    expect(first.statuses).toEqual({ BURN: 1, FREEZE: 0, PARALYZE: 0 });
    const second = beginStatusTurn(first.statuses, () => 1);
    expect(second.burnDamage).toBe(8);
    expect(second.skip).toBe(false);
    expect(beginStatusTurn(second.statuses, () => 0).burnDamage).toBe(0);
  });
  it("paralysis rolls once per affected turn and refreshes instead of stacking", () => {
    let s = inflict(emptyStatuses(), "PARALYZE");
    expect(beginStatusTurn(s, () => 0.499).skip).toBe(true);
    const next = beginStatusTurn(s, () => 0.5);
    expect(next.skip).toBe(false);
    expect(next.statuses.PARALYZE).toBe(1);
    expect(inflict(next.statuses, "PARALYZE").PARALYZE).toBe(2);
    expect(beginStatusTurn(next.statuses, () => 1).statuses.PARALYZE).toBe(0);
  });
  it("frozen player spends no mana, cannot attack or meditate, but burn still ticks", () => {
    for (const spell of ["FIRE", "REST"] as Spell[]) {
      const before = {
        ...initialGame(1),
        playerStatuses: { BURN: 2, FREEZE: 1, PARALYZE: 0 },
      };
      const after = step(reducer(before, { type: "CAST", spell }));
      expect(after.hp).toBe(112);
      expect(after.mana).toBe(100);
      expect(after.enemyHp).toBe(240);
      expect(after.bloodPrice).toBe(0);
      expect(after.playerStatuses).toEqual({ BURN: 1, FREEZE: 0, PARALYZE: 0 });
    }
  });
  it("frozen boss skips the entire action and shields still expire", () => {
    let s = {
      ...initialGame(1),
      phase: "AI_ACTING" as const,
      turn: "ai" as const,
      bossStatuses: { BURN: 0, FREEZE: 1, PARALYZE: 0 },
      shields: [{ amount: 20, ttl: 1 }],
    };
    const after = step(s);
    expect(after.hp).toBe(120);
    expect(after.bossStatuses.FREEZE).toBe(0);
    expect(after.shields).toEqual([]);
    expect(after.shieldBreaks).toBe(0);
  });
  it("burn can finish either combatant before its action and bypasses shields", () => {
    const player = turn(
      {
        ...initialGame(1),
        hp: 8,
        shields: [{ amount: 50, ttl: 2 }],
        playerStatuses: { BURN: 1, FREEZE: 0, PARALYZE: 0 },
      },
      "FIRE",
    );
    expect(player.result).toBe("defeat");
    expect(player.mana).toBe(100);
    expect(player.shieldBreaks).toBe(0);
    const enemy = step({
      ...initialGame(1),
      enemyHp: 8,
      enemyShield: 50,
      bossStatuses: { BURN: 1, FREEZE: 0, PARALYZE: 0 },
      phase: "AI_ACTING",
      turn: "ai",
    });
    expect(enemy.enemyHp).toBe(0);
    expect(enemy.hp).toBe(120);
    expect(step(enemy).result).toBe("victory");
  });
  it("a physical shield break fires exactly once and expiry never fires it", () => {
    const s = {
      ...initialGame(1),
      phase: "AI_ACTING" as const,
      turn: "ai" as const,
      shields: [{ amount: 1, ttl: 2 }],
    };
    const hit = step(s);
    expect(hit.shieldBreaks).toBe(1);
    expect(step({ ...hit, phase: "AI_ACTING" }).shieldBreaks).toBe(1);
  });
});
describe("Boss passives", () => {
  it("queued theft consumes a player action without charging any mana", () => {
    const s = { ...initialGame(1, "GLITCH"), nextHijack: "STEAL" as const };
    const after = step(reducer(s, { type: "CAST", spell: "FIRE" }));
    expect(after.mana).toBe(100);
    expect(after.usage.FIRE).toBe(0);
    expect(after.nextHijack).toBeNull();
    expect(after.enemyHp).toBe(240);
  });
  it("queued cost inversion permits zero-mana casts and expires after one action", () => {
    const s = {
      ...initialGame(1, "GLITCH"),
      mana: 0,
      nextHijack: "INVERT" as const,
    };
    expect(canAfford(s, "FIRE")).toBe(true);
    const after = step(reducer(s, { type: "CAST", spell: "FIRE" }));
    expect(after.mana).toBe(20);
    expect(after.enemyHp).toBeLessThan(240);
    expect(after.nextHijack).toBeNull();
  });
  it("GLITCH can roll either hijack outcome from deterministic seeds", () => {
    const modes = new Set<string>();
    for (let seed = 1; seed < 3000; seed++) {
      const after = step(
        reducer(initialGame(seed, "GLITCH"), { type: "CAST", spell: "FIRE" }),
      );
      if (after.hijacks) modes.add(after.inverted ? "INVERT" : "STEAL");
      if (modes.size === 2) break;
    }
    expect([...modes].sort()).toEqual(["INVERT", "STEAL"]);
  });
  it("only Malakor builds elemental resistance", () => {
    for (const id of BOSS_IDS) {
      const after = step(
        reducer(initialGame(1, id), { type: "CAST", spell: "EARTH" }),
      );
      expect(after.memory.currentResistances.EARTH).toBe(
        id === "MALAKOR" ? 25 : 0,
      );
    }
  });
  it("Mirror uses historical opening moves and defensive habits", () => {
    const profile = emptyPlaystyle();
    profile.matches = 1;
    profile.actions = 10;
    profile.openings.VOLT = 1;
    profile.casts.FIRE = 9;
    let after = turn(initialGame(1, "MIRROR", profile), "EARTH");
    expect(after.log.some((x) => x.includes("Echo: Chain Surge"))).toBe(true);
    profile.shieldCasts = 6;
    after = turn({ ...initialGame(1, "MIRROR", profile), round: 1 }, "EARTH");
    expect(after.enemyShield).toBe(16);
    expect(after.log.some((x) => x.includes("Reflected Bulwark"))).toBe(true);
  });
  it("replays seeded encounters identically and keeps resources bounded for all bosses", () => {
    for (const id of BOSS_IDS)
      for (let seed = 1; seed <= 100; seed++) {
        let a = initialGame(seed, id),
          b = initialGame(seed, id);
        const sequence: Spell[] = ["EARTH", "FIRE", "VOLT", "FROST", "REST"];
        for (let i = 0; i < 120 && !a.result; i++) {
          const spell = canAfford(a, sequence[i % 5])
            ? sequence[i % 5]
            : "REST";
          a = turn(a, spell);
          b = turn(b, spell);
          expect(a).toEqual(b);
          expect(a.hp).toBeGreaterThanOrEqual(0);
          expect(a.hp).toBeLessThanOrEqual(120);
          expect(a.mana).toBeGreaterThanOrEqual(0);
          expect(a.mana).toBeLessThanOrEqual(100);
          expect(a.enemyHp).toBeGreaterThanOrEqual(0);
          expect(a.enemyHp).toBeLessThanOrEqual(240);
          for (const status of Object.values(a.playerStatuses))
            expect(status).toBeGreaterThanOrEqual(0);
        }
        expect(a.result).not.toBeNull();
      }
  });
});
describe("Private local memory", () => {
  it("records successful elemental actions, openings, shield frequency and completed matches", () => {
    const p = recordMatch(emptyPlaystyle(), {
      usage: { FIRE: 2, FROST: 1, VOLT: 0, EARTH: 3 },
      opening: "FROST",
      round: 9,
    });
    expect(p.matches).toBe(1);
    expect(p.openings.FROST).toBe(1);
    expect(p.casts.FIRE).toBe(2);
    expect(p.shieldCasts).toBe(3);
    expect(p.actions).toBe(9);
  });
  it("rejects wrong schemas and sanitizes hostile numbers", () => {
    expect(validatePlaystyle({ version: 99 })).toEqual(emptyPlaystyle());
    const p = validatePlaystyle({
      version: 1,
      matches: Infinity,
      actions: 5,
      shieldCasts: 999,
      casts: { FIRE: -10, FROST: 1e20, VOLT: "bad", EARTH: NaN },
    });
    expect(p.matches).toBe(0);
    expect(p.shieldCasts).toBe(5);
    expect(p.casts).toEqual({ FIRE: 0, FROST: 1000000, VOLT: 0, EARTH: 0 });
  });
  it("survives corrupt or blocked storage and can forget memory", () => {
    const removeItem = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: () => "{bad",
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem,
    });
    expect(readPlaystyle()).toEqual(emptyPlaystyle());
    expect(savePlaystyle(emptyPlaystyle())).toBe(false);
    expect(forgetPlaystyle()).toBe(true);
    expect(removeItem).toHaveBeenCalledWith(MEMORY_KEY);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    });
    expect(readPlaystyle()).toEqual(emptyPlaystyle());
    expect(forgetPlaystyle()).toBe(false);
  });
});

describe("Animation generation guards", () => {
  it("rejects an old duel timer even when a new duel reaches the same phase", () => {
    const old = reducer(initialGame(1), { type: "CAST", spell: "EARTH" });
    const fresh = reducer(reducer(old, { type: "RESET", seed: 2 }), {
      type: "CAST",
      spell: "EARTH",
    });
    expect(fresh.phase).toBe(old.phase);
    expect(
      reducer(fresh, {
        type: "STEP",
        phase: old.phase,
        epoch: old.epoch,
        round: old.round,
      }),
    ).toBe(fresh);
    expect(
      reducer(fresh, {
        type: "STEP",
        phase: fresh.phase,
        epoch: fresh.epoch,
        round: fresh.round,
      }).phase,
    ).toBe("AI_ANALYZING");
  });
  it("reset is deterministic for the same state and action", () => {
    const s = initialGame(31);
    expect(reducer(s, { type: "RESET" })).toEqual(
      reducer(s, { type: "RESET" }),
    );
  });
});
