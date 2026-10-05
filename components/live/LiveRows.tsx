"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { NomineeAvatar } from "@/components/awards/NomineeAvatar";
import { cn } from "@/lib/cn";
import type { LiveRow } from "@/lib/live/types";

type LiveRowsProps = {
  rows: LiveRow[];
  /** Итоги объявлены: только тогда лидер получает цвет пыльцы. */
  final: boolean;
  /** Подсветить строку участника (страница участника). */
  highlight?: string;
  large?: boolean;
  compact?: boolean;
};

/** Строки табло: полосы плавно меняют длину, строки — порядок. */
export function LiveRows({ rows, final, highlight, large, compact }: LiveRowsProps) {
  const reduced = useReducedMotion();
  const transition = reduced ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <ol className={compact ? "space-y-2" : "space-y-3"}>
      {rows.map((row) => {
        const winner = final && row.place === 1;
        return (
          <motion.li
            key={row.slug}
            layout={!reduced}
            transition={transition}
            className={cn(
              "rounded-card",
              !compact && "border border-petal bg-deep/50 p-3 sm:p-4",
              highlight === row.slug && "border-paper",
              winner && !compact && "border-pollen",
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn("w-6 shrink-0 text-center font-display font-bold tabular-nums text-paper/60", large && "w-10 text-2xl")}>
                {row.place}
              </span>
              {!compact && <NomineeAvatar name={row.name} logoUrl={row.logoUrl} size={large ? 48 : 36} />}
              <Link
                href={`/n/${row.slug}`}
                className={cn("min-w-0 flex-1 truncate font-semibold text-paper hover:underline", large ? "text-xl" : compact ? "text-sm" : "text-base")}
              >
                {row.name}
              </Link>
              <span className={cn("shrink-0 font-display font-bold tabular-nums text-paper", large ? "text-2xl" : compact ? "text-sm" : "text-lg")}>
                {row.percent}%
              </span>
              {row.count !== undefined && <span className="w-14 shrink-0 text-right text-sm tabular-nums text-muted-bright">{row.count}</span>}
            </div>
            <div className={cn("overflow-hidden rounded-full bg-ink/50", compact ? "ml-9 mt-1 h-1.5" : "mt-3 h-2", large && "h-3")}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: winner ? "linear-gradient(90deg, var(--glow), var(--pollen))" : "var(--glow)" }}
                initial={false}
                animate={{ width: `${row.percent}%` }}
                transition={transition}
              />
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
