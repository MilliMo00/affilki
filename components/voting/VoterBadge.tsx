"use client";

import { Inbox, LogOut } from "lucide-react";
import Link from "next/link";
import { voter, useVoter } from "@/lib/voter-store";

/** Кто вошёл через бота, и кнопка выхода. Пока никто не вошёл — ничего не показывает. */
export function VoterBadge() {
  const { user, inbox = 0 } = useVoter();
  if (!user) return null;

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/my"
        aria-label={inbox > 0 ? `Мои заявки: ${inbox} вернулось с правками` : "Мои заявки"}
        title="Мои заявки"
        className="relative flex size-11 items-center justify-center rounded-full text-text transition-colors hover:bg-paper/10 hover:text-paper"
      >
        <Inbox size={20} strokeWidth={1.75} aria-hidden />
        {inbox > 0 && <span className="absolute right-2 top-2 size-2.5 rounded-full bg-danger" aria-hidden />}
      </Link>
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
