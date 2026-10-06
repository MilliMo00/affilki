import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS, type AdSlotKey } from "@/components/ads/slots";
import { ArticleCard, type ArticleCardData } from "@/components/articles/ArticleCard";
import { PetalCard } from "@/components/awards/PetalCard";
import { StageIndicator } from "@/components/awards/StageIndicator";
import { Flower } from "@/components/brand/Flower";
import { Loader } from "@/components/brand/Loader";
import { Logo } from "@/components/brand/Logo";
import { PetalIcon } from "@/components/brand/PetalIcon";
import { Watermark } from "@/components/brand/Watermark";
import { Button } from "@/components/ui/Button";
import { STAGES } from "@/lib/stages";

export const metadata: Metadata = { title: "Витрина компонентов", robots: { index: false } };

const COLORS = [
  ["ink", "#120B3D", "фон для чтения"],
  ["deep", "#30209D", "hero, шапка"],
  ["surface", "#3A28AE", "карточки премии"],
  ["indigo", "#4A33C0", "брендовый фон"],
  ["petal", "#6C5BCE", "бордеры, водяной знак"],
  ["glow", "#7B62F0", "ховер, фокус"],
  ["paper", "#FFFFFF", "логотип, заголовки"],
  ["text", "#E9E5FF", "основной текст"],
  ["muted", "#A9A0E0", "вторичный на ink/deep"],
  ["muted-bright", "#CFC8F5", "вторичный на indigo"],
  ["pollen", "#FFD66B", "только победители"],
  ["danger", "#FF6B8A", "ошибки форм"],
] as const;

const TYPE_SCALE = [
  ["text-5xl", "64"],
  ["text-4xl", "48"],
  ["text-3xl", "36"],
  ["text-2xl", "28"],
  ["text-xl", "22"],
] as const;

const ARTICLES: ArticleCardData[] = [
  {
    slug: "demo-1",
    title: "Как мы вышли на ROI 140% на нутре в Латаме: связка, крео и расклад по бюджету",
    coverUrl: null,
    coverText: "ROI 140%",
    category: { slug: "cases", title: "Кейсы" },
    readingMin: 7,
    publishedAt: new Date("2026-09-28"),
    views: 12840,
  },
  {
    slug: "demo-2",
    title: "Facebook снова режет кабинеты: что поменялось в модерации",
    coverUrl: null,
    coverText: null,
    category: { slug: "news", title: "Новости" },
    readingMin: 3,
    publishedAt: new Date("2026-10-02"),
    views: 934,
  },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-petal/30 py-10">
      <h2 className="mb-6 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="container-page py-10">
      <h1 className="mb-2 text-3xl">Витрина компонентов</h1>
      <p className="mb-10 text-muted">Только для разработки. В проде страница отдаёт 404.</p>

      <Section title="Палитра">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {COLORS.map(([name, hex, use]) => (
            <li key={name}>
              <div className="h-16 rounded-card border border-paper/20" style={{ background: hex }} />
              <p className="mt-2 font-semibold text-paper">{name}</p>
              <p className="text-sm text-muted">
                {hex} · {use}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Типографика">
        <div className="space-y-3">
          {TYPE_SCALE.map(([cls, px]) => (
            <p key={cls} className={`font-display font-bold text-paper ${cls}`}>
              Премия {px}
            </p>
          ))}
          <p className="max-w-prose text-lg">
            Onest 18 — текст статьи. Залили тест на три гео, отжали связку за неделю и вышли в плюс: ниже расклад по
            крео, бюджету и апруву в ПП.
          </p>
          <p>Onest 16 — интерфейс и карточки.</p>
          <p className="text-sm text-muted">Onest 14 — даты и метаданные.</p>
          <ul className="space-y-2 text-lg">
            {["Маркер списка в статье — лепесток", "А не точка"].map((item) => (
              <li key={item} className="flex items-baseline gap-3">
                <PetalIcon size={12} filled className="shrink-0 text-glow" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section title="Цветок и логотип">
        <div className="flex flex-wrap items-center gap-8">
          <div className="rounded-card bg-indigo p-6">
            <Logo size={56} awards />
          </div>
          <div className="rounded-card bg-deep p-6">
            <Logo size={32} rayColor="var(--deep)" />
          </div>
          <Flower size={96} className="text-paper" rayColor="var(--ink)" />
          <Flower size={96} className="text-petal" rayColor="var(--ink)" />
          <Loader size={56} />
        </div>
        <div className="grain relative mt-6 h-64 overflow-hidden rounded-card bg-hero">
          <Watermark />
          <p className="relative p-6 font-display text-2xl font-bold text-paper">Водяной знак на hero</p>
        </div>
      </Section>

      <Section title="Индикатор этапа">
        <div className="grid gap-6 rounded-card bg-deep p-6 sm:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((stage) => (
            <StageIndicator key={stage} stage={stage} nextDate={new Date("2026-12-12")} />
          ))}
        </div>
      </Section>

      <Section title="Кнопки">
        <div className="flex flex-wrap items-center gap-4 rounded-card bg-indigo p-6">
          <Button size="lg">Голосовать</Button>
          <Button>Войти</Button>
          <Button size="sm">Подписаться</Button>
          <Button variant="secondary">Поделиться</Button>
          <Button variant="ghost">Все номинации</Button>
          <Button disabled>Недоступно</Button>
          <Button href="/" variant="secondary">
            Ссылка на главную
          </Button>
        </div>
      </Section>

      <Section title="Карточки-лепестки (только премия)">
        <div className="grid gap-8 rounded-card bg-indigo p-6 sm:grid-cols-2 lg:grid-cols-3">
          <PetalCard>
            <h3 className="text-xl">Партнёрка года</h3>
            <p className="mt-2 text-muted-bright">5 участников</p>
          </PetalCard>
          <PetalCard tone="finalist">
            <h3 className="text-xl">LeadRocket</h3>
            <p className="mt-2 text-muted-bright">Нутра-ПП с выплатами день в день</p>
          </PetalCard>
          <PetalCard tone="winner">
            <h3 className="text-xl">Traffic Devils</h3>
            <p className="mt-2 text-muted-bright">Команда года · 41% голосов</p>
          </PetalCard>
        </div>
      </Section>

      <Section title="Карточка статьи и слот в ленте">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
          <AdSlot slotKey="feed_inline" />
        </div>
      </Section>

      <Section title="Рекламные слоты (заглушки)">
        <div className="space-y-8">
          {(Object.keys(AD_SLOTS) as AdSlotKey[])
            .filter((key) => key !== "feed_inline")
            .map((key) => (
              <div key={key}>
                <p className="mb-2 text-sm text-muted">
                  {key} · {AD_SLOTS[key].desktop} / {AD_SLOTS[key].mobile}
                </p>
                <AdSlot slotKey={key} />
              </div>
            ))}
        </div>
      </Section>
    </main>
  );
}
