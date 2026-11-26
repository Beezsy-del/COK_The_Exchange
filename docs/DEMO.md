# Presentation demo — 3 minutes

## Start before presenting

```sh
npm install
npm run build
npm run preview -- --port 4173
```

Open http://127.0.0.1:4173. Turn the computer volume on. Click **Face Malakor** to enable browser audio. Installed local English voices are used; if none are available, captions remain visible.

## 0:00–0:30 — The idea

“AetherDuel is a local-only game about learning and adaptation. Winning is about changing your habits, not repeating the strongest spell.”

Show the three foes:
- **Malakor** learns repeated elements and raises resistance.
- **GLITCH** hijacks turns and can invert mana costs.
- **The Mirror** learns from completed duels saved on this device.

## 0:30–1:15 — Learning in front of the judges

Choose Malakor. Cast Fire three times, waiting between actions. Explain that each successful cast adds 25 percentage points of resistance, capped at 80%; unused elements lose 10. Status effects can interrupt an action, so check the combat chronicle if a cast is skipped.

Switch to Frost or Earth. Point out the resistance decay and status badges. Open **Inspect the petty brain** to show the rules.

## 1:15–2:00 — Consequences and personality

- Fire: 30% burn chance; 8 damage for two affected turns.
- Frost: 25% freeze chance; skip the next turn.
- Volt: 30% paralysis chance; 50% fizzle chance for two turns.
- Blood meditation: +30 mana, but costs 6 health through shields.
- Shield damage can trigger cracked glass; below 30% health, tunnel vision and a heartbeat appear.

These events use random rolls. Do not promise a particular proc during a live demo.

## 2:00–2:40 — Different opponents

Use **Foes** to show GLITCH and the Mirror. GLITCH checks for hijacks at active turn starts. The Mirror remembers completed-match openings, favorite spells and shield frequency. Unfinished matches do not teach it.

## 2:40–3:00 — Engineering and next steps

“Everything runs locally: original SVG characters, canvas CRT effects, synthesized sound, and local speech voices. Combat uses a deterministic state machine. The test suite covers status timing, boss behavior, state limits, storage failures, and stale animation events.”

Next: more accessible settings, better balance tuning, combo effects and prediction-accuracy charts. See `ROADMAP.md`.

## Fallback

If speech is unavailable, show captions and keep synthesized effects enabled. If development hot reload interrupts anything, use the production preview above. No API key or backend is needed.
