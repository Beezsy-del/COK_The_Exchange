import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  Flame,
  Snowflake,
  Zap,
  Mountain,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  BrainCircuit,
  ScanEye,
  ChevronRight,
  Swords,
  BookOpen,
  X,
  Heart,
  Droplets,
  Crown,
  ArrowUpRight,
  CircleHelp,
  ScanFace,
} from "lucide-react";
import {
  ELEMENTS,
  SPELLS,
  initialGame,
  reducer,
  shieldTotal,
  mastery,
  MEDITATE_HEALTH_COST,
  DEFEAT_ANIMATION_MS,
  type Spell,
  canAfford,
} from "./aiEngine";
import {
  playSpellSound,
  playHitSound,
  playCritSound,
  playVictorySound,
  playDefeatSound,
  setAudioEnabled,
  unlockAudio,
} from "./audio";
import BossRoster, { BossArt } from "./BossRoster";
import { BOSSES, type BossId } from "./bosses";
import {
  readPlaystyle,
  recordMatch,
  savePlaystyle,
  forgetPlaystyle,
  emptyPlaystyle,
} from "./playstyle";
import ArenaEffects, { Hellscape, StatusBadges } from "./ArenaEffects";
import { SpeechBubble, useLocalMonologue, stopMonologue } from "./monologues";
import { ArenaCharacters, Ringside } from "./Characters";
const ICONS = { FIRE: Flame, FROST: Snowflake, VOLT: Zap, EARTH: Mountain };
const LABELS = { FIRE: "Fire", FROST: "Frost", VOLT: "Volt", EARTH: "Earth" };
const DELAYS = {
  IDLE: 0,
  PLAYER_CASTING: 450,
  AI_ANALYZING: 650,
  AI_ACTING: 650,
  CHECK_OUTCOME: 550,
};
function Meter({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  return (
    <div
      className={`meter ${color}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span className="drain" style={{ width: `${(value / max) * 100}%` }} />
      <span style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}
function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return (
    <dialog ref={ref} onCancel={onClose} className="modal" aria-label={title}>
      <button
        className="icon-button close"
        onClick={onClose}
        aria-label="Close dialog"
      >
        <X size={20} />
      </button>
      {children}
    </dialog>
  );
}
export default function App() {
  const [game, dispatch] = useReducer(reducer, undefined, () => initialGame());
  const [muted, setMuted] = useState(false);
  const [inBattle, setInBattle] = useState(false);
  const [profile, setProfile] = useState(readPlaystyle);
  const [storageMessage, setStorageMessage] = useState("");
  const [duelKey, setDuelKey] = useState(0);
  const savedMatch = useRef<typeof game | null>(null);
  const boss = BOSSES[game.bossId];
  const { replay, voiceStatus } = useLocalMonologue(
    game.dialogue,
    game.bossId,
    muted,
    inBattle,
  );
  useEffect(() => {
    if (!inBattle || !game.result || savedMatch.current === game) return;
    savedMatch.current = game;
    const next = recordMatch(profile, game);
    setProfile(next);
    setStorageMessage(
      savePlaystyle(next)
        ? "Habits saved on this device."
        : "Storage unavailable. Habits remain in this session only.",
    );
  }, [game, inBattle, profile]);
  const [inspect, setInspect] = useState(false);
  const [resultOpen, setResultOpen] = useState(true);
  const locked =
    !inBattle ||
    game.turn !== "player" ||
    game.phase !== "IDLE" ||
    !!game.result;
  useEffect(() => {
    if (game.phase === "IDLE") return;
    const timer = window.setTimeout(
      () =>
        dispatch({
          type: "STEP",
          phase: game.phase,
          epoch: game.epoch,
          round: game.round,
        }),
      game.phase === "CHECK_OUTCOME" && game.enemyHp === 0
        ? DEFEAT_ANIMATION_MS
        : DELAYS[game.phase],
    );
    return () => window.clearTimeout(timer);
  }, [game.phase, game.enemyHp, game.epoch, game.round]);
  useEffect(() => {
    if (game.effect) {
      if (game.effect.heavy) playCritSound();
      else playHitSound();
    }
  }, [game.effect]);
  useEffect(() => {
    if (game.result === "victory") playVictorySound();
  }, [game.result]);
  useEffect(() => {
    if (game.enemyHp === 0) playDefeatSound();
  }, [game.enemyHp]);
  const cast = useCallback(
    (spell: Spell) => {
      if (locked || inspect) return;
      if (!canAfford(game, spell)) return;
      unlockAudio();
      playSpellSound(spell);
      dispatch({ type: "CAST", spell });
    },
    [locked, inspect, game],
  );
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        inspect ||
        game.result
      )
        return;
      const key = Number(event.key);
      if (key >= 1 && key <= 5) {
        event.preventDefault();
        cast(key === 5 ? "REST" : ELEMENTS[key - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cast, inspect, game.result]);
  const reset = () => {
    stopMonologue();
    dispatch({ type: "RESET", echo: profile });
    setDuelKey((key) => key + 1);
    setResultOpen(true);
  };
  const startDuel = (bossId: BossId) => {
    unlockAudio();
    stopMonologue();
    dispatch({ type: "RESET", bossId, echo: profile });
    setDuelKey((key) => key + 1);
    setResultOpen(true);
    setInBattle(true);
  };
  const chooseFoe = () => {
    reset();
    setInBattle(false);
  };
  const clearHabits = () => {
    setProfile(emptyPlaystyle());
    setStorageMessage(
      forgetPlaystyle()
        ? "The Mirror’s memory has been erased."
        : "Could not clear browser storage. Session memory cleared.",
    );
  };
  const playerLine =
    game.hp === 0
      ? "A lesson. A very painful lesson."
      : game.enemyHp === 0
        ? "You should have learned to listen."
        : game.playerStatuses.FREEZE
          ? "Can’t move… need to thaw out!"
          : game.playerStatuses.BURN
            ? "My sleeves! My very flammable sleeves!"
            : game.playerStatuses.PARALYZE
              ? "Come on, hands. Work with me."
              : game.hp < 36
                ? "Breathe. One spell at a time."
                : game.effect?.target === "enemy" && game.effect.heavy
                  ? "Now THAT is a spell!"
                  : "Four elements. No predictable mistakes.";
  const total = ELEMENTS.reduce((n, e) => n + game.usage[e], 0);
  return (
    <div className="app min-h-screen bg-slate-950 text-slate-200">
      <Hellscape />
      {inBattle && <ArenaEffects key={duelKey} game={game} muted={muted} />}
      <header className="header">
        <a className="brand" href="#" aria-label="AetherDuel home">
          <div className="brand-icon">
            <Swords size={22} />
          </div>
          <div>
            AETHER<span>DUEL</span>
            <small>The Petty Sorcerer</small>
          </div>
        </a>
        <div className="header-right">
          <span className="local-label">
            <i /> Local play · No two duels alike
          </span>
          <button
            className="icon-button"
            onClick={() => {
              setAudioEnabled(muted);
              setMuted(!muted);
              if (muted) unlockAudio();
            }}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          {inBattle && (
            <button
              className="help-button"
              onClick={chooseFoe}
              aria-label="Choose another foe"
            >
              <ScanFace size={17} />
              <span>Foes</span>
            </button>
          )}
          <button
            className="icon-button"
            disabled={!inBattle}
            onClick={reset}
            aria-label="Restart duel"
          >
            <RotateCcw size={18} />
          </button>
          <button
            className="help-button"
            aria-label="How to play"
            onClick={() => setInspect(true)}
          >
            <CircleHelp size={17} />
            <span>How to play</span>
          </button>
        </div>
      </header>
      <main className="main">
        {!inBattle ? (
          <BossRoster
            profile={profile}
            onStart={startDuel}
            onForget={clearHabits}
            storageMessage={storageMessage}
          />
        ) : (
          <>
            <div className="intro">
              <div>
                <div className="chapter">
                  <span /> A duel. An ego. A very bad attitude.
                </div>
                <h1>
                  Make magic.
                  <br />
                  <em>Make him mad.</em>
                </h1>
                <p>
                  A sorcerer who remembers. A spellbook worth using. An audience
                  hoping you both embarrass yourselves.
                </p>
              </div>
              <div className="match-label">
                <span className="live-dot" />{" "}
                {game.result ? "DUEL COMPLETE" : "DUEL IN PROGRESS"}{" "}
                <small>Apprentice trial / 01</small>
              </div>
            </div>
            <div className="game-grid">
              <section className="battle-column" aria-label="Battle arena">
                <div
                  className={`arena ${game.effect?.heavy ? "shake" : ""} ${game.bossId.toLowerCase()} ${game.playerStatuses.FREEZE ? "player-frozen" : ""}`}
                >
                  <div className="arena-noise" />
                  <div className="arena-top">
                    <span>
                      <span className="live-dot" /> THE OBSIDIAN SANCTUM
                    </span>
                    <span>
                      TURN{" "}
                      <b>
                        {String(
                          game.round +
                            (!game.result && game.phase === "IDLE" ? 1 : 0),
                        ).padStart(2, "0")}
                      </b>
                    </span>
                  </div>
                  <div
                    className={`enemy-status ${game.bossStatuses.BURN ? "burning-health" : ""}`}
                  >
                    <div className="enemy-heading">
                      <span className="boss-icon">
                        <Crown size={18} />
                      </span>
                      <div>
                        <h2>{boss.name}</h2>
                        <span>{boss.title}</span>
                      </div>
                      <span className="level">LV. ??</span>
                    </div>
                    <div className="hp-label">
                      <span>
                        <Heart size={12} /> VITALITY
                      </span>
                      <b>
                        {game.enemyHp} <span>/ 240</span>
                      </b>
                    </div>
                    <Meter
                      value={game.enemyHp}
                      max={240}
                      color="enemy"
                      label={`${boss.name} health`}
                    />
                    <StatusBadges
                      statuses={game.bossStatuses}
                      label={boss.name}
                    />
                    {game.enemyShield > 0 && (
                      <span className="enemy-shield">
                        <Shield size={12} />
                        {game.enemyShield} shield
                      </span>
                    )}
                  </div>
                  <div
                    className={`stage ${game.enemyHp === 0 ? "mage-defeated" : ""} ${game.bossStatuses.FREEZE ? "frozen-boss" : ""} ${game.bossStatuses.PARALYZE ? "paralyzed-boss" : ""}`}
                  >
                    <div className="rune-halo">
                      <div />
                      <span>✧</span>
                    </div>
                    <div className="stage-floor" />
                    <div className="sanctum-arches" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </div>
                    <div className="brazier brazier-left" aria-hidden="true">
                      <i />
                    </div>
                    <div className="brazier brazier-right" aria-hidden="true">
                      <i />
                    </div>
                    <BossArt
                      bossId={game.bossId}
                      defeated={game.enemyHp === 0}
                    />
                    <SpeechBubble
                      text={game.dialogue}
                      name={boss.name}
                      replay={replay}
                      voiceStatus={voiceStatus}
                    />
                    <SpeechBubble text={playerLine} name="Iona" side="player" />
                    <ArenaCharacters game={game} />
                    {game.enemyHp === 0 && (
                      <div className="death-burst" aria-hidden="true">
                        {Array.from({ length: 12 }, (_, i) => (
                          <i
                            key={i}
                            style={{ "--particle": i } as React.CSSProperties}
                          />
                        ))}
                      </div>
                    )}
                    <div className="rune rune-one">⟡</div>
                    <div className="rune rune-two">✧</div>
                    <div className="rune rune-three">⟡</div>
                    {game.phase === "PLAYER_CASTING" && (
                      <div
                        className={`projectile ${game.pending?.toLowerCase()}`}
                      />
                    )}
                    <div className="boss-title">
                      {game.enemyHp === 0
                        ? "Ego shattered. Robes ruined."
                        : `${boss.name} · ${boss.title}`}
                    </div>
                  </div>
                  {game.hijacks > 0 && (
                    <div
                      key={`hijack-${game.hijacks}`}
                      className="glitch-interference"
                      aria-hidden="true"
                    />
                  )}
                  <div className="status-notices" aria-live="polite">
                    {game.notices.map((n) => (
                      <span
                        key={n.id}
                        className={`status-notice ${n.target} ${n.kind.toLowerCase()}`}
                      >
                        {n.text}
                      </span>
                    ))}
                  </div>
                  {game.effect && (
                    <div
                      key={`${game.round}-${game.phase}`}
                      className={`impact ${game.effect.element.toLowerCase()}`}
                    >
                      <span className={`floating ${game.effect.target}`}>
                        {game.effect.text}
                      </span>
                    </div>
                  )}
                  <div className="dialogue" aria-live="polite">
                    <span className="quote-mark">“</span>
                    <div>
                      <span>{boss.name.toUpperCase()}</span>
                      <p>“{game.dialogue}”</p>
                    </div>
                    <span className="dialogue-dots">•••</span>
                  </div>
                  <Ringside game={game} />
                  <div className="player-strip">
                    <div className="player-identity">
                      <div className="apprentice-icon">
                        <Sparkles size={23} />
                      </div>
                      <div>
                        <strong>Iona · You</strong>
                        <span>Elemental apprentice</span>
                      </div>
                    </div>
                    <div className="player-resource">
                      <div>
                        <span>
                          <Heart size={13} /> Health
                        </span>
                        <b>
                          {game.hp}
                          <small> / 120</small>
                        </b>
                      </div>
                      <Meter
                        value={game.hp}
                        max={120}
                        color="health"
                        label="Player health"
                      />
                      <StatusBadges
                        statuses={game.playerStatuses}
                        label="Iona"
                      />
                    </div>
                    <div className="player-resource">
                      <div>
                        <span>
                          <Droplets size={13} /> Mana
                        </span>
                        <b>
                          {game.mana}
                          <small> / 100</small>
                        </b>
                      </div>
                      <Meter
                        value={game.mana}
                        max={100}
                        color="mana"
                        label="Player mana"
                      />
                    </div>
                    <div className="shield-readout">
                      <Shield size={18} />
                      <b>{shieldTotal(game)}</b>
                      <span>Shield</span>
                    </div>
                  </div>
                </div>
                <div className="spell-heading">
                  <div>
                    <span className={`status-dot ${locked ? "busy" : ""}`} />
                    <strong aria-live="polite">
                      {game.enemyHp === 0 && !game.result
                        ? `${boss.name}’s last dramatic exit…`
                        : game.result
                          ? game.result === "victory"
                            ? "The sanctum is yours."
                            : "A lesson worth remembering."
                          : game.phase === "IDLE"
                            ? "Your move, apprentice."
                            : game.phase === "PLAYER_CASTING"
                              ? "Channeling your spell…"
                              : game.phase === "AI_ANALYZING"
                                ? `${boss.name} is watching…`
                                : game.phase === "AI_ACTING"
                                  ? `${boss.name} prepares an answer…`
                                  : "The dust settles…"}
                    </strong>
                  </div>
                  <span>CHOOSE YOUR ELEMENT</span>
                </div>
                <div className="spell-grid">
                  {ELEMENTS.map((element, index) => {
                    const spec = SPELLS[element];
                    const Icon = ICONS[element];
                    return (
                      <button
                        key={element}
                        className={`spell-card ${element.toLowerCase()}`}
                        disabled={locked || !canAfford(game, element)}
                        onClick={() => cast(element)}
                        aria-label={`${spec.name}, ${spec.cost} mana`}
                        aria-keyshortcuts={String(index + 1)}
                      >
                        <div className="spell-top">
                          <span className="spell-icon">
                            <Icon size={24} />
                          </span>
                          <kbd>{index + 1}</kbd>
                        </div>
                        <span className="school">{spec.school}</span>
                        <h3>{spec.name}</h3>
                        <p>{spec.detail}</p>
                        <div className="spell-stats">
                          <span>
                            {spec.min}–{spec.max} <small>DMG</small>
                          </span>
                          <span>
                            <Droplets size={12} />
                            {spec.cost}
                          </span>
                        </div>
                        {!canAfford(game, element) && (
                          <span className="low-mana">Not enough mana</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  className={`meditate ${game.hp <= MEDITATE_HEALTH_COST ? "lethal-price" : ""}`}
                  aria-keyshortcuts="5"
                  aria-label={`Blood meditation: restore up to 30 mana, costs ${MEDITATE_HEALTH_COST} health through shields, grants 5 shield. ${game.hp <= MEDITATE_HEALTH_COST ? "Warning: this will defeat you." : "Enemy still takes a turn."}`}
                  disabled={locked}
                  onClick={() => cast("REST")}
                >
                  <span>
                    <Sparkles size={17} />
                    <strong>Blood meditation</strong>
                    <span>Power has a price.</span>
                  </span>
                  <span>
                    <b>+30 mana</b>{" "}
                    <span className="blood-cost">
                      −{MEDITATE_HEALTH_COST} health
                    </span>{" "}
                    <kbd>5</kbd>
                  </span>
                </button>
                {game.hp <= MEDITATE_HEALTH_COST && !game.result && (
                  <p className="blood-warning">
                    Your pulse is too weak. Blood meditation will defeat you.
                  </p>
                )}
                {game.nextHijack && (
                  <p className="hijack-warning">
                    {game.nextHijack === "STEAL"
                      ? "⚠ Thread stolen: your next action will be skipped, without spending mana."
                      : "⚠ Inverted costs: your next elemental cast refunds its mana cost."}
                  </p>
                )}
                <p className="voice-status">
                  <Volume2 size={13} /> {voiceStatus} ·{" "}
                  <button onClick={replay}>Replay monologue</button>
                </p>
                <p className="play-hint">
                  <BookOpen size={13} />{" "}
                  {game.bossId === "MALAKOR"
                    ? "Repeating a spell makes Malakor resistant."
                    : game.bossId === "GLITCH"
                      ? "Watch for turn hijacks and inverted mana costs."
                      : "The Mirror remembers completed duels on this device."}
                  Switch elements to stay one step ahead.
                </p>
              </section>
              <aside className="sidebar">
                <section className="neural-panel bg-slate-900/80 backdrop-blur-md">
                  <div className="panel-heading">
                    <div className="brain-icon">
                      <BrainCircuit size={22} />
                    </div>
                    <div>
                      <h2>
                        {game.bossId === "MALAKOR"
                          ? "Malakor’s neural radar"
                          : game.bossId === "GLITCH"
                            ? "Process monitor"
                            : "Your remembered habits"}
                      </h2>
                      <span>{boss.passive}</span>
                    </div>
                    <i className="live-dot" />
                  </div>
                  <div className="learning-status">
                    <span
                      className={
                        game.enemyHp > 0 && game.phase === "AI_ANALYZING"
                          ? "pulsing"
                          : ""
                      }
                    />
                    {game.enemyHp === 0
                      ? "CIRCUIT OFFLINE"
                      : game.phase === "AI_ANALYZING"
                        ? "ANALYZING YOUR PATTERN"
                        : "ADAPTIVE MEMORY ONLINE"}
                  </div>
                  {game.bossId !== "MALAKOR" && (
                    <p className="boss-mechanic-note">
                      {boss.rule}
                      {game.bossId === "MIRROR" &&
                        ` ${game.echo.matches} completed duels remembered.`}
                    </p>
                  )}
                  <div className="section-label">
                    <span>Elemental resistance</span>
                    <span>CAP 80%</span>
                  </div>
                  <div className="resistance-list">
                    {ELEMENTS.map((e) => {
                      const Icon = ICONS[e];
                      return (
                        <div key={e} className={e.toLowerCase()}>
                          <div className="resistance-label">
                            <span>
                              <Icon size={15} />
                              {LABELS[e]}
                            </span>
                            <b>
                              {game.memory.currentResistances[e]}
                              <small>%</small>
                            </b>
                          </div>
                          <Meter
                            value={game.memory.currentResistances[e]}
                            max={100}
                            color={e.toLowerCase()}
                            label={`${LABELS[e]} resistance`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="prediction">
                    <div className="section-label">
                      <span>
                        <ScanEye size={14} /> Predicted next move
                      </span>
                      <span>CONFIDENCE</span>
                    </div>
                    <div>
                      <strong>
                        {game.enemyHp === 0
                          ? "No next move."
                          : game.prediction
                            ? LABELS[game.prediction]
                            : "Reading you…"}
                      </strong>
                      <b>
                        {game.enemyHp === 0 ? 0 : game.confidence}
                        <small>%</small>
                      </b>
                    </div>
                    <p>
                      {game.enemyHp === 0
                        ? "No thoughts. Just expensive ashes."
                        : game.confidence >= 60
                          ? "You have a pattern. He has a plan."
                          : game.prediction
                            ? "Keep him guessing. It’s working."
                            : "Cast a spell to leave your first impression."}
                    </p>
                  </div>
                  <div className="stance">
                    <span>TACTICAL STANCE</span>
                    <b>
                      <Shield size={13} />
                      {game.enemyHp === 0 ? "Ego shattered" : game.stance}
                    </b>
                  </div>
                  <div className="memory-heading">
                    <span>Recent spell memory</span>
                    <span>{game.memory.history.length}/10</span>
                  </div>
                  <div className="memory-slots">
                    {Array.from({ length: 10 }, (_, i) => {
                      const e = game.memory.history[i];
                      const Icon = e ? ICONS[e] : null;
                      return (
                        <span
                          key={i}
                          className={e?.toLowerCase()}
                          title={e ? LABELS[e] : "Empty memory"}
                        >
                          {Icon ? <Icon size={13} /> : <i />}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    className="inspect-button"
                    onClick={() => setInspect(true)}
                  >
                    <BrainCircuit size={15} /> Inspect the petty brain{" "}
                    <ArrowUpRight size={15} />
                  </button>
                </section>
                <section className="battle-log">
                  <div className="section-label">
                    <h2>Battle chronicle</h2>
                    <span>LIVE FEED</span>
                  </div>
                  <div
                    className="log-entries"
                    aria-live="polite"
                    aria-relevant="additions"
                  >
                    {game.log.slice(0, 5).map((line, i) => (
                      <div
                        key={`${game.log.length}-${i}-${line}`}
                        className={i === 0 ? "latest" : ""}
                      >
                        <span className="log-point" />
                        <p>{line}</p>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="tip">
                  <Sparkles size={17} />
                  <p>
                    <strong>A little unpredictability goes a long way.</strong>{" "}
                    Resistance fades when you try something new.
                  </p>
                </div>
              </aside>
            </div>
            <footer>
              <span>
                <Swords size={13} /> AETHERDUEL <span>/</span> Learning is a
                dangerous thing.
              </span>
              <button onClick={() => setInspect(true)}>
                Built around adaptive behavior <ChevronRight size={14} />
              </button>
            </footer>
          </>
        )}
      </main>
      {inspect && (
        <Modal title="Inside the petty brain" onClose={() => setInspect(false)}>
          <BrainCircuit className="modal-symbol" size={32} />
          <span className="chapter">LEARNING & ADAPTIVE BEHAVIOR</span>
          <h2>Inside the petty brain.</h2>
          <p>
            Malakor learns during this duel. He remembers your last 10 elemental
            spells and turns your habits against you.
          </p>
          <div className="formula">
            Used element: min(80%, resistance + 25%)
            <br />
            Other elements: max(0%, resistance − 10%)
          </div>
          <h3>Three foes. Shared status rules.</h3>
          <p>
            Fire has a 30% chance to burn (8 health at the start of each of the
            next 2 affected turns, through shields). Frost has a 25% chance to
            freeze (skip the next turn). Volt has a 30% chance to paralyze (50%
            chance to fizzle on each of the next 2 turns). Both sides can
            inflict these effects. Refreshing a status resets its duration; it
            does not stack. Skipped actions spend no mana. Shields still age on
            skipped boss turns.
          </p>
          <p>
            GLITCH rolls a 20% hijack chance at each living, unblocked turn
            start. A hijack either steals your action without cost, or refunds
            an elemental spell’s mana cost instead of spending it. A hijack on
            its own turn queues the effect for your next action. Blood
            meditation still costs health. The Mirror uses completed-match
            openings, favorite spells and shield frequency saved on this device.
            You can erase that memory from the foe screen.
          </p>
          <ul>
            <li>
              <b>Cast, then adapt.</b> Damage uses the existing resistance. The
              new resistance protects against your next hit. Three Fire casts
              build 75% resistance.
            </li>
            <li>
              <b>A simple prediction.</b> Confidence = most common spell count ÷
              spells in memory. Ties favor Fire, Frost, Volt, then Earth. A
              confident prediction adds 4 attack damage; Fire resistance of 50%
              triggers a 22-damage Frost Lance.
            </li>
            <li>
              <b>Survival instinct.</b> Below 66 health, he raises a 22-point
              shield every third turn, steals 10 health on other odd turns, and
              attacks normally otherwise.
            </li>
            <li>
              <b>Use your whole spellbook.</b> Mana costs: Fire 20, Frost 18,
              Volt 22, Earth 15. Frost weakens his next attack by 20%. Earth’s
              shield lasts through two enemy turns. Meditate restores up to 30
              mana, costs 6 health through shields (which can defeat you), and
              grants a 5-point shield for one enemy turn; it also lowers all
              resistances by 10%.
            </li>
            <li>
              <b>Your mastery grade.</b> S: all 4 elements and less than 15%
              damage resisted. A: 3+ and less than 25%. B: 2+ and less than 40%.
              Otherwise C.
            </li>
          </ul>
          <p className="modal-note">
            This is a local, rule-based learning system. No servers or remote
            voice services. Completed duel habits are saved on this device only.
            Keys 1–4 cast spells; 5 meditates. Each action gives Malakor a turn.
          </p>
          <button className="primary-button" onClick={() => setInspect(false)}>
            Back to the duel <Swords size={16} />
          </button>
        </Modal>
      )}
      {inBattle && game.result && resultOpen && !inspect && (
        <Modal
          title={game.result === "victory" ? "Victory" : "Defeat"}
          onClose={() => setResultOpen(false)}
        >
          <Crown className="modal-symbol" size={36} />
          <span className="chapter">
            {game.result === "victory"
              ? "EGO: OBLITERATED"
              : "THE APPRENTICESHIP CONTINUES"}
          </span>
          <h2>
            {game.result === "victory"
              ? "Outplayed. Not outpowered."
              : "He won the duel. You learned."}
          </h2>
          <p>
            {game.result === "victory"
              ? `“${boss.defeat}”`
              : `“${boss.victory}”`}
          </p>
          <div className="result-stats">
            <div>
              <strong>{game.round}</strong>
              <span>Total turns</span>
            </div>
            <div>
              <strong>{game.penalty}</strong>
              <span>Spam penalty · damage resisted</span>
            </div>
            <div>
              <strong>{mastery(game)}</strong>
              <span>Adaptation mastery</span>
            </div>
          </div>
          <p className="blood-receipt">
            Blood price paid: <b>{game.bloodPrice} health</b> across the duel.
          </p>
          <h3 className="usage-title">Your elemental signature</h3>
          {ELEMENTS.map((e) => (
            <div className={`usage-row ${e.toLowerCase()}`} key={e}>
              <span>{LABELS[e]}</span>
              <Meter
                value={game.usage[e]}
                max={total || 1}
                color={e.toLowerCase()}
                label={`${LABELS[e]} usage`}
              />
              <b>{Math.round((game.usage[e] / (total || 1)) * 100)}%</b>
            </div>
          ))}
          <button className="primary-button" onClick={reset}>
            <RotateCcw size={16} /> Duel again
          </button>
          <button className="roster-return" onClick={chooseFoe}>
            <ScanFace size={16} /> Choose another foe
          </button>
        </Modal>
      )}
      {inBattle && game.result && !resultOpen && (
        <button
          className="results-reopen primary-button"
          onClick={() => setResultOpen(true)}
        >
          View match results
        </button>
      )}
    </div>
  );
}
