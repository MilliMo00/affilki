import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Flower } from "@/components/brand/Flower";
import { cn } from "@/lib/cn";
import type { CaseItem } from "@/lib/profile";

/** Обложка кейса: фото или, если его нет, фирменный плакат с номером кейса. */
export function CaseCover({ item, number, sizes, className }: { item: CaseItem; number: number; sizes: string; className?: string }) {
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-ink", className)}>
      {item.imageUrl ? (
        <Image src={item.imageUrl} alt={`Кейс: ${item.title}`} fill sizes={sizes} className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      ) : (
        <div aria-hidden className="grain absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 10%, #7B62F0 0%, #4A33C0 50%, #30209D 100%)" }}>
          <div className="absolute -right-10 -top-12 aspect-square w-2/3 text-paper/15">
            <Flower size="100%" rays={false} rayColor="var(--indigo)" />
          </div>
          <span className="absolute bottom-4 left-5 font-display text-5xl font-extrabold text-paper/90">#{number}</span>
        </div>
      )}
    </div>
  );
}

/** Кейс в списке: фото, название, начало описания — и переход на отдельную страницу кейса. */
export function CaseCard({ item, number, href }: { item: CaseItem; number: number; href: string }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-petal border border-petal bg-surface transition-colors focus-within:border-glow hover:border-glow">
      <CaseCover item={item} number={number} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-sm font-medium text-muted-bright">Кейс {number}</p>
        <h3 className="break-words font-sans text-lg font-semibold leading-snug text-paper">
          <Link href={href} className="after:absolute after:inset-0">
            {item.title}
          </Link>
        </h3>
        {item.text && <p className="line-clamp-3 break-words text-muted-bright">{item.text}</p>}
        <span aria-hidden className="mt-auto inline-flex items-center gap-1.5 pt-2 font-semibold text-paper">
          Подробнее
          <ArrowRight size={18} strokeWidth={1.75} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </article>
  );
}
