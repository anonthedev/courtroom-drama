"use client";

import { useCallback, useEffect, useRef } from "react";
import { Scale, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { TranscriptEntry, getSpeakerColor } from "./types";

interface TranscriptAreaProps {
  transcript: TranscriptEntry[];
  streamingSpeaker: string | null;
}

export function TranscriptArea({ transcript, streamingSpeaker }: TranscriptAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [transcript, scrollToBottom]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto p-4"
    >
      <div className="flex flex-col gap-4 max-w-3xl mx-auto pb-4 px-2">
        {transcript.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Scale className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Court is now in session.</p>
            <p className="text-sm">Waiting for opening statements...</p>
          </div>
        )}

        {transcript.map((entry, i) => {
          const isUser = entry.speaker === "Defense";
          const isObjection = entry.type === "objection";
          const isSystem = entry.type === "system";

          if (isObjection) {
            return (
              <div key={i} className="flex justify-center my-4 animate-in zoom-in-95 duration-300">
                <div className="bg-destructive text-destructive-foreground px-6 py-2 rounded-full font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
                  <ShieldAlert className="w-5 h-5" />
                  {entry.content}
                </div>
              </div>
            );
          }

          if (isSystem) {
            return (
              <div key={i} className="flex justify-center my-2 text-xs text-muted-foreground italic">
                {entry.content}
              </div>
            );
          }

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-1 max-w-[85%]",
                isUser ? "self-end items-end" : "self-start items-start"
              )}
            >
              <span className="text-xs font-medium text-muted-foreground ml-1">
                {entry.speaker}
              </span>
              <div
                className={cn(
                  "px-4 py-3 rounded-2xl text-sm shadow-sm border",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-sm border-primary/20"
                    : cn("rounded-tl-sm", getSpeakerColor(entry.speaker))
                )}
              >
                {entry.content}
              </div>
            </div>
          );
        })}

        {streamingSpeaker && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse ml-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            {streamingSpeaker} is speaking...
          </div>
        )}
      </div>
    </div>
  );
}
