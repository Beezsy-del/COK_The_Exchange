# AetherDuel systems

## Combat

`src/aiEngine.ts` implements the deterministic reducer:

`IDLE → PLAYER_CASTING → AI_ANALYZING → AI_ACTING → CHECK_OUTCOME → IDLE`

Every animation transition carries its phase, duel epoch and round. Stale events from a previous round or duel are rejected. Random combat outcomes use a seeded generator, separate from audiovisual randomness. Reset is deterministic for the same state and action. HP, mana, shield and damage are bounded.

## Status effects

`src/statusEffects.ts` handles both sides. Effects resolve at the affected character’s turn start. Burn first deals 8 health through shields, then freeze or paralysis may stop the action. Burn lasts two affected turns; freeze skips one; paralysis lasts two, rolling a 50% fizzle chance each time. Successful Fire/Frost/Volt casts have 30%/25%/30% proc chances. Reapplication refreshes duration rather than stacking it. Skipped actions spend no mana. Player shields still age when a boss turn is skipped.

## Bosses

`src/bosses.ts` holds personalities and monologues.

- Malakor adds 25 percentage points of resistance to successful casts, up to 80%; others decay by 10. Damage uses the previous resistance.
- GLITCH rolls a 20% hijack chance at each living, unblocked turn start. It steals a player action or inverts an elemental mana cost into a refund. A hijack during its own turn queues that effect for the next active player action. Blood meditation still pays its health cost.
- The Mirror reads a snapshot of completed local-duel habits. Favorite openings and elements determine attacks; a shield frequency of at least 35% encourages shielding and healing. With no recorded history it uses the current duel’s observed habits.

`src/playstyle.ts` validates and bounds stored data, catches unavailable/corrupt storage, and exposes a clear-memory control. No data leaves the device.

## Rendering and sound

- `BossRoster.tsx`: selection and original boss art.
- `Characters.tsx` / `Sorcerer.tsx`: SVG cast, banter and defeat state.
- `CRTWarp.tsx`: local canvas field, aperture/scanline masks, curvature, persistence and embers; capped pixel ratio; animation cleanup and reduced-motion support.
- `ArenaEffects.tsx`: status badges, low-health tunnel/heartbeat and shield-break overlay. Shield expiration does not count as breakage.
- `monologues.tsx`: typewriter bubbles and Web Speech synthesis, filtered to installed local English voices only; captions always remain available.
- `audio.ts`: synthesized spell, status, glitch, glass, heartbeat and outcome sounds. A master gain mutes effects without queuing stale sounds for later playback.

The requested component API is used directly:

```tsx
import CRTWarp from "./CRTWarp";

<div style={{ width: "100%", height: "600px", position: "relative" }}>
  <CRTWarp
    color="#f43f5e"
    backgroundColor="#120f17"
    mask="aperture"
    curvature={0.25}
    persistence={0.4}
  />
</div>;
```

This is an original local implementation compatible with those props, not a downloaded ReactBits asset.

## Commands

- `npm run dev`: local development server.
- `npm run build`: TypeScript check and production bundle.
- `npm run preview`: serve the built game locally.
- `npm test`: run all combat, status and persistence tests.

Known platform limitation: spoken monologues require an installed local English voice exposed by the browser. Unsupported systems use captions and synthesized sound effects; no remote fallback is contacted.
