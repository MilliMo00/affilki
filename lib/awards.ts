import type { Nomination } from "@/lib/data";

/** Данные номинации для карточки хаба (только то, что нужно клиентскому компоненту). */
export function toHubNomination(nomination: Nomination) {
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
  };
}
