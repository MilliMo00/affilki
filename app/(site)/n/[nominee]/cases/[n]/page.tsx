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
        <article className="max-w-3xl">
          {item.text ? (
            <p className="whitespace-pre-line break-words text-lg leading-relaxed text-text">{item.text}</p>
          ) : (
            <p className="text-muted-bright">Описание кейса не добавлено.</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener nofollow" className="flex h-11 items-center gap-2 rounded-full bg-paper px-5 font-semibold text-deep hover:bg-text">
                Открыть кейс полностью
                <ArrowUpRight size={18} strokeWidth={1.75} aria-hidden />
              </a>
            )}
            {isVotingOpen(season) && <VoteButton nominee={{ slug: nominee.slug, name: nominee.name }} nomination={{ slug: nomination.slug, title: nomination.title }} />}
          </div>
        </article>

        <nav aria-label="Другие кейсы" className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-petal/40 pt-6">
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
