"use client";

import { useSyncExternalStore } from "react";
import type { LiveSnapshot } from "@/lib/live/types";

// Одно соединение на вкладку: все live-компоненты страницы читают общий снимок.
let snapshot: LiveSnapshot | null = null;
let started = false;
const listeners = new Set<() => void>();

function publish(next: LiveSnapshot | null) {
  if (!next) return;
  snapshot = next;
  listeners.forEach((l) => l());
}

function poll() {
  const tick = async () => {
    try {
      publish(await (await fetch("/api/live/snapshot", { cache: "no-store" })).json());
    } catch {}
    window.setTimeout(tick, Math.max(5, snapshot?.refreshSec ?? 15) * 1000);
  };
  tick();
}

function start() {
  if (started) return;
  started = true;
  // Нет SSE или соединение рвётся раз за разом — переходим на обычный опрос.
  if (typeof EventSource === "undefined") return poll();

  let failures = 0;
  const source = new EventSource("/api/live/stream");
  source.onmessage = (event) => {
    failures = 0;
    try {
      publish(JSON.parse(event.data));
    } catch {}
  };
  source.onerror = () => {
    failures += 1;
    if (failures >= 3) {
      source.close();
      poll();
    }
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

/** Текущий снимок live-результатов; до первого обновления — тот, что пришёл с сервером в HTML. */
export function useLive(initial: LiveSnapshot | null) {
  return useSyncExternalStore(
    subscribe,
    () => snapshot ?? initial,
    () => initial,
  );
}
