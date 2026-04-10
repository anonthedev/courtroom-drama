"use client";

import { Users, AlertCircle, BrainCircuit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Juror, getSentimentColor } from "./types";
import { Progress } from "@/components/ui/progress";

interface JuryPanelProps {
  jurors: Juror[];
}

export function JuryPanel({ jurors }: JuryPanelProps) {
  // Calculate average sentiment
  const avgSentiment = jurors.length > 0 
    ? Math.round(jurors.reduce((acc, j) => acc + j.sentiment_score, 0) / jurors.length) 
    : 50;

  return (
    <div className="w-80 lg:w-96 border-l border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden lg:flex flex-col shrink-0 h-full min-h-0 overflow-hidden relative z-10">
      <div className="p-5 border-b border-border/50 flex flex-col gap-4 shrink-0 bg-card/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold tracking-tight">Jury Panel</h2>
              <p className="text-xs text-muted-foreground">{jurors.length}/12 Seated</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
            Live Analysis
          </Badge>
        </div>

        {jurors.length > 0 && (
          <div className="space-y-2 bg-background/40 p-3 rounded-xl border border-border/50">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-green-500">Leaning Innocent</span>
              <span className="text-red-500">Leaning Guilty</span>
            </div>
            <div className="h-2 w-full flex rounded-full overflow-hidden bg-muted">
              <div 
                className="h-full bg-green-500 transition-all duration-1000 ease-out"
                style={{ width: `${100 - avgSentiment}%` }}
              />
              <div 
                className="h-full bg-red-500 transition-all duration-1000 ease-out"
                style={{ width: `${avgSentiment}%` }}
              />
            </div>
            <div className="text-center text-xs text-muted-foreground font-medium pt-1">
              Overall Sentiment: {avgSentiment}%
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-5">
        <div className="grid grid-cols-1 gap-4 pb-8">
          {jurors.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground px-4 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-medium text-sm">Awaiting Jury Selection</p>
              <p className="text-xs mt-1 opacity-70">Jurors will appear once the trial begins.</p>
            </div>
          ) : (
            jurors.map((juror) => (
              <Card
                key={juror.juror_id}
                className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/20 group"
              >
                <div className="h-1.5 w-full flex">
                  <div
                    className="h-full bg-green-500/80 transition-all duration-700 ease-out"
                    style={{ width: `${100 - juror.sentiment_score}%` }}
                  />
                  <div
                    className="h-full bg-red-500/80 transition-all duration-700 ease-out"
                    style={{ width: `${juror.sentiment_score}%` }}
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        #{juror.juror_id}
                      </div>
                      <div>
                        <div className="font-semibold text-sm leading-none mb-1 group-hover:text-primary transition-colors">
                          {juror.persona_type}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          <BrainCircuit className="w-3 h-3" />
                          Analysis
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("text-white border-0 shadow-sm transition-colors", getSentimentColor(juror.sentiment_score))}
                    >
                      {juror.sentiment_score}%
                    </Badge>
                  </div>

                  <div className="bg-background/50 rounded-lg p-3 text-xs text-muted-foreground leading-relaxed border border-border/30">
                    {juror.reasoning}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="px-4 pt-4 pb-5 border-t border-border/50 bg-card/30 backdrop-blur shrink-0">
        <div className="flex items-center justify-center gap-6 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            Innocent
          </span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            Guilty
          </span>
        </div>
      </div>
    </div>
  );
}
