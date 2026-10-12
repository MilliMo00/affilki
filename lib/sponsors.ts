import { cache } from "react";
import { db } from "@/lib/db";

export type SponsorView = { id: string; name: string; logoUrl: string | null; url: string };

/** Спонсоры премии (по порядку) и спонсоры номинаций по адресу номинации. Один запрос на страницу. */
export const getSponsors = cache(async () => {
  const rows = await db.sponsor.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { nomination: { select: { slug: true } } },
  });
  const general: SponsorView[] = [];
  const byNomination = new Map<string, SponsorView>();
  for (const { nomination, ...row } of rows) {
    const view = { id: row.id, name: row.name, logoUrl: row.logoUrl, url: row.url };
    if (!nomination) general.push(view);
    // У номинации один спонсор: если заведено несколько, показывается первый по порядку.
    else if (!byNomination.has(nomination.slug)) byNomination.set(nomination.slug, view);
  }
  return { general, byNomination };
});
