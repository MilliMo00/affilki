"use client";

import { Check } from "lucide-react";
import { useCallback, useState } from "react";
import { PetalIcon } from "@/components/brand/PetalIcon";
import { cn } from "@/lib/cn";
import { sessionActions, useSession, voteKey } from "@/lib/session-store";
import { RayBurst } from "./RayBurst";

type VoteButtonProps = {
  nominationId: string;
  nomineeSlug: string;
  nomineeName: string;
  /** Крупная кнопка с именем — для страницы участника. */
  large?: boolean;
  className?: string;
};

export function VoteButton({ nominationId, nomineeSlug, nomineeName, large, className }: VoteButtonProps) {
  const { votes, burst } = useSession();
  const [justVoted, setJustVoted] = useState(false);

  const current = votes[nominationId];
  const mine = current === nomineeSlug;
  const bursting = burst === voteKey(nominationId, nomineeSlug);

  const onBurstDone = useCallback(() => {
    sessionActions.clearBurst();
    setJustVoted(true);
    window.setTimeout(() => setJustVoted(false), 2200);
  }, []);

  const label = mine
    ? justVoted || bursting
      ? "Голос засчитан"
      : "Твой голос"
    : current
      ? large
        ? `Отдать голос за ${nomineeName}`
        : "Отдать голос сюда"
      : large
        ? `Голосовать за ${nomineeName}`
        : "Голосовать";

  return (
    <span className={cn("relative inline-flex", large && "w-full sm:w-auto", className)}>
      <button
        type="button"
        aria-pressed={mine}
        aria-label={mine ? `Твой голос отдан за ${nomineeName}` : `Голосовать за ${nomineeName}`}
        disabled={mine}
        onClick={() => sessionActions.vote({ nominationId, nomineeSlug, nomineeName })}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full font-semibold transition-colors",
          large ? "min-h-14 px-8 py-3 text-lg" : "h-11 px-5 text-base",
          mine
            ? "border border-paper bg-transparent text-paper"
            : "focus-on-bright bg-paper text-deep hover:bg-text",
        )}
      >
        {mine ? (
          justVoted || bursting ? (
            <PetalIcon size={large ? 20 : 16} filled />
          ) : (
            <Check size={large ? 20 : 18} strokeWidth={1.75} aria-hidden />
          )
        ) : (
          <PetalIcon size={large ? 20 : 16} />
        )}
        <span aria-live="polite">{label}</span>
      </button>
      {bursting && <RayBurst size={large ? 300 : 220} onDone={onBurstDone} />}
    </span>
  );
}
