"use client";

import { User, Mic, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OBJECTION_GROUNDS } from "./types";

interface ControlsBarProps {
  currentTurn: string;
  input: string;
  setInput: (value: string) => void;
  onSendStatement: () => void;
  onSendObjection: (ground: string) => void;
}

export function ControlsBar({
  currentTurn,
  input,
  setInput,
  onSendStatement,
  onSendObjection,
}: ControlsBarProps) {
  return (
    <div className="border-t bg-background px-4 py-3 shrink-0 z-20">
      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            {currentTurn === "Defense" ? (
              <span className="text-blue-600 flex items-center gap-2">
                <User className="w-4 h-4" /> Your Turn
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />{" "}
                {currentTurn ? `${currentTurn} speaking` : "Waiting..."}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {OBJECTION_GROUNDS.map((ground) => (
              <Button
                key={ground}
                variant="outline"
                size="sm"
                className="text-xs h-7 border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-colors uppercase font-semibold"
                onClick={() => onSendObjection(ground)}
                disabled={currentTurn === "Defense"}
              >
                {ground}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            className="h-11 text-sm"
            placeholder={
              currentTurn === "Defense"
                ? "Type your objection or cross-examination..."
                : "Listen to the testimony..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSendStatement()}
            disabled={currentTurn !== "Defense"}
            autoFocus
          />
          <Button
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={onSendStatement}
            disabled={currentTurn !== "Defense" || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
