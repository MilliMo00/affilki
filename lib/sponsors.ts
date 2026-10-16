import { cache } from "react";
import { db } from "@/lib/db";
import { readLinks, type LinkButton } from "@/lib/profile";

export type SponsorView = {
  id: string;
  name: string;
  logoUrl: string | null;
  url: string;
  description: string | null;
  links: LinkButton[];
  /** Спонсируемая номинация; null — спонсор всей премии. */
  nomination: { slug: string; title: string } | null;
};

type Row = Awaited<ReturnType<typeof loadRows>>[number];

const loadRows = () =>
  db.sponsor.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { nomination: { select: { slug: true, title: true } } },
  });

const toView = (row: Row): SponsorView => ({
  id: row.id,
  name: row.name,
  logoUrl: row.logoUrl,
  url: row.url,
  description: row.description,
  links: readLinks(row.links),
  nomination: row.nomination,
});

/** Спонсоры премии (по порядку) и спонсоры номинаций по адресу номинации. Один запрос на страницу. */
export const getSponsors = cache(async () => {
  const general: SponsorView[] = [];
  const byNomination = new Map<string, SponsorView>();
  for (const row of await loadRows()) {
    const view = toView(row);
    if (!view.nomination) general.push(view);
    // У номинации один спонсор: если заведено несколько, показывается первый по порядку.
    else if (!byNomination.has(view.nomination.slug)) byNomination.set(view.nomination.slug, view);
  }
  return { general, byNomination };
});

export async function getSponsor(id: string) {
  const row = await db.sponsor.findUnique({ where: { id }, include: { nomination: { select: { slug: true, title: true } } } });
  return row ? toView(row) : null;
}
