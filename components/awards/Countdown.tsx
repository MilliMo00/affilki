"use client";

import { useEffect, useState } from "react";
import { plural } from "@/lib/format";

const UNITS = [
  { ms: 86_400_000, forms: ["день", "дня", "дней"] },
  { ms: 3_600_000, forms: ["час", "часа", "часов"] },
  { ms: 60_000, forms: ["минута", "минуты", "минут"] },
  { ms: 1000, forms: ["секунда", "секунды", "секунд"] },
] as const;

/** Таймер до даты. Время берётся с клиента только для отображения — окно голосования проверяет сервер. */
export function Countdown({ to, label }: { to: string; label: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = Math.max(0, target - now);
  const parts = UNITS.map((unit, i) => {
    const value = Math.floor((i === 0 ? left : left % UNITS[i - 1].ms) / unit.ms);
    return { value, word: plural(value, [...unit.forms]) };
  });

  return (
    <div role="timer" aria-label={label}>
      <p className="mb-2 text-sm text-muted-bright">{label}</p>
      <dl className="flex gap-2 sm:gap-3">
        {parts.map((part, i) => (
          <div key={i} className="min-w-[4.25rem] rounded-card border border-petal/60 bg-deep/70 px-2 py-2 text-center sm:min-w-20">
            {/* Секунды на сервере и клиенте расходятся — это ожидаемо. */}
            <dd className="font-display text-2xl font-bold tabular-nums text-paper sm:text-3xl" suppressHydrationWarning>
              {String(part.value).padStart(2, "0")}
            </dd>
            <dt className="text-sm text-muted-bright" suppressHydrationWarning>
              {part.word}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
