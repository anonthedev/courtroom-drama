"use client";

import { useCallback, useRef, useState } from "react";

const VOICE_SETTINGS: Record<string, { pitch: number; rate: number }> = {
  Prosecution: { pitch: 0.9, rate: 1.0 },
  Witness: { pitch: 1.1, rate: 0.95 },
  Judge: { pitch: 0.7, rate: 0.9 },
  Defense: { pitch: 1.0, rate: 1.0 },
};

interface TTSHook {
  speak: (text: string, speaker: string, id: number) => void;
  stop: () => void;
  speakingId: number | null;
}

export function useTTS(): TTSHook {
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (text: string, speaker: string, id: number) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      utteranceRef.current = null;

      const utterance = new SpeechSynthesisUtterance(text);
      const settings = VOICE_SETTINGS[speaker] ?? { pitch: 1.0, rate: 1.0 };
      utterance.pitch = settings.pitch;
      utterance.rate = settings.rate;
      utterance.volume = 1.0;

      utterance.onstart = () => setSpeakingId(id);
      utterance.onend = () => {
        setSpeakingId(null);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setSpeakingId(null);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  return { speak, stop, speakingId };
}
