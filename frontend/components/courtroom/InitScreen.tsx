"use client";

import { Gavel, Play, Loader2 } from "lucide-react";
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

export function InitScreen({ caseName, setCaseName, isLoading, onStart }: InitScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Gavel className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Courtroom AI Simulator</CardTitle>
          <CardDescription>
            Enter the courtroom as the Defense Attorney.
            Cross-examine witnesses, object to prosecution, and sway the jury.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Case Name</label>
            <Input
              placeholder="e.g. The People vs. John Doe"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              className="text-lg"
              onKeyDown={(e) => e.key === "Enter" && onStart()}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full h-12 text-lg gap-2"
            onClick={onStart}
            disabled={isLoading || !caseName.trim()}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Play className="w-4 h-4" />}
            {isLoading ? "Preparing Case File..." : "Enter Courtroom"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
