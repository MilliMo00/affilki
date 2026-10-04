"use client";

import { animate, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  FLOWER_VIEWBOX,
  PETAL_ANGLES,
  PETAL_PATH,
  RAYS,
  WORDMARK_LETTERS,
  WORDMARK_VIEWBOX,
} from "@/components/brand/geometry";
import { InlineScript } from "./InlineScript";

const STORAGE_KEY = "affilki-intro";

// Выполняется до первой отрисовки: решает, показывать ли интро в этой сессии.
// При prefers-reduced-motion интро не показывается вообще (ТЗ, раздел 8).
const BOOT_SCRIPT = `(function(){try{if(sessionStorage.getItem("${STORAGE_KEY}"))return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;sessionStorage.setItem("${STORAGE_KEY}","1");document.documentElement.setAttribute("data-intro","")}catch(e){}})()`;

const EASE = [0.22, 1, 0.36, 1] as const;
const FLY_AT_MS = 1400;
const FLY_S = 0.4;

const subscribe = () => () => {};
const introRequested = () => document.documentElement.hasAttribute("data-intro");

export function Intro() {
  // На сервере оверлей рендерится всегда (и скрыт CSS), на клиенте — только если скрипт его включил.
  const requested = useSyncExternalStore(subscribe, introRequested, () => true);
  const [done, setDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    document.documentElement.removeAttribute("data-intro");
    setDone(true);
  }, []);

  useEffect(() => {
    if (!requested || done) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    document.addEventListener("keydown", onKey);

    // 1.4–1.8s: композиция улетает на место логотипа в шапке, фон растворяется.
    const timer = window.setTimeout(() => {
      const comp = overlay.querySelector<HTMLElement>("[data-intro-comp]");
      const flower = comp?.querySelector("svg");
      const target = document.querySelector("[data-header-logo] svg");
      if (!comp || !flower || !target) return finish();

      const c = comp.getBoundingClientRect();
      const f = flower.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const scale = t.width / f.width;

      animate("[data-intro-bg], [data-intro-fade]", { opacity: 0 }, { duration: FLY_S, ease: "easeOut" });
      animate(
        comp,
        {
          x: t.left - c.left - (f.left - c.left) * scale,
          y: t.top - c.top - (f.top - c.top) * scale,
          scale,
        },
        { duration: FLY_S, ease: EASE },
      ).then(finish);
    }, FLY_AT_MS);

    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [requested, done, finish]);

  return (
    <>
      <InlineScript html={BOOT_SCRIPT} />
      {requested && !done && (
        <div ref={overlayRef} className="intro-overlay" onClick={finish}>
          <div data-intro-bg className="absolute inset-0 bg-deep">
            {/* 0–0.2s: разгорается радиальное свечение */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "radial-gradient(circle at 50% 50%, var(--glow) 0%, transparent 75%)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          <div
            data-intro-comp
            aria-hidden
            className="relative flex items-center text-paper"
            style={{ fontSize: "clamp(52px, 9vw, 104px)", gap: "0.28em", transformOrigin: "0 0" }}
          >
            <svg viewBox={FLOWER_VIEWBOX} style={{ width: "1em", height: "1em" }} className="shrink-0 overflow-visible">
              {/* 0.2–0.9s: лепестки раскрываются из центра по очереди */}
              {PETAL_ANGLES.map((angle, i) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <motion.g
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.08, type: "spring", bounce: 0, duration: 0.42 }}
                  >
                    {/* Невидимый квадрат центрирует bbox группы, чтобы лепесток рос из центра цветка. */}
                    <rect x={-100} y={-100} width={200} height={200} fill="none" />
                    <path d={PETAL_PATH} fill="currentColor" />
                  </motion.g>
                </g>
              ))}
              {/* 0.9–1.2s: лучи выстреливают из центра */}
              <g stroke="var(--indigo)" strokeWidth={2.6} strokeLinecap="round">
                {RAYS.map((ray) => (
                  <motion.line
                    key={ray.angle}
                    x1={0}
                    y1={-ray.from}
                    x2={0}
                    y2={-ray.to}
                    transform={`rotate(${ray.angle})`}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.3, ease: "easeOut", opacity: { delay: 0.9, duration: 0.01 } }}
                  />
                ))}
              </g>
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.15 }}>
                <circle r={9} fill="var(--indigo)" />
                <circle r={4} fill="currentColor" />
              </motion.g>
            </svg>

            <div className="relative">
              {/* 1.0–1.4s: буквы проявляются снизу вверх из-под маски */}
              <svg viewBox={WORDMARK_VIEWBOX} fill="currentColor" style={{ height: "0.56em", width: "2.6264em" }}>
                {WORDMARK_LETTERS.map((letter, i) => (
                  <g key={i} transform={`translate(${letter.x})`}>
                    <motion.path
                      d={letter.d}
                      fillRule="evenodd"
                      initial={{ y: 110 }}
                      animate={{ y: 0 }}
                      transition={{ delay: 1.0 + i * 0.03, duration: 0.22, ease: EASE }}
                    />
                  </g>
                ))}
              </svg>
              <motion.span
                data-intro-fade
                className="absolute left-0 right-0 top-full block text-center font-sans font-semibold leading-none"
                style={{ fontSize: "0.2em", marginTop: "0.9em" }}
                initial={{ opacity: 0, letterSpacing: "0.05em" }}
                animate={{ opacity: 1, letterSpacing: "0.42em" }}
                transition={{ delay: 1.1, duration: 0.3, ease: "easeOut" }}
              >
                AWARDS
              </motion.span>
            </div>
          </div>

          <button
            type="button"
            data-intro-fade
            onClick={finish}
            className="absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-medium text-muted-bright hover:bg-paper/10 hover:text-paper"
          >
            Пропустить
          </button>
        </div>
      )}
    </>
  );
}
