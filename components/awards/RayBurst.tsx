"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

const RAY_COUNT = 16;

type RayBurstProps = {
  /** Диаметр вспышки в px. */
  size?: number;
  color?: string;
  onDone?: () => void;
};

/**
 * Лучевая вспышка из центра — «момент признания». Используется только в двух местах:
 * подтверждение голоса и объявление победителя (ТЗ 2.1).
 */
export function RayBurst({ size = 240, color = "var(--paper)", onDone }: RayBurstProps) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) onDone?.();
  }, [reduced, onDone]);

  if (reduced) return null;

  return (
    <svg
      aria-hidden
      viewBox="-100 -100 200 200"
      width={size}
      height={size}
      className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 overflow-visible"
    >
      <g stroke={color} strokeWidth={3} strokeLinecap="round">
        {Array.from({ length: RAY_COUNT }, (_, i) => (
          <motion.line
            key={i}
            x1={0}
            y1={-34}
            x2={0}
            y2={i % 2 ? -72 : -96}
            transform={`rotate(${(360 / RAY_COUNT) * i})`}
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
            transition={{ duration: 0.7, times: [0, 0.45, 1], ease: "easeOut" }}
            onAnimationComplete={i === 0 ? onDone : undefined}
          />
        ))}
      </g>
    </svg>
  );
}
