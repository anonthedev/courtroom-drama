"use client";

import { useCallback, useEffect, useRef } from "react";
import { Scale, ShieldAlert, FileText, Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { TranscriptEntry, getSpeakerColor } from "./types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TranscriptAreaProps {
  transcript: TranscriptEntry[];
  streamingSpeaker: string | null;
  onSpeak: (text: string, speaker: string, id: number) => void;
  onStopSpeaking: () => void;
  speakingId: number | null;
}

export function TranscriptArea({
  transcript,
  streamingSpeaker,
  onSpeak,
  onStopSpeaking,
  speakingId,
}: TranscriptAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [transcript, streamingSpeaker, scrollToBottom]);

  return (
    <div
      ref={scrollRef}
      className="chat-scroll flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 scroll-smooth"
    >
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-4">
        {transcript.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-muted-foreground animate-in fade-in duration-1000">
            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mb-6 ring-1 ring-border/50 shadow-inner">
              <Scale className="w-10 h-10 opacity-50 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground tracking-tight mb-2">Court is now in session</h2>
            <p className="text-sm max-w-sm text-center">
              Awaiting opening statements. The trial will commence shortly.
            </p>
          </div>
        )}

        {transcript.map((entry, i) => {
          const isUser = entry.speaker === "Defense";
          const isObjection = entry.type === "objection";
          const isSystem = entry.type === "system";

          if (isObjection) {
            return (
              <div key={i} className="flex justify-center my-6 animate-in zoom-in-95 duration-300">
                <div className="bg-destructive/10 text-destructive border border-destructive/20 px-6 py-2.5 rounded-full font-bold uppercase tracking-widest text-sm flex items-center gap-2.5 shadow-lg shadow-destructive/5 backdrop-blur-sm">
                  <ShieldAlert className="w-4 h-4" />
                  {entry.content}
                </div>
              </div>
            );
          }

          if (isSystem) {
            return (
              <div key={i} className="flex justify-center my-4 animate-in fade-in">
                <div className="bg-muted/50 text-muted-foreground px-4 py-1.5 rounded-full text-xs font-medium italic flex items-center gap-2 border border-border/50">
                  <FileText className="w-3 h-3" />
                  {entry.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={cn(
                "flex gap-4 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300",
                isUser ? "self-end flex-row-reverse" : "self-start"
              )}
            >
              <Avatar className={cn(
                "w-10 h-10 border shadow-sm shrink-0", 
                isUser ? "border-primary/20 bg-primary/10" : "border-border/50 bg-muted"
              )}>
                <AvatarFallback className={cn(
                  "text-xs font-bold",
                  isUser ? "text-primary" : "text-muted-foreground"
                )}>
                  {entry.speaker.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "flex flex-col gap-1.5",
                isUser ? "items-end" : "items-start"
              )}>
                <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider px-1">
                  {entry.speaker}
                </span>
                <div className={cn("flex items-end gap-1.5", isUser && "flex-row-reverse")}>
                  <div
                    className={cn(
                      "px-5 py-3.5 rounded-2xl text-sm shadow-sm border leading-relaxed",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm border-primary/20 shadow-primary/10"
                        : cn("rounded-tl-sm backdrop-blur-sm", getSpeakerColor(entry.speaker))
                    )}
                  >
                    {entry.content}
                  </div>
                  {!entry.isPartial && (
                    <button
                      onClick={() =>
                        speakingId === i ? onStopSpeaking() : onSpeak(entry.content, entry.speaker, i)
                      }
                      className={cn(
                        "shrink-0 p-1 rounded-full transition-all hover:scale-110",
                        speakingId === i
                          ? "text-primary animate-pulse"
                          : "text-muted-foreground/40 hover:text-muted-foreground"
                      )}
                      title={speakingId === i ? "Stop" : "Listen"}
                    >
                      {speakingId === i
                        ? <Square className="w-3 h-3 fill-current" />
                        : <Volume2 className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {streamingSpeaker && (
          <div className="flex gap-4 max-w-[85%] animate-in fade-in self-start opacity-70">
            <Avatar className="w-10 h-10 border border-border/50 bg-muted shadow-sm shrink-0">
              <AvatarFallback className="text-xs font-bold text-muted-foreground">
                {streamingSpeaker.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5 items-start justify-center">
              <span className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider px-1">
                {streamingSpeaker}
              </span>
              <div className="bg-muted/50 border border-border/50 px-5 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
