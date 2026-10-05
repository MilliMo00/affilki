"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { getConsent, setConsent } from "@/lib/track";

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Баннер согласия на cookie. Отказ от аналитических — события идут без идентификатора посетителя. */
export function CookieBanner() {
  // На сервере и до гидратации баннера нет: решение хранится в cookie браузера.
  const undecided = useSyncExternalStore(
    subscribe,
    () => getConsent() === null,
    () => false,
  );
  if (!undecided) return null;

  const choose = (value: "all" | "necessary") => {
    setConsent(value);
    listeners.forEach((l) => l());
  };

  return (
    <div
      role="region"
      aria-label="Согласие на cookie"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-petal bg-deep/95 backdrop-blur-md"
    >
      <div className="container-page flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text">
          Мы используем cookie для входа и голосования, а также для анонимной статистики посещений.{" "}
          <Link href="/privacy" className="text-paper underline underline-offset-4">
            Подробнее
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="secondary" onClick={() => choose("necessary")}>
            Только необходимые
          </Button>
          <Button size="sm" onClick={() => choose("all")}>
            Принять все
          </Button>
        </div>
      </div>
    </div>
  );
}
