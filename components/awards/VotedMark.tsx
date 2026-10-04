"use client";

import { Check } from "lucide-react";
import { useSession } from "@/lib/session-store";

/** Отметка «Ты проголосовал» на карточке номинации. */
export function VotedMark({ nominationId }: { nominationId: string }) {
  const { votes } = useSession();
  if (!votes[nominationId]) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/60 px-3 py-1 text-sm font-medium text-paper">
      <Check size={15} strokeWidth={1.75} aria-hidden />
      Ты проголосовал
    </span>
  );
}
