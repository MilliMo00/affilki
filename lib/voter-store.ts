"use client";

import { useSyncExternalStore } from "react";

// Состояние голосующего в браузере: кто вошёл и за кого уже отдан голос.
// Источник правды — сервер (/api/me); здесь только копия для интерфейса.

export type VoteTarget = {
  nominee: { slug: string; name: string };
  nomination: { slug: string; title: string };
};

type Me = {
  user: { name: string; username: string | null } | null;
  /** slug номинации → участник, за которого отдан голос. */
  votes: Record<string, { slug: string; name: string }>;
};

type State = Me & {
  loaded: boolean;
  /** Открытый диалог голосования. */
  target: VoteTarget | null;
  /** slug участника, на чьей кнопке играет вспышка после голоса. */
  burst: string | null;
};

const EMPTY: State = { loaded: false, user: null, votes: {}, target: null, burst: null };

let state = EMPTY;
let requested = false;
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!requested) {
    requested = true;
    fetch("/api/me")
      .then((res) => res.json())
      .then((me: Me) => set({ ...me, loaded: true }))
      .catch(() => set({ loaded: true }));
  }
  return () => listeners.delete(listener);
}

export const voter = {
  open: (target: VoteTarget) => set({ target }),
  close: () => set({ target: null }),
  setMe: (me: Me) => set({ ...me, loaded: true }),
  voted: (votes: Me["votes"], nomineeSlug: string) => set({ votes, target: null, burst: nomineeSlug }),
  clearBurst: () => set({ burst: null }),
  async logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    set({ user: null, votes: {} });
  },
};

export function useVoter() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}
