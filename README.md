# AetherDuel: The Petty Sorcerer

### Team Name

ChildrenofKhan.com

### Track Number & Name

**Track 2 — Learning & Adaptive Behavior**

### Problem Statement Name

**The Petty Sorcerer**

### Idea

AetherDuel is an elemental dueling game where opponents learn how you play. Repeating spells makes Malakor resistant; GLITCH disrupts your plans; and the Mirror uses your past habits against you. Players win by adapting, balancing risk, and making varied choices.

The game runs locally, with original characters, spoken monologues, elemental status effects, and a reactive molten arena. No account, API key, or backend is required.

### How to Run

**Prerequisites:** Node.js 24 LTS and npm. Internet is needed once to install dependencies; gameplay runs locally afterward.

```sh
git clone https://github.com/Beezsy-del/COK_The_Exchange.git
cd COK_The_Exchange
npm install
npm run dev
```

Open **http://127.0.0.1:5173** (or the local URL printed by Vite).

For a presentation-ready production build:

```sh
npm run build
npm run preview -- --port 4173
```

Open **http://127.0.0.1:4173**.

Run the tests:

```sh
npm test
```

## Controls

- Select a foe, then click **Face…** to begin and unlock audio.
- **1–4:** Fire, Frost, Volt and Earth spells.
- **5:** Blood meditation: restore up to 30 mana, pay 6 health through shields, gain 5 temporary shield. It can defeat you at low health.
- **Foes:** Return to boss selection. **Restart:** Start the current encounter again.
- Click character portraits for reactive banter. Use **Replay monologue** to hear the current boss line.
- Voice uses installed local English speech voices only. If none are available, captions remain visible. Synthesized effects work independently.

## What is included

- Three bosses: adaptive Malakor, turn-hijacking GLITCH, and the habit-learning Mirror.
- Burn, freeze and paralysis for both combatants, with turn-count badges.
- Original SVG characters, local canvas `CRTWarp`, magma cracks and ember particles.
- Low-health tunnel vision and heartbeat; shield-break glass fractures.
- Typewriter speech bubbles and locally synthesized sound effects.
- Match analytics, clean restart, a readable rules popup and responsive layouts.
- 33 automated tests covering combat rules, boss behavior, status timing, deterministic replay, storage failures and stale timers.

## Presentation and project notes

- [Three-minute demo guide](docs/DEMO.md)
- [Current systems and architecture](docs/SYSTEMS.md)
- [Further improvement plan](ROADMAP.md)
- [Verification record](VERIFICATION.md)

The Mirror stores only completed-duel habits in this browser’s local storage. **Forget my habits** clears that game memory. No telemetry or remote voice service is used.
