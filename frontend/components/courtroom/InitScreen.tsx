"use client";

import { Gavel, Play, Loader2, Sparkles, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface InitScreenProps {
  caseName: string;
  setCaseName: (name: string) => void;
  isLoading: boolean;
  onStart: () => void;
}

const DUMMY_CASES = [
  "The State vs. Cyberdyne Systems",
  "The People vs. John Doe",
  "Apple Inc. vs. Epic Games",
  "United States vs. Microsoft Corp."
];

export function InitScreen({ caseName, setCaseName, isLoading, onStart }: InitScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Sleek background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />

      <Card className="w-full max-w-xl shadow-2xl border-white/10 bg-card/80 backdrop-blur-xl z-10">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit mb-6 ring-1 ring-primary/20 shadow-inner">
            <Scale className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight mb-2">Courtroom AI Simulator</CardTitle>
          <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
            Step into the courtroom. Cross-examine witnesses, raise objections, and sway the jury in real-time.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Gavel className="w-4 h-4 text-primary" />
              Enter Case Name
            </label>
            <Input
              placeholder="e.g. The People vs. John Doe"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              className="text-lg h-14 bg-background/50 border-input shadow-sm transition-all focus-visible:ring-primary focus-visible:border-primary"
              onKeyDown={(e) => e.key === "Enter" && onStart()}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Try a sample case</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DUMMY_CASES.map((dummyCase) => (
                <button
                  key={dummyCase}
                  onClick={() => setCaseName(dummyCase)}
                  className="px-3 py-1.5 text-sm rounded-full bg-secondary/50 hover:bg-primary/20 hover:text-primary text-secondary-foreground transition-colors border border-transparent hover:border-primary/30 active:scale-95"
                >
                  {dummyCase}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-2 pb-8">
          <Button
            className="w-full h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 gap-2 rounded-xl"
            onClick={onStart}
            disabled={isLoading || !caseName.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing Case File...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Enter Courtroom
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
