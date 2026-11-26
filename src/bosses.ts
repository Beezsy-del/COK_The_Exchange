export type BossId = "MALAKOR" | "GLITCH" | "MIRROR";
export const BOSSES = {
  MALAKOR: {
    name: "Malakor",
    title: "The Petty Sorcerer",
    label: "The adaptive counter",
    color: "#bd95ef",
    description:
      "An oversized ego with a very good memory. Repeat yourself and his wards grow stronger.",
    passive: "Adaptive wards",
    rule: "+25% resistance to your last element. Others decay by 10%.",
    intro:
      "Another amateur who thinks waving a stick makes them a mage. Try not to embarrass yourself.",
    frozen: "Impertinent worm! You dare chill my grandeur?!",
    burned: "My robes! Do you have any idea what silk costs?",
    paralyzed: "My brilliance cannot be grounded!",
    low: "Look at you trembling. Shall I call your tutor?",
    desperate: "This is merely a strategically undignified setback.",
    crit: "A masterclass. I trust you were taking notes.",
    defeat: "Wait—my robes! These were dry-clean only…",
    victory: "Perhaps try a less demanding hobby. Pebble collecting, say.",
    counter: "I have already marked your next mistake.",
  },
  GLITCH: {
    name: "0xNULL",
    title: "GLITCH",
    label: "An error that learned to hate",
    color: "#f971a5",
    description:
      "Something escaped the stack. It doesn't play by the rules. It rewrites them.",
    passive: "Turn hijack",
    rule: "20% chance at each active turn start: steal your turn or reverse a spell’s mana cost.",
    intro:
      "0x0000007E... MEMORY_MANAGEMENT_FAILURE... I WAS NOT MEANT TO EXIST... BUT YOU WILL CEASE.",
    frozen: "PROCESS SUSPENDED. THAW REQUEST DENIED.",
    burned: "THERMAL EXCEPTION. CORES MELTING.",
    paralyzed: "SIGNAL LOST. RECONNECTING TO YOUR NIGHTMARES.",
    low: "YOUR HEALTH BUFFER IS APPROACHING ZERO.",
    desperate: "MEMORY LEAK. IDENTITY CORRUPTED. DO NOT LOOK AWAY.",
    crit: "FATAL EXCEPTION. THAT MEANS YOU.",
    defeat: "KERNEL_PANIC... REBOOTING IN 3... 2... [STATIC]",
    victory: "USER PROCESS TERMINATED. FINALLY, SILENCE.",
    counter: "[OVERFLOW DETECTED] YOUR INPUT HAS BEEN REALLOCATED TO THE VOID.",
  },
  MIRROR: {
    name: "YOU",
    title: "The Neural Echo",
    label: "Your worst habits, reflected",
    color: "#73d9ca",
    description:
      "Same face. Same spellbook. Every habit you leave behind becomes its next weapon.",
    passive: "Remembered playstyle",
    rule: "Learns openings, favorite elements and shield frequency from completed local duels.",
    intro:
      "I know every mistake you're about to make. You're the one who taught me.",
    frozen: "You always did confuse stillness with peace.",
    burned: "You taught me how to burn. Now watch.",
    paralyzed: "Even our hesitation is the same.",
    low: "You were always your own worst enemy.",
    desperate: "If I break, what does that say about you?",
    crit: "That was your favorite trick. Remember?",
    defeat: "For once... you chose something I wouldn't.",
    victory: "We both knew how this would end.",
    counter: "Predictable. You always press that button when cornered.",
  },
} as const;
export const BOSS_IDS: BossId[] = ["MALAKOR", "GLITCH", "MIRROR"];
