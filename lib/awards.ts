import type { Nomination } from "@/lib/data";
import type { SponsorView } from "@/lib/sponsors";

/** Данные номинации для карточки хаба (только то, что нужно клиентскому компоненту). */
export function toHubNomination(nomination: Nomination, sponsor?: SponsorView | null) {
  return {
    slug: nomination.slug,
    number: nomination.number,
    title: nomination.title,
    shortDesc: nomination.shortDesc,
    icon: nomination.icon,
    coverText: nomination.coverText,
    group: nomination.group,
    isEvents: nomination.isEvents,
    nomineeCount: nomination.nominees.length,
    sponsor: sponsor ? { name: sponsor.name, logoUrl: sponsor.logoUrl } : null,
  };
}
