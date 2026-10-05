"use client";

import { LogOut } from "lucide-react";
import { voter, useVoter } from "@/lib/voter-store";

/** Кто вошёл через бота, и кнопка выхода. Пока никто не вошёл — ничего не показывает. */
export function VoterBadge() {
  const { user } = useVoter();
  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      <span className="hidden max-w-32 truncate text-sm text-muted-bright sm:block">{user.name}</span>
      <button
        type="button"
        aria-label={`Выйти (${user.name})`}
        title="Выйти"
        onClick={voter.logout}
        className="flex size-11 items-center justify-center rounded-full text-text transition-colors hover:bg-paper/10 hover:text-paper"
      >
        <LogOut size={20} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
