import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/awards/Breadcrumbs";
import { CaseCard, CaseCover } from "@/components/awards/CaseCard";
import { NomineeAvatar } from "@/components/awards/NomineeAvatar";
import { Watermark } from "@/components/brand/Watermark";
import { ZoomImage } from "@/components/ui/ZoomImage";
import { VoteButton } from "@/components/voting/VoteButton";
import { cn } from "@/lib/cn";
import { getNominee, isVotingOpen } from "@/lib/data";

type Props = PageProps<"/n/[nominee]/cases/[n]">;

async function load(params: Props["params"]) {
  const { nominee: slug, n } = await params;
  const data = await getNominee(slug);
  const index = Number(n) - 1;
  const item = Number.isInteger(index) ? data?.nominee.profile.cases[index] : undefined;
  return data && item ? { ...data, item, index } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  return { title: `${data.item.title} — кейс ${data.nominee.name}`, description: data.item.text.slice(0, 160) };
}

export default async function CasePage({ params }: Props) {
  const data = await load(params);
  if (!data) notFound();

  const { season, nomination, nominee, item, index } = data;
  const cases = nominee.profile.cases;
  const base = `/n/${nominee.slug}`;
  const prev = index > 0 ? index : null;
  const next = index < cases.length - 1 ? index + 2 : null;
  const others = cases.map((other, i) => ({ other, number: i + 1 })).filter(({ number }) => number !== index + 1);

  return (
    <div className="bg-indigo">
      <section className="grain relative overflow-hidden bg-hero">
        <Watermark />
        <div className="container-page relative py-10 sm:py-14">
          <Breadcrumbs
            items={[
              { href: "/awards", label: season.title },
              { href: `/awards/${nomination.slug}?tab=nominees`, label: nomination.title },
              { href: base, label: nominee.name },
            ]}
          />
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <p className="font-medium text-muted-bright">
                Кейс {index + 1} из {cases.length}
              </p>
              <h1 className="mt-2 break-words text-2xl sm:text-4xl">{item.title}</h1>
              <Link href={base} className="mt-6 inline-flex items-center gap-3 rounded-full border border-petal/70 bg-deep/40 py-1.5 pl-1.5 pr-4 hover:border-paper">
                <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} size={40} />
                <span className="font-semibold text-paper">{nominee.name}</span>
              </Link>
            </div>
            <div className="overflow-hidden rounded-petal border border-petal">
              {item.imageUrl ? (
                <ZoomImage src={item.imageUrl} alt={`Кейс: ${item.title}`} sizes="(min-width: 1024px) 640px, 100vw" className="relative block aspect-video w-full cursor-zoom-in bg-ink" />
              ) : (
                <CaseCover item={item} number={index + 1} sizes="(min-width: 1024px) 640px, 100vw" />
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <article className="flex flex-col rounded-petal border border-petal/60 bg-deep/40 p-6 sm:p-8 lg:min-h-[420px]">
            <p className="font-display text-sm font-bold text-muted-bright">О кейсе</p>
            {item.text ? (
              <p className="mt-3 whitespace-pre-line break-words text-lg leading-relaxed text-text">{item.text}</p>
            ) : (
              <p className="mt-3 text-muted-bright">Описание кейса не добавлено.</p>
            )}
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener nofollow" className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-paper px-5 font-semibold text-deep hover:bg-text">
                Открыть кейс полностью
                <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden />
              </a>
            )}
            {/* Распорка прижимает навигацию к низу карточки, когда текст короче боковой колонки. */}
            <div aria-hidden className="min-h-8 flex-1" />
            <nav aria-label="Другие кейсы" className="flex flex-wrap items-center justify-between gap-4 border-t border-petal/40 pt-6">
              {prev ? (
                <Link href={`${base}/cases/${prev}`} className="inline-flex items-center gap-2 font-semibold text-paper hover:underline">
                  <ArrowLeft size={18} strokeWidth={1.75} aria-hidden /> Предыдущий кейс
                </Link>
              ) : (
                <Link href={base} className="inline-flex items-center gap-2 font-semibold text-paper hover:underline">
                  <ArrowLeft size={18} strokeWidth={1.75} aria-hidden /> К участнику
                </Link>
              )}
              {next && (
                <Link href={`${base}/cases/${next}`} className="inline-flex items-center gap-2 font-semibold text-paper hover:underline">
                  Следующий кейс <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
                </Link>
              )}
            </nav>
          </article>

          {/* Справа — кто сделал кейс и все кейсы команды: можно листать, не возвращаясь назад. */}
          <aside aria-label="О команде и других кейсах" className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-petal border border-petal bg-surface p-5">
              <div className="flex items-center gap-4">
                <NomineeAvatar name={nominee.name} logoUrl={nominee.logoUrl} size={56} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-paper">{nominee.name}</p>
                  <p className="text-sm text-muted-bright">{nomination.title}</p>
                </div>
              </div>
              {nominee.tagline && <p className="mt-3 text-sm text-muted-bright">{nominee.tagline}</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={base} className="flex h-11 items-center gap-2 rounded-full border border-petal px-4 font-semibold text-paper hover:border-glow hover:bg-glow/20">
                  О команде
                  <ArrowRight size={18} strokeWidth={1.75} aria-hidden />
                </Link>
                {isVotingOpen(season) && <VoteButton nominee={{ slug: nominee.slug, name: nominee.name }} nomination={{ slug: nomination.slug, title: nomination.title }} />}
              </div>
            </div>

            <nav aria-label="Все кейсы команды" className="rounded-petal border border-petal/60 bg-deep/40 p-3">
              <p className="px-2 pb-2 pt-1 text-sm font-semibold text-muted-bright">Все кейсы · {cases.length}</p>
              <ol className="space-y-1">
                {cases.map((other, i) => {
                  const current = i === index;
                  return (
                    <li key={i}>
                      <Link
                        href={`${base}/cases/${i + 1}`}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-card px-2 py-2 transition-colors",
                          current ? "bg-paper text-deep" : "text-text hover:bg-paper/10 hover:text-paper",
                        )}
                      >
                        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold", current ? "bg-deep text-paper" : "bg-ink/50 text-paper")}>
                          {i + 1}
                        </span>
                        <span className="line-clamp-2 text-sm font-medium leading-snug">{other.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>
        </div>


        {others.length > 0 && (
          <section aria-labelledby="more-cases" className="mt-12">
            <h2 id="more-cases" className="mb-6 text-2xl">
              Другие кейсы {nominee.name}
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.slice(0, 3).map(({ other, number }) => (
                <li key={number}>
                  <CaseCard item={other} number={number} href={`${base}/cases/${number}`} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
