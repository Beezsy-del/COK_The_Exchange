import type { Spell } from "./aiEngine";
let context: AudioContext | undefined;
let master: GainNode | undefined;
let enabled = true;
export function setAudioEnabled(value: boolean) {
  enabled = value;
  if (context && master)
    master.gain.setValueAtTime(value ? 1 : 0, context.currentTime);
}
export function unlockAudio() {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    if (!master) {
      master = context.createGain();
      master.connect(context.destination);
    }
    void context.resume().catch(() => {});
  } catch {
    /* Audio is optional. */
  }
}
function tone(
  type: OscillatorType,
  from: number,
  to: number,
  duration: number,
  delay = 0,
) {
  if (!enabled || !context || context.state !== "running") return;
  const c = context;
  const t = c.currentTime + delay;
  const oscillator = c.createOscillator();
  const gain = c.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, t);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, to),
    t + duration,
  );
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.11, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  oscillator.connect(gain);
  gain.connect(master ?? c.destination);
  oscillator.start(t);
  oscillator.stop(t + duration + 0.02);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
export function playSpellSound(element: Spell) {
  if (element === "FIRE") {
    tone("sawtooth", 150, 35, 0.35);
    if (enabled && context?.state === "running") {
      const c = context;
      const buffer = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.12;
      const source = c.createBufferSource();
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 650;
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(master ?? c.destination);
      source.start();
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
      };
    }
  }
  if (element === "FROST") {
    tone("sine", 1400, 700, 0.35);
    tone("sine", 2100, 1400, 0.25, 0.08);
  }
  if (element === "VOLT")
    for (let i = 0; i < 5; i++)
      tone(
        "square",
        200 + Math.random() * 900,
        80 + Math.random() * 300,
        0.08,
        i * 0.04,
      );
  if (element === "EARTH") tone("triangle", 100, 24, 0.45);
  if (element === "REST") tone("sine", 260, 520, 0.4);
}
export const playHitSound = () => tone("triangle", 110, 35, 0.15);
export const playCritSound = () => {
  tone("square", 800, 120, 0.23);
  tone("sine", 1200, 600, 0.3);
};
export const playVictorySound = () =>
  [262, 330, 392, 523].forEach((f, i) => tone("sine", f, f, 0.4, i * 0.13));

export function playDefeatSound() {
  tone("sawtooth", 330, 32, 1.1);
  tone("triangle", 110, 28, 1.5, 0.2);
  [880, 660, 440, 220].forEach((f, i) => tone("sine", f, f / 2, 0.5, i * 0.2));
}

function noise(duration: number, frequency: number, bitcrush = false) {
  if (!enabled || !context || context.state !== "running") return;
  const c = context,
    buffer = c.createBuffer(
      1,
      Math.ceil(c.sampleRate * duration),
      c.sampleRate,
    ),
    data = buffer.getChannelData(0);
  let sample = 0;
  for (let i = 0; i < data.length; i++) {
    if (!bitcrush || i % 16 === 0) sample = Math.random() * 2 - 1;
    data[i] = sample * Math.pow(1 - i / data.length, 2) * 0.12;
  }
  const source = c.createBufferSource(),
    filter = c.createBiquadFilter();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(frequency, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(80, c.currentTime + duration);
  source.connect(filter);
  filter.connect(master ?? c.destination);
  source.start();
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
  };
}
export function playGlitchSound() {
  noise(0.32, 2400, true);
  for (let i = 0; i < 4; i++)
    tone("square", 120 + Math.random() * 1200, 60, 0.07, i * 0.06);
}
export function playGlassBreakSound() {
  tone("square", 4200, 900, 0.035);
  noise(0.65, 6000);
  [2100, 3300, 4700].forEach((f, i) => tone("sine", f, 300, 0.28, i * 0.035));
}
export function playHeartbeat() {
  if (typeof document !== "undefined" && document.hidden) return;
  tone("sine", 65, 32, 0.13);
  tone("sine", 56, 28, 0.17, 0.19);
}
export function playStatusSound(type: import("./statusEffects").StatusType) {
  if (type === "BURN") noise(0.4, 1700);
  else if (type === "FREEZE") {
    tone("sine", 1900, 900, 0.4);
    tone("sine", 2700, 1800, 0.3, 0.07);
  } else {
    noise(0.2, 3600, true);
    tone("square", 700, 80, 0.16);
  }
}
