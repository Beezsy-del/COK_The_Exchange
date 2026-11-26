import { useEffect, useState } from "react";
import CRTWarp from "./CRTWarp";
import type { Game } from "./aiEngine";
import {
  playHeartbeat,
  playGlassBreakSound,
  playGlitchSound,
  playStatusSound,
} from "./audio";
import { STATUS_RULES, type StatusSet } from "./statusEffects";
export function StatusBadges({
  statuses,
  label,
}: {
  statuses: StatusSet;
  label: string;
}) {
  return (
    <div className="status-badges" aria-label={`${label} status effects`}>
      {(Object.keys(STATUS_RULES) as (keyof StatusSet)[])
        .filter((type) => statuses[type] > 0)
        .map((type) => (
          <span
            key={type}
            className={`status-badge ${type.toLowerCase()}`}
            title={`${STATUS_RULES[type].label}: ${statuses[type]} affected turns remaining`}
          >
            <span aria-hidden="true">{STATUS_RULES[type].icon}</span>{" "}
            {STATUS_RULES[type].label} <b>{statuses[type]}</b>
          </span>
        ))}
    </div>
  );
}
export function Hellscape() {
  return (
    <div className="hellscape" aria-hidden="true">
      <div style={{ width: "100%", height: "600px", position: "relative" }}>
        <CRTWarp
          color="#f43f5e"
          backgroundColor="#120f17"
          mask="aperture"
          curvature={0.25}
          persistence={0.4}
        />
      </div>
      <svg
        className="magma-cracks"
        viewBox="0 0 1440 700"
        preserveAspectRatio="none"
      >
        <path d="M0 600L170 525 280 540 390 440 440 455 600 350M210 700L280 540 245 470M1440 550L1270 590 1130 480 1020 510 920 420 800 430M1270 590L1230 700M390 440L350 320M1020 510L1060 360" />
      </svg>
    </div>
  );
}
export default function ArenaEffects({
  game,
  muted,
}: {
  game: Game;
  muted: boolean;
}) {
  const low = game.hp > 0 && game.hp < 36 && !game.result;
  const [cracking, setCracking] = useState(false);
  useEffect(() => {
    if (!low || muted) return;
    playHeartbeat();
    const timer = window.setInterval(playHeartbeat, 1150);
    return () => clearInterval(timer);
  }, [low, muted]);
  useEffect(() => {
    if (!game.shieldBreaks) {
      setCracking(false);
      return;
    }
    setCracking(true);
    playGlassBreakSound();
    const timer = window.setTimeout(() => setCracking(false), 3000);
    return () => clearTimeout(timer);
  }, [game.shieldBreaks]);
  useEffect(() => {
    if (game.hijacks) playGlitchSound();
  }, [game.hijacks]);
  const latest = game.notices.at(-1);
  useEffect(() => {
    if (latest && latest.kind !== "HIJACK" && latest.kind !== "TICK")
      playStatusSound(latest.kind);
  }, [latest]);
  return (
    <>
      <div
        className={`tunnel-vision ${low ? "active" : ""}`}
        aria-hidden="true"
      />
      {game.shieldBreaks > 0 && (
        <div
          className={`glass-overlay ${cracking ? "cracking" : "settled"}`}
          key={game.shieldBreaks}
          aria-hidden="true"
        >
          <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
            <g>
              <path d="M0 0L125 95 80 180 165 235 140 320M125 95L210 90 260 145M80 180L0 220M1440 0L1300 110 1360 180 1260 270 1290 370M1300 110L1190 80 1130 140M1360 180L1440 210M0 900L120 810 80 740 180 680M120 810L240 850 280 790M1440 900L1310 805 1345 725 1240 650M1310 805L1195 840 1140 790" />
            </g>
          </svg>
          {cracking && <span>SHIELD SHATTERED</span>}
        </div>
      )}
    </>
  );
}
