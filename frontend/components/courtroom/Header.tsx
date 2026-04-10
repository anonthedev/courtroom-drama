"use client";

import { Gavel, DoorOpen, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  sessionId: string;
}

export function Header({ sessionId }: HeaderProps) {
  return (
    <header className="h-16 border-b border-white/5 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 shrink-0 z-30 sticky top-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl ring-1 ring-primary/20 shadow-inner">
          <Gavel className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">Courtroom AI</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 font-semibold">Live Simulation</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-background/50 backdrop-blur border-border/50">
          <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
          <span className="font-mono text-xs text-muted-foreground">ID: {sessionId.slice(0, 8)}</span>
        </Badge>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-2"
        >
          <DoorOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Leave Trial</span>
        </Button>
      </div>
    </header>
  );
}
