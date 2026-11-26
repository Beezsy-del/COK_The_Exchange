import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { BossId } from "./bosses";
export function stopMonologue() {
  if (typeof window !== "undefined" && "speechSynthesis" in window)
    window.speechSynthesis.cancel();
}
export function useLocalMonologue(
  text: string,
  boss: BossId,
  muted: boolean,
  active: boolean,
) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [failed, setFailed] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const update = () =>
      setVoices(
        window.speechSynthesis
          .getVoices()
          .filter((v) => v.localService && /^en(?:-|$)/i.test(v.lang)),
      );
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);
  const speak = useCallback(() => {
    stopMonologue();
    const id = ++generation.current;
    if (
      muted ||
      !active ||
      !voices.length ||
      !("SpeechSynthesisUtterance" in window)
    )
      return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice =
        voices[boss === "MIRROR" ? Math.min(1, voices.length - 1) : 0];
      utterance.lang = utterance.voice.lang;
      utterance.rate =
        boss === "GLITCH" ? 0.88 : boss === "MIRROR" ? 0.92 : 0.94;
      utterance.pitch =
        boss === "GLITCH" ? 0.55 : boss === "MIRROR" ? 0.75 : 0.8;
      utterance.volume = 0.85;
      utterance.onerror = (event) => {
        if (
          id === generation.current &&
          event.error !== "canceled" &&
          event.error !== "interrupted"
        )
          setFailed(true);
      };
      utterance.onstart = () => {
        if (id === generation.current) setFailed(false);
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setFailed(true);
    }
  }, [text, boss, muted, active, voices]);
  useEffect(() => {
    speak();
    return () => {
      generation.current++;
      stopMonologue();
    };
  }, [speak]);
  return {
    replay: speak,
    voiceStatus: failed
      ? "Voice unavailable"
      : voices.length
        ? "Local voice"
        : "Captions only · no local English voice",
  };
}
export function SpeechBubble({
  text,
  name,
  replay,
  voiceStatus,
  side = "boss",
}: {
  text: string;
  name: string;
  replay?: () => void;
  voiceStatus?: string;
  side?: "boss" | "player";
}) {
  const [length, setLength] = useState(0);
  useEffect(() => {
    setLength(0);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLength(text.length);
      return;
    }
    let index = 0;
    const timer = window.setInterval(() => {
      index = Math.min(text.length, index + 2);
      setLength(index);
      if (index === text.length) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [text]);
  return (
    <div className={`speech-bubble ${side}`}>
      <div>
        <b>{name}</b>
        {replay && (
          <button
            onClick={replay}
            aria-label={`Replay ${name}'s monologue`}
            title={voiceStatus}
          >
            <Volume2 size={13} />
          </button>
        )}
      </div>
      <p aria-hidden="true">
        {text.slice(0, length)}
        <span className="type-caret" />
      </p>
      <span className="sr-only">{text}</span>
    </div>
  );
}
