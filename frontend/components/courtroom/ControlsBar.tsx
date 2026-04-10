"use client";

import { User, Send, Sparkles, AlertTriangle, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OBJECTION_GROUNDS } from "./types";
import { cn } from "@/lib/utils";

interface ControlsBarProps {
  currentTurn: string;
  input: string;
  setInput: (value: string) => void;
  onSendStatement: () => void;
  onSendObjection: (ground: string) => void;
  isListening: boolean;
  sttSupported: boolean;
  onToggleMic: () => void;
}

export function ControlsBar({
  currentTurn,
  input,
  setInput,
  onSendStatement,
  onSendObjection,
  isListening,
  sttSupported,
  onToggleMic,
}: ControlsBarProps) {
  const isDefenseTurn = currentTurn === "Defense";

  return (
    <div className="border-t border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 p-4 shrink-0 z-30 relative shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.3)]">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border",
              isDefenseTurn 
                ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
                : "bg-muted/50 text-muted-foreground border-border/50"
            )}>
              {isDefenseTurn ? (
                <><User className="w-3.5 h-3.5" /> Your Turn</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5 animate-pulse" /> {currentTurn ? `${currentTurn} speaking` : "Waiting..."}</>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {OBJECTION_GROUNDS.map((ground) => (
              <Button
                key={ground}
                variant="outline"
                size="sm"
                className="text-xs h-8 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all uppercase font-bold tracking-wider shadow-sm hover:shadow-destructive/20 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-destructive"
                onClick={() => onSendObjection(ground)}
                disabled={isDefenseTurn || !currentTurn}
              >
                <AlertTriangle className="w-3 h-3 mr-1.5 opacity-70" />
                {ground}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative flex gap-3 items-end">
          <div className="relative flex-1 group">
            <div className={cn(
              "absolute -inset-0.5 rounded-xl blur transition duration-500",
              isDefenseTurn ? "bg-primary/20 opacity-100" : "bg-transparent opacity-0"
            )} />
            <Input
              className={cn(
                "relative h-14 text-base rounded-xl bg-background/90 border-input shadow-inner transition-all",
                isDefenseTurn 
                  ? "focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground" 
                  : "bg-muted/30 cursor-not-allowed text-muted-foreground"
              )}
              placeholder={
                isDefenseTurn
                  ? "Type your statement, cross-examination, or response..."
                  : "Listen to the testimony and prepare objections..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), onSendStatement())}
              disabled={!isDefenseTurn}
              autoFocus
            />
          </div>
          
          {sttSupported && (
            <Button
              size="icon"
              className={cn(
                "h-14 w-14 shrink-0 rounded-xl shadow-lg transition-all duration-300",
                isListening
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 ring-2 ring-destructive/30 ring-offset-2 ring-offset-background animate-pulse"
                  : isDefenseTurn
                    ? "bg-muted/80 text-foreground hover:bg-muted hover:scale-105"
                    : "bg-muted text-muted-foreground shadow-none"
              )}
              onClick={onToggleMic}
              disabled={!isDefenseTurn && !isListening}
              title={isListening ? "Stop listening" : "Speak your statement"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}

          <Button
            size="icon"
            className={cn(
              "h-14 w-14 shrink-0 rounded-xl shadow-lg transition-all duration-300",
              isDefenseTurn && input.trim() 
                ? "bg-primary text-primary-foreground hover:scale-105 hover:shadow-primary/25" 
                : "bg-muted text-muted-foreground shadow-none"
            )}
            onClick={onSendStatement}
            disabled={!isDefenseTurn || !input.trim()}
          >
            <Send className={cn("w-5 h-5", isDefenseTurn && input.trim() && "ml-1")} />
          </Button>
        </div>
      </div>
    </div>
  );
}
