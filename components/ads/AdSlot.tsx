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
