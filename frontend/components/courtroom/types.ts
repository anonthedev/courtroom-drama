export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_BASE = API_BASE.replace(/^http/, "ws");

export const OBJECTION_GROUNDS = [
  "Hearsay",
  "Relevance",
  "Leading",
  "Speculation",
  "Argumentative",
];

export type TranscriptEntry = {
  speaker: string;
  content: string;
  isPartial?: boolean;
  type?: "statement" | "objection" | "system";
};

export type Juror = {
  juror_id: number;
  persona_type: string;
  sentiment_score: number;
  reasoning: string;
};

export const getSpeakerColor = (speaker: string) => {
  switch (speaker) {
    case "Prosecution":
      return "text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900";
    case "Witness":
      return "text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900";
    case "Judge":
      return "text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200 dark:border-purple-900";
    case "Defense":
      return "text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-900";
    default:
      return "text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400";
  }
};

export const getSentimentColor = (score: number) => {
  if (score > 65) return "bg-red-500";
  if (score < 35) return "bg-green-500";
  return "bg-yellow-500";
};
