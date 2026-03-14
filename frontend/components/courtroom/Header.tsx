"use client";

import { Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  sessionId: string;
}

export function Header({ sessionId }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-2 font-semibold text-lg">
        <Gavel className="w-5 h-5 text-primary" />
        <span className="hidden sm:inline">Courtroom AI</span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          {sessionId.slice(0, 8)}...
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          Leave Trial
        </Button>
      </div>
    </header>
  );
}
