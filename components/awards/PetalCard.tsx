import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PetalCardProps = {
  /** winner/finalist — единственное место, где появляется цвет пыльцы. */
  tone?: "default" | "finalist" | "winner";
  className?: string;
  children: ReactNode;
};

const BADGES = { finalist: "Финалист", winner: "Победитель" } as const;

/** Карточка-лепесток: только для сущностей премии (номинация, участник, победитель). */
export function PetalCard({ tone = "default", className, children }: PetalCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-petal border bg-surface p-5 sm:p-6",
        tone === "default" ? "border-petal" : "border-pollen",
        className,
      )}
    >
      {tone !== "default" && (
        <span
          className={cn(
            "absolute -top-3 right-5 rounded-full px-3 py-1 text-sm font-semibold",
            tone === "winner" ? "bg-pollen text-ink" : "border border-pollen bg-surface text-pollen",
          )}
        >
          {BADGES[tone]}
        </span>
      )}
      {children}
    </div>
  );
}
