import { useState } from "react";
import type { Game } from "./aiEngine";

type Character = "iona" | "pip" | "quill";
const CAST = {
  iona: { name: "Iona", role: "Your dangerously curious apprentice" },
  pip: { name: "Pip", role: "Imp. Spectator. Terrible influence." },
  quill: { name: "Quill", role: "The late librarian. Still judging." },
};

export function CharacterArt({ character }: { character: Character }) {
  return (
    <svg
      viewBox="0 0 180 240"
      role="img"
      aria-label={`${CAST[character].name}: ${CAST[character].role}`}
    >
      {character === "iona" ? (
        <>
          <ellipse
            cx="90"
            cy="225"
            rx="60"
            ry="11"
            fill="#030f13"
            opacity=".7"
          />
          <g
            className="character-body"
            stroke="#0b2329"
            strokeWidth="3"
            strokeLinejoin="round"
          >
            <path
              d="M61 156L56 221 78 224 91 176 105 223 129 224 119 154"
              fill="#162a32"
            />
            <path
              d="M57 212L45 227 78 228 79 219M107 215L109 229 142 229 128 219"
              fill="#b89861"
            />
            <path
              d="M66 105L44 123 27 166 45 177 64 151 50 193 100 206 133 186 119 151 147 144 142 127 115 111"
              fill="#2a887f"
            />
            <path
              d="M67 110L76 146 62 191 100 204 89 146 108 110"
              fill="#15484e"
            />
            <path d="M56 173L116 175 118 184 54 183" fill="#d3aa62" />
            <path d="M80 171L93 171 93 186 80 186Z" fill="#fae1a3" />
            <path d="M61 58Q95 33 117 64L112 96 93 116 68 99Z" fill="#d4a479" />
            <path
              d="M61 73L51 84 56 43 80 27 113 38 128 74 111 66 107 50 89 66 76 57 72 79"
              fill="#172832"
            />
            <path
              d="M61 83L58 96 70 97M113 82L121 78 117 95 111 96"
              fill="#d4a479"
            />
            <path
              d="M76 80L83 79M101 78L108 77"
              stroke="#18262b"
              strokeWidth="4"
            />
            <path d="M85 98Q94 103 102 94" fill="none" strokeWidth="2" />
            <path
              d="M63 108L78 124 108 105 118 116 79 140 57 120Z"
              fill="#e5b461"
            />
            <path d="M39 163L28 171 34 187 46 181" fill="#d4a479" />
            <path d="M140 129L151 124 158 137 147 147" fill="#d4a479" />
            <path d="M151 63L146 216" stroke="#ac8c5f" strokeWidth="6" />
            <path
              d="M151 44L164 61 151 80 139 61Z"
              fill="#80f2cf"
              stroke="#163d3a"
            />
            <path d="M151 44L151 80 139 61Z" fill="#3da48f" stroke="none" />
          </g>
          <circle cx="151" cy="61" r="23" fill="#70ffd1" opacity=".09" />
        </>
      ) : character === "pip" ? (
        <>
          <ellipse
            cx="91"
            cy="223"
            rx="57"
            ry="10"
            fill="#180c14"
            opacity=".7"
          />
          <g
            className="character-body"
            stroke="#35202a"
            strokeWidth="3"
            strokeLinejoin="round"
          >
            <path
              d="M116 182Q170 202 149 141L138 136 161 123 162 147Q183 214 116 206"
              fill="#b95445"
            />
            <path
              d="M64 147L40 117 17 126 35 165 60 176M115 147L143 118 161 129 141 168 118 175"
              fill="#7b3f43"
            />
            <path
              d="M62 182L57 222 80 222 88 198 105 223 126 222 114 179"
              fill="#b75845"
            />
            <path
              d="M58 213L44 225 80 226M107 214L109 227 137 226"
              fill="#ebbd7d"
            />
            <path
              d="M66 114Q47 141 58 185Q90 211 123 182L118 132 106 114"
              fill="#d67952"
            />
            <path
              d="M73 140Q60 170 76 185L108 182 110 149"
              fill="#eebd7a"
              stroke="none"
            />
            <path
              d="M55 83L34 55 41 105 61 117M119 83L145 57 138 105 117 116"
              fill="#d67952"
            />
            <path d="M64 63L59 29 78 52M103 52L119 26 117 68" fill="#f0d7a0" />
            <path
              d="M53 77Q84 39 120 72L126 108 101 128 71 122 52 101Z"
              fill="#db8156"
            />
            <path
              d="M59 84L81 90 73 99 62 96M94 90L117 82 112 97 100 99"
              fill="#fff0b2"
            />
            <path
              d="M70 106Q89 121 111 102L106 116 88 121 73 116Z"
              fill="#482a31"
            />
            <path
              d="M75 110L79 117 83 112M101 109L105 115 110 105"
              fill="#ffe7ae"
              stroke="none"
            />
            <path
              d="M57 141L44 155 61 169 75 154M117 144L135 158 119 169 104 155"
              fill="#d67952"
            />
            <path d="M63 151L102 142 116 161 76 177Z" fill="#f5d593" />
            <path
              d="M76 158L97 152M82 165L104 158"
              fill="none"
              stroke="#ad7048"
              strokeWidth="2"
            />
          </g>
        </>
      ) : (
        <>
          <ellipse
            cx="90"
            cy="224"
            rx="49"
            ry="8"
            fill="#7bb9cf"
            opacity=".12"
          />
          <g
            className="character-body"
            stroke="#304453"
            strokeWidth="3"
            strokeLinejoin="round"
          >
            <path
              d="M62 109Q35 137 50 171L39 205 65 194 75 214 92 200 109 215 128 200 141 205 128 163 125 121Z"
              fill="#85b8be"
              opacity=".8"
            />
            <path
              d="M65 116L88 150 113 116 115 186 92 200 63 183Z"
              fill="#476d83"
            />
            <path
              d="M71 127L86 149 82 180M111 126L95 149 101 184"
              stroke="#d4bd8b"
              fill="none"
            />
            <path
              d="M57 62Q94 37 122 63L117 106 95 124 66 108Z"
              fill="#bbd8cc"
            />
            <path
              d="M57 71L50 49 66 30 91 26 119 34 130 61 119 76 110 57 71 59 67 79"
              fill="#c5dcd1"
            />
            <path
              d="M65 82L83 82 83 94 66 94ZM100 82L118 82 116 94 100 94Z"
              fill="#314552"
            />
            <path d="M83 85L100 85" stroke="#d4bc88" />
            <path d="M80 105L102 105" stroke="#425761" />
            <path
              d="M49 149L91 160 134 145 136 181 93 195 48 181Z"
              fill="#68506e"
              stroke="#c4a176"
            />
            <path
              d="M91 160L93 195M56 159L81 167M102 166L126 157M57 169L81 177M102 176L127 167"
              stroke="#d4bb8e"
              strokeWidth="2"
            />
            <path
              d="M48 143L37 154 47 170 56 162M134 145L147 151 138 169 130 160"
              fill="#b7d6cc"
            />
          </g>
        </>
      )}
    </svg>
  );
}

function reaction(character: Character, game: Game) {
  if (game.enemyHp === 0)
    return {
      iona: "That’s one less ego in the room.",
      pip: "He owes me twelve gold. TWELVE.",
      quill: "Cause of death: an inability to accept feedback.",
    }[character];
  if (game.hp === 0)
    return {
      iona: "I may have miscalculated.",
      pip: "Can I have your boots? Too soon?",
      quill: "A short biography. A promising first chapter.",
    }[character];
  if (game.pending === "REST" || game.log[0]?.includes("Blood meditation"))
    return {
      iona: "A little blood. A little magic. Bad trade?",
      pip: "Six health? I know a guy who charges five.",
      quill: "Read the fine print. Especially the part in blood.",
    }[character];
  if (game.memory.currentResistances.FIRE >= 50)
    return {
      iona: "Right. Other spellbooks. I have those.",
      pip: "Again with the fire? Even I’m bored.",
      quill: "Repetition is not a research methodology.",
    }[character];
  if (game.hp <= 30)
    return {
      iona: "Still standing. That counts.",
      pip: "My money is… emotionally still on you.",
      quill: "Perhaps a shield before your next grand gesture.",
    }[character];
  const lines = {
    iona: [
      "Four spellbooks. One very punchable wizard.",
      "Watch the wards. Change the spell.",
      "He’s learning. So am I.",
    ],
    pip: [
      "I brought snacks. And absolutely no faith.",
      "Hit him again! For, uh, science.",
      "Look at his face. He HATES this.",
    ],
    quill: [
      "Keep your voice down. This is still a library.",
      "A varied spellbook makes a longer biography.",
      "I’ve been dead for years. His lectures felt longer.",
    ],
  };
  return lines[character][game.round % 3];
}

export function ArenaCharacters({ game }: { game: Game }) {
  return (
    <div
      className={`arena-characters ${game.phase === "PLAYER_CASTING" ? "casting" : ""} ${game.enemyHp === 0 ? "celebrating" : ""} ${game.hp === 0 ? "mourning" : ""}`}
    >
      {(["iona", "pip", "quill"] as const).map((character) => (
        <div className={`arena-character ${character}`} key={character}>
          <CharacterArt character={character} />
          <span>
            {CAST[character].name}
            {character === "iona" ? " · You" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
export function Ringside({ game }: { game: Game }) {
  const [speaker, setSpeaker] = useState<Character>("pip");
  return (
    <div className={`ringside ${speaker}`}>
      <div className="cast-picker" aria-label="Choose who to listen to">
        {(["iona", "pip", "quill"] as const).map((character) => (
          <button
            key={character}
            aria-label={`Listen to ${CAST[character].name}`}
            aria-pressed={speaker === character}
            title={CAST[character].role}
            onClick={() => setSpeaker(character)}
          >
            <CharacterArt character={character} />
          </button>
        ))}
      </div>
      <p aria-live="polite">
        <b>{CAST[speaker].name}</b>
        <span key={`${speaker}-${reaction(speaker, game)}`}>
          “{reaction(speaker, game)}”
        </span>
      </p>
      <small>
        Ringside
        <br />
        remarks
      </small>
    </div>
  );
}
