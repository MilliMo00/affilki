"use client";

import { useSyncExternalStore } from "react";

// ДЕМО-РЕЖИМ. Пока нет базы и Telegram-входа, «сессия» и голоса живут в localStorage
// браузера и никуда не отправляются. В Фазе 5 этот модуль заменяется настоящей
// сессией и API голосования; интерфейс useSession() остаётся тем же.

export type SessionUser = { name: string; username: string };
export type PendingVote = { nominationId: string; nomineeSlug: string; nomineeName: string };

type Persisted = { user: SessionUser | null; votes: Record<string, string> };
type State = Persisted & {
  /** Открыт ли диалог входа. */
  loginOpen: boolean;
  /** Намерение проголосовать, сохранённое до входа (ТЗ 5.5). */
  pending: PendingVote | null;
  /** Ключ «номинация:участник», на чьей кнопке сейчас играет вспышка. */
  burst: string | null;
};

const KEY = "affilki-demo-session";
const EMPTY: State = { user: null, votes: {}, loginOpen: false, pending: null, burst: null };

let state = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function snapshot() {
  if (!loaded) {
    loaded = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as Persisted) };
    } catch {}
  }
  return state;
}

function set(patch: Partial<State>) {
  state = { ...snapshot(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify({ user: state.user, votes: state.votes }));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const voteKey = (nominationId: string, nomineeSlug: string) => `${nominationId}:${nomineeSlug}`;

function castVote({ nominationId, nomineeSlug }: PendingVote) {
  set({
    votes: { ...snapshot().votes, [nominationId]: nomineeSlug },
    burst: voteKey(nominationId, nomineeSlug),
    pending: null,
  });
}

export const sessionActions = {
  openLogin: (pending: PendingVote | null = null) => set({ loginOpen: true, pending }),
  closeLogin: () => set({ loginOpen: false, pending: null }),
  login() {
    const { pending } = snapshot();
    set({ user: { name: "Тестовый юзер", username: "test_user" }, loginOpen: false });
    // После входа голос засчитывается автоматически.
    if (pending) castVote(pending);
  },
  logout: () => set({ user: null, votes: {} }),
  /** Голос или смена голоса. Без входа — открывает диалог и запоминает намерение. */
  vote(vote: PendingVote) {
    if (!snapshot().user) return sessionActions.openLogin(vote);
    castVote(vote);
  },
  clearBurst: () => set({ burst: null }),
};

export function useSession() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
