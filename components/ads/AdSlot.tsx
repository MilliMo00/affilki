import Image from "next/image";
import { PetalIcon } from "@/components/brand/PetalIcon";
import { getActiveCampaigns } from "@/lib/ads";
import { cn } from "@/lib/cn";
import { ADS_CONTACT_URL } from "@/lib/env";
import { AD_SLOTS, type AdSlotKey } from "./slots";

type AdSlotProps = {
  slotKey: AdSlotKey;
  /** На фиолетовом фоне премии текст заглушки светлее — ради контраста. */
  onBrand?: boolean;
  className?: string;
};

/** Рекламный слот: проданное размещение или фирменная заглушка того же размера. */
export async function AdSlot({ slotKey, onBrand, className }: AdSlotProps) {
  const slot = AD_SLOTS[slotKey];
  const stacked = slotKey === "sidebar" || slotKey === "feed_inline";
  const campaign = (await getActiveCampaigns()).get(slotKey);

  if (campaign) {
    const mobile = campaign.mobileImageUrl;
    return (
      <a
        href={campaign.targetUrl}
        target="_blank"
        rel="sponsored noopener"
        data-ad-slot={slotKey}
        data-ad-sold="true"
        data-ad-campaign={campaign.id}
        className={cn("relative block overflow-hidden rounded-card bg-deep", slotKey !== "sidebar" && "block", slot.box.replace("lg:flex", "lg:block"), className)}
      >
        {/* unoptimized: гифки должны остаться анимированными. */}
        <Image
          src={campaign.imageUrl}
          alt={`Реклама: ${campaign.advertiser}`}
          fill
          unoptimized
          sizes="(min-width: 1200px) 1200px, 100vw"
          className={cn("object-cover", mobile && "max-md:hidden")}
        />
        {mobile && <Image src={mobile} alt={`Реклама: ${campaign.advertiser}`} fill unoptimized sizes="100vw" className="object-cover md:hidden" />}
        <span className="absolute left-2 top-2 rounded bg-ink/75 px-2 py-0.5 text-sm text-text">Реклама</span>
      </a>
    );
  }

  // Свободный слот — сам себе реклама: яркий фирменный градиент и крупный призыв.
  return (
    <a
      href={ADS_CONTACT_URL}
      target="_blank"
      rel="noopener"
      data-ad-slot={slotKey}
      data-ad-sold="false"
      className={cn(
        "group grain relative items-center justify-center gap-x-5 gap-y-3 overflow-hidden rounded-card border-2 bg-hero px-4 text-center transition-colors hover:border-paper",
        // На фиолетовом фоне премии рамка светлее, иначе слот сливается с фоном.
        onBrand ? "border-paper/70" : "border-glow",
        slotKey !== "sidebar" && "flex",
        stacked ? "flex-col" : "max-sm:flex-col max-sm:gap-y-1",
        slot.box,
        className,
      )}
    >
      <PetalIcon size={stacked ? 40 : 28} filled className="shrink-0 text-paper" />
      <span className={cn("font-display font-bold uppercase leading-tight text-paper", stacked ? "text-xl" : "text-base sm:text-xl")}>
        Тут могла быть твоя реклама
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full bg-paper px-4 font-semibold text-deep transition-colors group-hover:bg-text",
          stacked ? "py-2 text-base" : "py-1 text-sm sm:py-2 sm:text-base",
        )}
      >
        Узнать условия
      </span>
    </a>
  );
}
