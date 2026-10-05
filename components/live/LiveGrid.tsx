"use client";

import { Maximize, Minimize } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/format";
import { useLive } from "@/lib/live-store";
import type { LiveSnapshot } from "@/lib/live/types";
import { LiveNotice } from "./LiveBoard";
import { LiveIndicator } from "./LiveIndicator";
import { LiveRows } from "./LiveRows";

/** Общее табло всех номинаций: топ-5 в каждой. Подходит для экрана на ивенте. */
export function LiveGrid({ initial, title }: { initial: LiveSnapshot; title: string }) {
  const snapshot = useLive(initial) ?? initial;
  const ref = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = () => (document.fullscreenElement ? document.exitFullscreen() : ref.current?.requestFullscreen());
  const open = snapshot.status === "live" || snapshot.status === "final";
  const final = snapshot.status === "final";

  return (
    <div ref={ref} className={cn("bg-indigo", fullscreen && "overflow-y-auto")}>
      <div className={cn("container-page py-10 sm:py-14", fullscreen && "!max-w-none")}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className={fullscreen ? "text-4xl" : "text-3xl sm:text-4xl"}>{title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              {open && !final && <LiveIndicator updatedAt={snapshot.updatedAt} large={fullscreen} />}
              <p className={cn("text-muted-bright", fullscreen && "text-lg")}>
                Голосов отдано:{" "}
                <span className="font-display font-bold tabular-nums text-paper">{formatCount(snapshot.totalVotes)}</span>
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={toggle}>
            {fullscreen ? <Minimize size={18} strokeWidth={1.75} aria-hidden /> : <Maximize size={18} strokeWidth={1.75} aria-hidden />}
            {fullscreen ? "Выйти из полного экрана" : "Полный экран"}
          </Button>
        </div>

        <div className="mt-8">
          {!open ? (
            <LiveNotice snapshot={snapshot} />
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {snapshot.nominations.map((nomination) => (
                <li key={nomination.slug} className="rounded-petal border border-petal bg-surface p-5">
                  <h2 className={cn("mb-4 font-sans font-semibold", fullscreen ? "text-xl" : "text-lg")}>
                    <Link href={`/awards/${nomination.slug}?tab=live`} className="hover:underline">
                      {nomination.title}
                    </Link>
                  </h2>
                  {nomination.state === "collecting" ? (
                    <p className="py-6 text-center text-muted-bright">Набираем голоса</p>
                  ) : (
                    <LiveRows rows={nomination.rows.slice(0, 5)} final={final} compact />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-8 text-sm text-muted-bright">Показаны голоса комьюнити. Аннулированные голоса не учитываются.</p>
      </div>
    </div>
  );
}
