"use client";

import { useState, useSyncExternalStore } from "react";
import { RayBurst } from "./RayBurst";

const subscribe = () => () => {};

/** Лучевая вспышка у победителя — только при первом показе за сессию. */
export function WinnerBurst({ id }: { id: string }) {
  const key = `affilki-winner-${id}`;
  const firstShow = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(key) === null;
      } catch {
        return false;
      }
    },
    () => false,
  );
  const [done, setDone] = useState(false);

  if (!firstShow || done) return null;

  return (
    <RayBurst
      size={360}
      color="var(--pollen)"
      onDone={() => {
        try {
          sessionStorage.setItem(key, "1");
        } catch {}
        setDone(true);
      }}
    />
  );
}
