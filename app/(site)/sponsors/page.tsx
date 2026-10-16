import type { Metadata } from "next";
import Link from "next/link";
import { FreeSponsorSlot, SponsorLinks, SponsorLogo } from "@/components/awards/Sponsors";
import { SponsorCall } from "@/components/awards/SponsorCall";
import { Watermark } from "@/components/brand/Watermark";
import { getCurrentSeason } from "@/lib/data";
import { GENERAL_SPONSOR_SLOTS } from "@/lib/entry-rules";
import { getSponsors } from "@/lib/sponsors";

export const metadata: Metadata = {
  title: "Спонсоры",
  description: "Компании, которые поддерживают AFFILKI Awards — народную премию арбитражного рынка.",
};

export const dynamic = "force-dynamic";

export default async function SponsorsPage() {
  const [{ general, byNomination }, season] = await Promise.all([getSponsors(), getCurrentSeason()]);
  const freeGeneral = Math.max(0, GENERAL_SPONSOR_SLOTS - general.length);
  const nominations = season?.nominations ?? [];

  return (
    <div className="bg-indigo">
      <section className="grain relative overflow-hidden bg-hero">
        <Watermark />
        <div className="container-page relative py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl">Спонсоры</h1>
          <p className="mt-4 max-w-2xl text-lg text-paper">
            Компании, которые поддерживают {season?.title ?? "AFFILKI Awards"}. Спонсор премии — на каждой странице сайта, спонсор
            номинации — лицо своей номинации.
          </p>
        </div>
      </section>

      <section aria-labelledby="general-title" className="container-page py-12">
        <h2 id="general-title" className="mb-6 text-2xl">
          Спонсоры премии
        </h2>
        <ul className="grid gap-6 md:grid-cols-2">
          {general.map((sponsor) => (
            <li key={sponsor.id} className="flex flex-col gap-5 rounded-petal border border-petal bg-surface p-5 sm:p-6">
              <a href={sponsor.url} target="_blank" rel="noopener sponsored" aria-label={`Сайт спонсора: ${sponsor.name}`} className="block rounded-card ring-glow hover:ring-2">
                <SponsorLogo sponsor={sponsor} className="h-32" />
              </a>
              <div>
                <h3 className="font-sans text-xl font-semibold text-paper">{sponsor.name}</h3>
                {sponsor.description && <p className="mt-2 line-clamp-4 whitespace-pre-line text-muted-bright">{sponsor.description}</p>}
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <SponsorLinks sponsor={sponsor} />
                <Link href={`/sponsors/${sponsor.id}`} className="ml-auto font-semibold text-paper underline decoration-muted-bright underline-offset-4 hover:decoration-paper">
                  Подробнее
                </Link>
              </div>
            </li>
          ))}
          {Array.from({ length: freeGeneral }, (_, i) => (
            <li key={`free-${i}`}>
              <FreeSponsorSlot className="h-full min-h-40" />
            </li>
          ))}
        </ul>
      </section>

      {nominations.length > 0 && (
        <section aria-labelledby="nominations-title" className="container-page pb-12">
          <h2 id="nominations-title" className="mb-6 text-2xl">
            Спонсоры номинаций
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nominations.map((nomination) => {
              const sponsor = byNomination.get(nomination.slug);
              return (
                <li key={nomination.slug} className="flex flex-col gap-3 rounded-card border border-petal/60 bg-deep/40 p-4">
                  <Link href={`/awards/${nomination.slug}`} className="font-semibold text-paper hover:underline">
                    {nomination.title}
                  </Link>
                  {sponsor ? (
                    <>
                      <a href={sponsor.url} target="_blank" rel="noopener sponsored" aria-label={`Сайт спонсора: ${sponsor.name}`} className="block rounded-card ring-glow hover:ring-2">
                        <SponsorLogo sponsor={sponsor} className="h-20" />
                      </a>
                      <Link href={`/sponsors/${sponsor.id}`} className="text-sm font-medium text-paper underline decoration-muted-bright underline-offset-4 hover:decoration-paper">
                        Подробнее о спонсоре
                      </Link>
                    </>
                  ) : (
                    <FreeSponsorSlot className="!h-20" />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <SponsorCall />
    </div>
  );
}
