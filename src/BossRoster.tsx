import { useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  Cpu,
  ScanFace,
  Trash2,
  Volume2,
} from "lucide-react";
import { BOSSES, BOSS_IDS, type BossId } from "./bosses";
import Sorcerer from "./Sorcerer";
import { CharacterArt } from "./Characters";
import { defensiveRate, favorite, type Playstyle } from "./playstyle";
export function BossArt({
  bossId,
  defeated = false,
}: {
  bossId: BossId;
  defeated?: boolean;
}) {
  if (bossId === "MALAKOR") return <Sorcerer defeated={defeated} />;
  if (bossId === "MIRROR")
    return (
      <div
        className={`mirror-boss ${defeated ? "dying" : ""}`}
        role="img"
        aria-label={
          defeated
            ? "The Mirror dissolves into shards"
            : "Your silhouette reflected, with glowing eyes and the same staff"
        }
      >
        <div className="echo-reflection">
          <CharacterArt character="iona" />
        </div>
        <i className="mirror-eye left" />
        <i className="mirror-eye right" />
        <span className="mirror-ring" />
      </div>
    );
  return (
    <div
      className={`glitch-boss ${defeated ? "dying" : ""}`}
      role="img"
      aria-label={
        defeated
          ? "GLITCH breaks apart into static"
          : "0xNULL, a corrupted eldritch entity made of shifting glyphs"
      }
    >
      <div className="glitch-head">
        <span>█▓▒░</span>
        <b>[SYS_ERR]</b>
        <i>◉ ▰ ◉</i>
        <strong>NULL</strong>
      </div>
      <div className="glitch-tendrils">
        <i />
        <i />
        <i />
        <i />
      </div>
      <span className="corrupt-code">0x7E ∴ ∅ ▒ ▓ 404</span>
    </div>
  );
}
export default function BossRoster({
  profile,
  onStart,
  onForget,
  storageMessage,
}: {
  profile: Playstyle;
  onStart: (id: BossId) => void;
  onForget: () => void;
  storageMessage: string;
}) {
  const [selected, setSelected] = useState<BossId>("MALAKOR");
  const icons = { MALAKOR: BrainCircuit, GLITCH: Cpu, MIRROR: ScanFace };
  return (
    <section className="boss-roster">
      <div className="roster-intro">
        <span className="chapter">
          Three foes. Three ways to ruin your evening.
        </span>
        <h1>
          Choose your
          <br />
          <em>personal nightmare.</em>
        </h1>
        <p>Same spellbook. Different rules. Find out who learns faster.</p>
      </div>
      <div className="boss-cards">
        {BOSS_IDS.map((id, index) => {
          const b = BOSSES[id],
            Icon = icons[id];
          return (
            <button
              key={id}
              className={`boss-card ${id.toLowerCase()} ${selected === id ? "selected" : ""}`}
              aria-pressed={selected === id}
              onClick={() => setSelected(id)}
              aria-label={`Select ${b.name}, ${b.title}`}
            >
              <div className="boss-card-top">
                <span>ENCOUNTER 0{index + 1}</span>
                <Icon size={20} />
              </div>
              <div className="roster-portrait">
                <BossArt bossId={id} />
              </div>
              <span className="boss-archetype">{b.label}</span>
              <h2>{b.name}</h2>
              <h3>{b.title}</h3>
              <p>{b.description}</p>
              <div className="passive-detail">
                <b>
                  <Icon size={14} />
                  {b.passive}
                </b>
                <span>{b.rule}</span>
              </div>
              <span className="selection-marker">
                {selected === id
                  ? "Selected · enter below"
                  : "Choose this opponent"}
                <ArrowRight size={16} />
              </span>
            </button>
          );
        })}
      </div>
      <div className="roster-bottom">
        <div className="memory-summary">
          <ScanFace size={22} />
          <div>
            <b>
              {profile.matches
                ? `The Mirror remembers ${profile.matches} duel${profile.matches === 1 ? "" : "s"}.`
                : "The Mirror has no memories. Yet."}
            </b>
            <p>
              {profile.matches
                ? `Favorite opening: ${favorite(profile.openings)} · Favorite spell: ${favorite(profile.casts)} · Shield frequency: ${Math.round(defensiveRate(profile) * 100)}%`
                : "Your completed duels teach it how you fight. Saved on this device only."}
            </p>
            {storageMessage && <small>{storageMessage}</small>}
          </div>
          <button
            className="forget-memory"
            onClick={onForget}
            aria-label="Forget my habits"
          >
            <Trash2 size={15} />
            <span>Forget my habits</span>
          </button>
        </div>
        <button className="enter-duel" onClick={() => onStart(selected)}>
          Face {BOSSES[selected].name}
          <ArrowRight size={19} />
        </button>
      </div>
      <p className="voice-footnote">
        <Volume2 size={14} /> Spoken monologues use installed local English
        voices. Captions stay on. No cloud voices or downloads.
      </p>
    </section>
  );
}
