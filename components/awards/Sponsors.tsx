import { Plus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { GENERAL_SPONSOR_SLOTS } from "@/lib/entry-rules";
import { PARTNERS_CONTACT_URL } from "@/lib/env";
import { getSponsors, type SponsorView } from "@/lib/sponsors";

// Спонсорские места: у премии — несколько общих (на главной, в премии, на страницах номинаций и участников),
// у каждой номинации — одно своё. Пока место не продано, на нём стоит заглушка со ссылкой на контакт.

function SponsorTile({ sponsor, compact }: { sponsor: SponsorView | null; compact?: boolean }) {
  const box = cn("flex w-full items-center justify-center rounded-card px-4 text-center", compact ? "h-14" : "h-24 sm:h-28");

  if (!sponsor) {
    return (
      <a
        href={PARTNERS_CONTACT_URL}
        target="_blank"
        rel="noopener"
        className={cn(box, "gap-2 border border-dashed border-muted-bright/70 text-muted-bright hover:border-paper hover:text-paper", !compact && "flex-col")}
      >
        <Plus size={compact ? 16 : 20} strokeWidth={1.75} aria-hidden />
        <span className={cn("font-medium", compact && "text-sm")}>Спонсорское место</span>
      </a>
    );
  }

  return (
    <a href={sponsor.url} target="_blank" rel="noopener sponsored" className={cn(box, "relative border border-petal bg-paper hover:border-glow")}>
      {sponsor.logoUrl ? (
        <Image src={sponsor.logoUrl} alt={sponsor.name} fill sizes="300px" className="object-contain p-3" />
      ) : (
        <span className={cn("font-display font-bold text-deep", compact ? "text-sm" : "text-lg")}>{sponsor.name}</span>
      )}
    </a>
  );
}

/** Спонсоры премии. compact — узкая полоса для внутренних страниц. */
export async function SponsorStrip({ compact, className }: { compact?: boolean; className?: string }) {
  const { general } = await getSponsors();
  const slots = Array.from({ length: Math.max(GENERAL_SPONSOR_SLOTS, general.length) }, (_, i) => general[i] ?? null);

  return (
    <section aria-label="Спонсоры премии" className={className}>
      <div className={cn(compact ? "flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5" : "space-y-4")}>
        {compact ? <p className="shrink-0 text-sm font-semibold text-muted-bright">Спонсоры премии</p> : <h2 className="text-2xl">Спонсоры премии</h2>}
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

/** Спонсор отдельной номинации: логотип или свободное место с коротким объяснением формата. */
export async function NominationSponsor({ slug, className }: { slug: string; className?: string }) {
  const sponsor = (await getSponsors()).byNomination.get(slug) ?? null;

  return (
    <section aria-label="Спонсор номинации" className={cn("rounded-petal border border-petal bg-deep/50 p-5 sm:p-6", className)}>
      <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <h2 className="font-sans text-lg font-semibold text-paper">Спонсор номинации</h2>
          <p className="mt-1 text-muted-bright">
            {sponsor
              ? `Номинацию поддерживает ${sponsor.name}.`
              : "Место свободно. Спонсором может стать компания из той же ниши: логотип и ссылка стоят на странице номинации и видны всем, кто пришёл голосовать."}
          </p>
        </div>
        <SponsorTile sponsor={sponsor} />
      </div>
    </section>
  );
}
