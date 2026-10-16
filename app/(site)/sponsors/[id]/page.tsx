import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { SponsorLinks, SponsorLogo } from "@/components/awards/Sponsors";
import { PetalCard } from "@/components/awards/PetalCard";
import { Watermark } from "@/components/brand/Watermark";
import { getSponsor } from "@/lib/sponsors";

type Props = PageProps<"/sponsors/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sponsor = await getSponsor((await params).id);
  if (!sponsor) return {};
  return {
    title: `${sponsor.name} — ${sponsor.nomination ? `спонсор номинации «${sponsor.nomination.title}»` : "спонсор премии"}`,
    description: sponsor.description?.slice(0, 160),
  };
}

export default async function SponsorPage({ params }: Props) {
  const sponsor = await getSponsor((await params).id);
  if (!sponsor) notFound();

  return (
    <div className="bg-indigo">
      <section className="grain relative overflow-hidden bg-hero">
        <Watermark />
        <div className="container-page relative py-10 sm:py-14">
          <Breadcrumbs items={[{ href: "/sponsors", label: "Спонсоры" }]} />
          <PetalCard className="mx-auto mt-8 max-w-3xl !bg-deep/80 backdrop-blur-sm sm:!p-10">
            <a href={sponsor.url} target="_blank" rel="noopener sponsored" aria-label={`Сайт спонсора: ${sponsor.name}`} className="block rounded-card ring-glow hover:ring-2">
              <SponsorLogo sponsor={sponsor} className="h-40" sizes="(min-width: 768px) 640px, 100vw" />
            </a>
            <span className="mt-6 inline-flex rounded-full bg-paper px-3 py-1 text-sm font-semibold text-deep">
              {sponsor.nomination ? "Спонсор номинации" : "Спонсор премии"}
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl">{sponsor.name}</h1>
            {sponsor.nomination && (
              <p className="mt-2 text-muted-bright">
                Номинация{" "}
                <Link href={`/awards/${sponsor.nomination.slug}`} className="font-semibold text-paper underline underline-offset-4">
                  «{sponsor.nomination.title}»
                </Link>
              </p>
            )}
            {sponsor.description && <p className="mt-6 whitespace-pre-line break-words text-lg text-text">{sponsor.description}</p>}
            <SponsorLinks sponsor={sponsor} className="mt-7" />
          </PetalCard>
        </div>
      </section>
    </div>
  );
}
