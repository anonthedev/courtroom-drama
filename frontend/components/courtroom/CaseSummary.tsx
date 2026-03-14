"use client";

import { Scale } from "lucide-react";

interface CaseSummaryProps {
  summary: string;
}

export function CaseSummary({ summary }: CaseSummaryProps) {
  return (
    <div className="bg-muted/30 border-b px-4 py-3 text-sm flex items-start gap-3 shrink-0">
      <Scale className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-muted-foreground line-clamp-2">{summary}</p>
    </div>
  );
}
