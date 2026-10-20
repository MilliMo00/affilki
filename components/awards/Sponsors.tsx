import { ArrowRight, ArrowUpRight, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { Flower } from "@/components/brand/Flower";
import { cn } from "@/lib/cn";
import { GENERAL_SPONSOR_SLOTS } from "@/lib/entry-rules";
import { PARTNERS_CONTACT_URL } from "@/lib/env";
import { isTelegramLink, linkTitle } from "@/lib/profile";
import { getSponsors, type SponsorView } from "@/lib/sponsors";

// Спонсорские места: у премии — несколько общих (на каждой странице сайта и в разделе «Спонсоры»),
// у каждой номинации — одно своё. Пока место не продано, на нём стоит заглушка со ссылкой на контакт.

/** Логотип спонсора на белой плашке; без логотипа — название. */
export function SponsorLogo({ sponsor, className, sizes = "300px" }: { sponsor: Pick<SponsorView, "name" | "logoUrl">; className?: string; sizes?: string }) {
  return (
    <span className={cn("relative flex items-center justify-center overflow-hidden rounded-card bg-paper px-4 text-center", className)}>
      {sponsor.logoUrl ? (
        <Image src={sponsor.logoUrl} alt={sponsor.name} fill sizes={sizes} className="object-contain p-3" />
      ) : (
        <span className="font-display text-lg font-bold text-deep">{sponsor.name}</span>
      )}
    </span>
  );
}

/** Сайт спонсора и его дополнительные ссылки — кнопками. */
export function SponsorLinks({ sponsor, className }: { sponsor: SponsorView; className?: string }) {
  const links = [{ title: linkTitle(sponsor.url), url: sponsor.url }, ...sponsor.links.filter((link) => link.url !== sponsor.url)];
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {links.map((link) => {
        const Icon = isTelegramLink(link.url) ? Send : ArrowUpRight;
        return (
          <li key={link.url}>
            <a href={link.url} target="_blank" rel="noopener sponsored" className="flex h-11 items-center gap-2 rounded-full border border-petal bg-deep/40 px-4 font-medium text-paper hover:border-glow hover:bg-glow/20">
              <Icon size={18} strokeWidth={1.75} aria-hidden />
              {link.title}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Свободное место: яркая плашка с бликом и цветком — «здесь может быть ваш логотип».
 * Ведёт к контакту по сотрудничеству. index сдвигает блик, чтобы плашки рядом не мигали разом.
 */
export function FreeSponsorSlot({ compact, className, index = 0 }: { compact?: boolean; className?: string; index?: number }) {
  return (
    <a
      href={PARTNERS_CONTACT_URL}
      target="_blank"
      rel="noopener"
      style={{ "--shine-delay": `${index * 0.6}s` } as React.CSSProperties}
      className={cn(
        "sponsor-shine group relative flex w-full items-center overflow-hidden rounded-card border border-glow/60 text-paper transition-colors hover:border-paper",
        compact ? "h-14 justify-center gap-2 px-3" : "h-24 flex-col justify-center gap-1 px-4 sm:h-28",
        className,
      )}
    >
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(120deg,#30209D_0%,#4A33C0_55%,#7B62F0_100%)] opacity-80 transition-opacity group-hover:opacity-100" />
      <span aria-hidden className={cn("absolute aspect-square text-paper/15 transition-transform duration-500 group-hover:rotate-[24deg]", compact ? "-right-3 -top-4 w-16" : "-right-6 -top-8 w-28")}>
        <Flower size="100%" rays={false} rayColor="var(--indigo)" />
      </span>
      {compact ? (
        <span className="relative flex items-center gap-2 text-sm font-semibold leading-tight">
          <Sparkles size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-pollen" />
          Ваш логотип здесь
        </span>
      ) : (
        <>
          <span className="relative flex items-center gap-2 whitespace-nowrap font-display text-sm font-bold sm:text-base">
            <Sparkles size={18} strokeWidth={1.75} aria-hidden className="text-pollen" />
            Ваш логотип здесь
          </span>
          <span className="relative inline-flex items-center gap-1 text-sm font-medium text-muted-bright group-hover:text-paper">
            Стать спонсором
            <ArrowRight size={14} strokeWidth={2} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </>
      )}
    </a>
  );
}

function SponsorTile({ sponsor, compact, index }: { sponsor: SponsorView | null; compact?: boolean; index: number }) {
  if (!sponsor) return <FreeSponsorSlot compact={compact} index={index} />;
  // Логотип ведёт на сайт спонсора — это главное, за что он платит.
  return (
    <a href={sponsor.url} target="_blank" rel="noopener sponsored" aria-label={`${sponsor.name} — спонсор премии`} className="block rounded-card ring-glow hover:ring-2">
      <SponsorLogo sponsor={sponsor} className={compact ? "h-14" : "h-24 sm:h-28"} />
    </a>
  );
}

/** Спонсоры премии. compact — узкая полоса для внутренних страниц и подвала. */
export async function SponsorStrip({ compact, className }: { compact?: boolean; className?: string }) {
  const { general } = await getSponsors();
  const slots = Array.from({ length: Math.max(GENERAL_SPONSOR_SLOTS, general.length) }, (_, i) => general[i] ?? null);

  return (
    <section aria-label="Спонсоры премии" className={className}>
      <div className={cn(compact ? "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5" : "space-y-4")}>
        <div className={cn("flex items-baseline justify-between gap-4", compact && "shrink-0 lg:flex-col lg:items-start lg:gap-1")}>
          {compact ? <p className="text-sm font-semibold text-muted-bright">Спонсоры премии</p> : <h2 className="text-2xl">Спонсоры премии</h2>}
          <Link href="/sponsors" className="text-sm font-medium text-paper underline decoration-muted-bright underline-offset-4 hover:decoration-paper">
            {compact ? "Все спонсоры" : "О спонсорах"}
          </Link>
        </div>
        <ul className={cn("grid flex-1 grid-cols-2 lg:grid-cols-4", compact ? "gap-2" : "gap-4")}>
          {slots.map((sponsor, i) => (
            <li key={sponsor?.id ?? i}>
              <SponsorTile sponsor={sponsor} compact={compact} index={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Спонсор отдельной номинации: логотип, отметка и кнопка «Подробнее о спонсоре» — или свободное место. */
export async function NominationSponsor({ slug, className }: { slug: string; className?: string }) {
  const sponsor = (await getSponsors()).byNomination.get(slug) ?? null;

  return (
    <section aria-label="Спонсор номинации" className={cn("rounded-petal border border-petal bg-deep/50 p-5 sm:p-6", className)}>
      <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          {sponsor ? (
            <>
              <span className="inline-flex rounded-full bg-paper px-3 py-1 text-sm font-semibold text-deep">Спонсор номинации</span>
              <h2 className="mt-3 font-sans text-xl font-semibold text-paper">{sponsor.name}</h2>
              {sponsor.description && <p className="mt-1 line-clamp-2 whitespace-pre-line text-muted-bright">{sponsor.description}</p>}
              <Link
                href={`/sponsors/${sponsor.id}`}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-petal px-5 font-semibold text-paper hover:border-glow hover:bg-glow/20"
              >
                Подробнее о спонсоре
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-sans text-lg font-semibold text-paper">Спонсор номинации</h2>
              <p className="mt-1 text-muted-bright">
                Место свободно. Спонсор становится лицом номинации: логотип на её странице и обложке, отметка «Спонсор номинации» и
                страница о компании.
              </p>
            </>
          )}
        </div>
        {sponsor ? (
          <a href={sponsor.url} target="_blank" rel="noopener sponsored" aria-label={`Сайт спонсора: ${sponsor.name}`} className="block rounded-card ring-glow hover:ring-2">
            <SponsorLogo sponsor={sponsor} className="h-24 sm:h-28" />
          </a>
        ) : (
          <FreeSponsorSlot />
        )}
      </div>
    </section>
  );
}
