"use client";

import { Scale, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CaseSummaryProps {
  summary: string;
}

export function CaseSummary({ summary }: CaseSummaryProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="bg-card/40 backdrop-blur-sm border-b border-border/50 px-6 py-3 shrink-0 relative z-20 cursor-pointer hover:bg-card/60 transition-colors group">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="p-2 bg-secondary/50 rounded-lg shrink-0 text-secondary-foreground ring-1 ring-border/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5 shrink-0">
                Case Summary
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </h3>
              <div className="w-px h-4 bg-border/50 shrink-0" />
              <p className="text-sm text-muted-foreground/90 truncate">
                {summary}
              </p>
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl tracking-tight">
            <div className="p-2 bg-primary/10 rounded-xl ring-1 ring-primary/20">
              <Scale className="w-5 h-5 text-primary" />
            </div>
            Case Summary
          </DialogTitle>
          <DialogDescription className="text-base text-foreground/90 leading-relaxed pt-4 max-h-[60vh] overflow-y-auto">
            {summary}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
