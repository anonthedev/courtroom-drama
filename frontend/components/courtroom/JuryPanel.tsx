"use client";

import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Juror, getSentimentColor } from "./types";

interface JuryPanelProps {
  jurors: Juror[];
}

export function JuryPanel({ jurors }: JuryPanelProps) {
  return (
    <div className="w-80 border-l bg-muted/10 hidden lg:flex flex-col shrink-0 h-full">
      <div className="p-4 border-b flex items-center gap-2 bg-background/50 shrink-0">
        <Users className="w-5 h-5" />
        <h2 className="font-semibold">Jury Panel</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          {jurors.length}/12
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-4 h-full">
        <div className="grid grid-cols-1 gap-3 pb-4">
          {jurors.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm px-4">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
              Jurors will appear once the trial begins.
            </div>
          ) : (
            jurors.map((juror) => (
              <Card
                key={juror.juror_id}
                className="overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-1 w-full flex">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${100 - juror.sentiment_score}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all duration-500"
                    style={{ width: `${juror.sentiment_score}%` }}
                  />
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold uppercase text-muted-foreground">
                        Juror #{juror.juror_id}
                      </div>
                      <div className="font-semibold text-sm">{juror.persona_type}</div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn("text-white border-0", getSentimentColor(juror.sentiment_score))}
                    >
                      {juror.sentiment_score}%
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {juror.reasoning}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background/50 text-xs text-center text-muted-foreground shrink-0">
        <div className="flex justify-center gap-4 mb-2">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" /> Innocent
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" /> Guilty
          </span>
        </div>
        Sentiment Analysis Live Feed
      </div>
    </div>
  );
}
