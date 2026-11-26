# Further improvements

## Next priority — polish and verify

- Run full browser encounter tests for every boss across Chromium, Firefox and Safari, including victory, defeat, replay and foe switching.
- Measure playtest win rates and tune boss damage, status frequency and Mirror defense against real players.
- Add separate controls for speech, effects, heartbeat, CRT intensity and reduced motion.
- Strengthen accessibility with a dedicated combat event summary and a full keyboard/screen-reader audit.
- Improve status and death choreography on narrow screens without hiding important action text.

## Learning and adaptation

- Show prediction accuracy over time: predicted next spell versus actual next spell.
- Add sequence-based prediction, not just element frequency.
- Display the Mirror’s learned profile and explain the move it chose.
- Add profile export/import and explicit per-boss learning resets.

## Combat depth

- Elemental combos: wet + lightning, chilled + earth shatter, and controlled burn interactions.
- Add two new spells with meaningful resource tradeoffs.
- Difficulty presets and a seeded challenge mode for fair comparisons.
- Add a short tutorial encounter with guaranteed example status effects.

## Presentation and quality

- Add CI browser smoke tests and automated visual regression checks.
- Profile canvas rendering on low-end phones and introduce an effects-quality setting.
- Explore a bundled offline speech option if the asset constraint is relaxed; keep local system voices as the lightweight default.
- Add a replay viewer driven by the existing deterministic seed and action log.

No external accounts, cloud voices, analytics or backend services are planned by default.
