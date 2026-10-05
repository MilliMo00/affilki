"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { flush, track } from "@/lib/track";

const DEPTHS = [25, 50, 75, 100];

/** Автоматические события: просмотры страниц, показы и клики рекламных слотов, глубина чтения статей. */
export function Tracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  // Уход со страницы: дослать накопленное через sendBeacon.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush(true);
    const onPageHide = () => flush(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  // Клики по слотам — и проданным, и заглушкам «Слот свободен» (это лиды на продажу рекламы).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const slot = (e.target as Element | null)?.closest<HTMLElement>("[data-ad-slot]");
      if (slot) track("ad_click", { slot: slot.dataset.adSlot ?? "", sold: slot.dataset.adSold === "true" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    track("page_view");

    // Показ засчитывается, когда слот виден хотя бы наполовину не меньше секунды; один раз за просмотр страницы.
    const timers = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slot = entry.target as HTMLElement;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (timers.has(slot)) continue;
            timers.set(
              slot,
              window.setTimeout(() => {
                track("ad_impression", { slot: slot.dataset.adSlot ?? "", sold: slot.dataset.adSold === "true" });
                observer.unobserve(slot);
              }, 1000),
            );
          } else {
            window.clearTimeout(timers.get(slot));
            timers.delete(slot);
          }
        }
      },
      { threshold: [0.5] },
    );
    document.querySelectorAll("[data-ad-slot]").forEach((slot) => observer.observe(slot));

    // Глубина чтения — только на страницах статей.
    const body = document.querySelector<HTMLElement>("[data-article]");
    const reached = new Set<number>();
    const onScroll = () => {
      if (!body) return;
      const rect = body.getBoundingClientRect();
      const read = ((window.innerHeight - rect.top) / rect.height) * 100;
      for (const depth of DEPTHS) {
        if (read >= depth && !reached.has(depth)) {
          reached.add(depth);
          track("article_read", { depth });
        }
      }
    };
    if (body) {
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    return () => {
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname, search]);

  return null;
}
