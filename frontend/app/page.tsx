"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, WS_BASE, TranscriptEntry, Juror } from "@/components/courtroom/types";
import { InitScreen } from "@/components/courtroom/InitScreen";
import { Header } from "@/components/courtroom/Header";
import { CaseSummary } from "@/components/courtroom/CaseSummary";
import { TranscriptArea } from "@/components/courtroom/TranscriptArea";
import { ControlsBar } from "@/components/courtroom/ControlsBar";
import { JuryPanel } from "@/components/courtroom/JuryPanel";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useTTS } from "@/hooks/use-tts";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [caseSummary, setCaseSummary] = useState("");
  const [caseName, setCaseName] = useState("The State vs. Cyberdyne Systems");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [currentTurn, setCurrentTurn] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingSpeaker, setStreamingSpeaker] = useState<string | null>(null);
  const [, setLastObjection] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const { speak, stop: stopTTS, speakingId } = useTTS();

  const handleSpeechResult = useCallback((text: string) => {
    setInput(text);
  }, []);

  const {
    isListening,
    isSupported: sttSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition(handleSpeechResult);

  async function initGame() {
    if (!caseName.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/game/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_name: caseName }),
      });

      if (!res.ok) throw new Error("Failed to initialize game");

      const data = await res.json();
      setSessionId(data.session_id);
      setCaseSummary(data.summary);
      setTranscript([]);
      setJurors([]);
    } catch (e) {
      console.error("Failed to init game:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/trial/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {};
    ws.onclose = () => {
      setStreamingSpeaker(null);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "session_joined":
          setCurrentTurn(msg.current_turn);
          if (msg.jury) setJurors(msg.jury);
          break;

        case "token":
          setStreamingSpeaker(msg.speaker);
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            if (last?.speaker === msg.speaker && last?.isPartial) {
              return [
                ...prev.slice(0, -1),
                {
                  speaker: msg.speaker,
                  content: last.content + msg.content,
                  isPartial: true,
                  type: "statement" as const,
                },
              ];
            }
            return [
              ...prev,
              { speaker: msg.speaker, content: msg.content, isPartial: true, type: "statement" as const },
            ];
          });
          break;

        case "turn_complete":
          setStreamingSpeaker(null);
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            if (last?.speaker === msg.speaker && last?.isPartial) {
              return [
                ...prev.slice(0, -1),
                { speaker: msg.speaker, content: msg.content, type: "statement" as const },
              ];
            }
            return [...prev, { speaker: msg.speaker, content: msg.content, type: "statement" as const }];
          });
          break;

        case "awaiting_input":
          setCurrentTurn("Defense");
          break;

        case "objection_received":
          setLastObjection(msg.ground);
          setTranscript((prev) => [
            ...prev,
            { speaker: "System", content: `Objection raised: ${msg.ground}`, type: "objection" as const },
          ]);
          setTimeout(() => setLastObjection(null), 3000);
          break;

        case "stream_interrupted":
          setStreamingSpeaker(null);
          stopTTS();
          break;

        case "jury_update":
          setJurors(msg.jurors);
          break;

        case "error":
          console.error("Server error:", msg.content);
          setTranscript((prev) => [
            ...prev,
            { speaker: "Error", content: msg.content, type: "system" as const },
          ]);
          break;
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId, stopTTS]);

  function sendStatement() {
    if (!input.trim() || !wsRef.current) return;
    const content = input;
    wsRef.current.send(JSON.stringify({ action: "STATEMENT", content }));
    setInput("");
    setCurrentTurn("");
  }

  function sendObjection(ground: string) {
    if (!wsRef.current) return;
    wsRef.current.send(JSON.stringify({ action: "OBJECTION", ground }));
  }

  if (!sessionId) {
    return (
      <InitScreen
        caseName={caseName}
        setCaseName={setCaseName}
        isLoading={isLoading}
        onStart={initGame}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Header sessionId={sessionId} />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <CaseSummary summary={caseSummary} />
          <TranscriptArea
            transcript={transcript}
            streamingSpeaker={streamingSpeaker}
            onSpeak={speak}
            onStopSpeaking={stopTTS}
            speakingId={speakingId}
          />
          <ControlsBar
            currentTurn={currentTurn}
            input={input}
            setInput={setInput}
            onSendStatement={sendStatement}
            onSendObjection={sendObjection}
            isListening={isListening}
            sttSupported={sttSupported}
            onToggleMic={isListening ? stopListening : startListening}
          />
        </div>

        <JuryPanel jurors={jurors} />
      </div>
    </div>
  );
}
