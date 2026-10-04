"use client";

import { useSession } from "@/lib/session-store";

type VoteStatusProps = {
  nominationId: string;
  nomineeSlug: string;
  /** slug → название, чтобы сказать, за кого отдан голос. */
  names: Record<string, string>;
};

/** Подсказка на странице участника: за кого уже отдан голос в этой номинации. */
export function VoteStatus({ nominationId, nomineeSlug, names }: VoteStatusProps) {
  const { votes } = useSession();
  const current = votes[nominationId];
  if (!current) return null;

  return (
    <p className="text-muted-bright" role="status">
      {current === nomineeSlug
        ? "До конца голосования выбор можно сменить."
        : `Твой голос в этой номинации уже отдан — за ${names[current] ?? "другого участника"}. До конца голосования его можно сменить.`}
    </p>
  );
}
