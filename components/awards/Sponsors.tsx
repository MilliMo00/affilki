import { ArrowRight, ArrowUpRight, Plus, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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

/** Свободное место: ведёт к контакту по сотрудничеству. */
export function FreeSponsorSlot({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <a
      href={PARTNERS_CONTACT_URL}
      target="_blank"
      rel="noopener"
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-muted-bright/70 px-4 text-center text-muted-bright hover:border-paper hover:text-paper",
        compact ? "h-14" : "h-24 flex-col sm:h-28",
        className,
      )}
    >
      <Plus size={compact ? 16 : 20} strokeWidth={1.75} aria-hidden />
      <span className={cn("font-medium", compact && "text-sm")}>Спонсорское место</span>
    </a>
  );
}

function SponsorTile({ sponsor, compact }: { sponsor: SponsorView | null; compact?: boolean }) {
  if (!sponsor) return <FreeSponsorSlot compact={compact} />;
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
              <SponsorTile sponsor={sponsor} compact={compact} />
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
