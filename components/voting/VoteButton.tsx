"use client";

import { Check } from "lucide-react";
import { useCallback, useState } from "react";
import { RayBurst } from "@/components/awards/RayBurst";
import { PetalIcon } from "@/components/brand/PetalIcon";
import { cn } from "@/lib/cn";
import { track } from "@/lib/track";
import { voter, useVoter, type VoteTarget } from "@/lib/voter-store";

type VoteButtonProps = VoteTarget & {
  /** Крупная кнопка с именем — для страницы участника. */
  large?: boolean;
  className?: string;
};

export function VoteButton({ nominee, nomination, large, className }: VoteButtonProps) {
  const { votes, burst } = useVoter();
  const [justVoted, setJustVoted] = useState(false);

  const current = votes[nomination.slug];
  const mine = current?.slug === nominee.slug;
  const bursting = burst === nominee.slug;
  const fresh = justVoted || bursting;

  const onBurstDone = useCallback(() => {
    voter.clearBurst();
    setJustVoted(true);
    window.setTimeout(() => setJustVoted(false), 2200);
  }, []);

  // Голос окончательный: если он отдан другому участнику, здесь голосовать уже нельзя.
  if (current && !mine) {
    return (
      <p className={cn("text-sm text-muted-bright", large && "text-base", className)}>
        Твой голос в этой номинации отдан за «{current.name}»
      </p>
    );
  }

  return (
    <span className={cn("relative inline-flex", large && "w-full sm:w-auto", className)}>
      <button
        type="button"
        disabled={mine}
        aria-label={mine ? `Твой голос отдан за ${nominee.name}` : `Голосовать за ${nominee.name}`}
        onClick={() => {
          track("vote_click", { nominee: nominee.slug, nomination: nomination.slug });
          voter.open({ nominee, nomination });
        }}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full font-semibold transition-colors",
          large ? "min-h-14 px-8 py-3 text-lg" : "h-11 px-5 text-base",
          mine ? "border border-paper bg-transparent text-paper" : "focus-on-bright bg-paper text-deep hover:bg-text",
        )}
      >
        {mine ? (
          fresh ? (
            <PetalIcon size={large ? 20 : 16} filled />
          ) : (
            <Check size={large ? 20 : 18} strokeWidth={1.75} aria-hidden />
          )
        ) : (
          <PetalIcon size={large ? 20 : 16} />
        )}
        <span aria-live="polite">
          {mine ? (fresh ? "Голос засчитан" : "Твой голос") : large ? `Голосовать за ${nominee.name}` : "Голосовать"}
        </span>
      </button>
      {bursting && <RayBurst size={large ? 300 : 220} onDone={onBurstDone} />}
    </span>
  );
}
