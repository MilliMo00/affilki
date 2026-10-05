import { PetalIcon } from "@/components/brand/PetalIcon";
import { cn } from "@/lib/cn";
import { ADS_CONTACT_URL } from "@/lib/env";
import { AD_SLOTS, type AdSlotKey } from "./slots";

/** Пока слот не продан — фирменная заглушка со ссылкой в Telegram. */
type AdSlotProps = {
  slotKey: AdSlotKey;
  /** На фиолетовом фоне премии текст заглушки светлее — ради контраста. */
  onBrand?: boolean;
  className?: string;
};

export function AdSlot({ slotKey, onBrand, className }: AdSlotProps) {
  const slot = AD_SLOTS[slotKey];
  const stacked = slotKey === "sidebar" || slotKey === "feed_inline";

  return (
    <a
      href={ADS_CONTACT_URL}
      target="_blank"
      rel="noopener"
      data-ad-slot={slotKey}
      data-ad-sold="false"
      className={cn(
        "items-center justify-center gap-3 rounded-card border border-dashed px-4 text-center text-sm transition-colors",
        onBrand
          ? "border-muted-bright/70 text-muted-bright hover:border-paper hover:text-paper"
          : "border-petal text-muted hover:border-glow hover:text-text",
        slotKey !== "sidebar" && "flex",
        stacked && "flex-col",
        slot.box,
        className,
      )}
    >
      <PetalIcon size={stacked ? 28 : 20} className={cn("shrink-0", !onBrand && "text-petal")} />
      <span>Слот свободен — напиши, чтобы узнать условия</span>
    </a>
  );
}
