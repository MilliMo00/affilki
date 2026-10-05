"use client";

import { useEffect, useState } from "react";
import { plural } from "@/lib/format";

/** «Live» с пульсирующей точкой и подписью «обновлено N сек назад». */
export function LiveIndicator({ updatedAt, large }: { updatedAt: string; large?: boolean }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 1000);
    const first = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(first);
    };
  }, []);

  const seconds = now === null ? null : Math.max(0, Math.round((now - new Date(updatedAt).getTime()) / 1000));

  return (
    <p className={`flex items-center gap-2 ${large ? "text-lg" : "text-sm"} text-muted-bright`}>
      <span className="relative flex size-2.5">
        <span className="live-dot absolute inline-flex size-full rounded-full bg-paper" />
        <span className="relative inline-flex size-2.5 rounded-full bg-paper" />
      </span>
      <span className="font-semibold text-paper">Live</span>
      {seconds !== null && (
        <span>
          · обновлено {seconds} {plural(seconds, ["секунду", "секунды", "секунд"])} назад
        </span>
      )}
    </p>
  );
}
