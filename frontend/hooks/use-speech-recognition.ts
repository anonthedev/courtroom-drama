"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/components/courtroom/types";

const DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen";
const DG_PARAMS = new URLSearchParams({
  model: "nova-3",
  language: "en",
  smart_format: "true",
  interim_results: "true",
  utterance_end_ms: "1500",
  vad_events: "true",
});

interface SpeechRecognitionHook {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

async function fetchDeepgramKey(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/stt/token`);
  if (!res.ok) throw new Error("Failed to fetch Deepgram token");
  const data = await res.json();
  return data.key;
}

export function useSpeechRecognition(
  onResult: (text: string) => void,
): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined";
    setIsSupported(supported);

    return () => {
      wsRef.current?.close();
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    try {
      const [key, stream] = await Promise.all([
        fetchDeepgramKey(),
        navigator.mediaDevices.getUserMedia({ audio: true }),
      ]);

      streamRef.current = stream;
      finalTranscriptRef.current = "";

      const ws = new WebSocket(`${DEEPGRAM_WS_URL}?${DG_PARAMS}`, [
        "token",
        key,
      ]);
      wsRef.current = ws;

      ws.onopen = () => {
        const recorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
          }
        };

        recorder.start(250);
        mediaRecorderRef.current = recorder;
        setIsListening(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "Results" && msg.channel?.alternatives?.length) {
            const alt = msg.channel.alternatives[0];
            const transcript = alt.transcript ?? "";

            if (!transcript) return;

            if (msg.is_final) {
              finalTranscriptRef.current += transcript + " ";
              onResultRef.current(finalTranscriptRef.current.trimEnd());
            } else {
              onResultRef.current(
                (finalTranscriptRef.current + transcript).trimEnd(),
              );
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        console.error("Deepgram WebSocket error");
        cleanup();
      };

      ws.onclose = () => {
        cleanup();
      };
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      cleanup();
    }
  }, [isListening]);

  const cleanup = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wsRef.current = null;
    finalTranscriptRef.current = "";
    setIsListening(false);
  }, []);

  const stopListening = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "CloseStream" }));
    }
    ws?.close();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    wsRef.current = null;
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}
