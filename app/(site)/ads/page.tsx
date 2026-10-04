import { Send } from "lucide-react";
import type { Metadata } from "next";
import { AD_SLOTS, type AdSlotKey } from "@/components/ads/slots";
import { PetalIcon } from "@/components/brand/PetalIcon";
import { Button } from "@/components/ui/Button";
import { ADS_CONTACT_URL } from "@/lib/env";

export const metadata: Metadata = {
  title: "Реклама",
  description: "Рекламные форматы на AFFILKI: баннеры на главной и в статьях, нативные карточки в ленте, слот над номинациями премии.",
};

// Пропорции превью: ширина в % от колонки и соотношение сторон.
const FORMATS: { key: AdSlotKey; where: string; preview: string }[] = [
  { key: "home_top", where: "Главная, сразу под блоком премии. Видят все, кто зашёл на сайт.", preview: "aspect-[1200/150] w-full" },
  { key: "awards_top", where: "Страница премии, над списком номинаций. Аудитория — те, кто пришёл голосовать.", preview: "aspect-[1200/150] w-full" },
  { key: "feed_inline", where: "Лента статей и главная, после каждых четырёх карточек. Выглядит как карточка статьи.", preview: "aspect-[4/3] w-1/2 sm:w-1/3" },
  { key: "article_inline", where: "Внутри каждой статьи, после третьего абзаца.", preview: "aspect-[728/90] w-full max-w-[728px]" },
  { key: "sidebar", where: "Сайдбар главной и статей. Только на десктопе.", preview: "aspect-[300/600] w-28" },
];

export default function AdsPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">Реклама на AFFILKI</h1>
        <p className="mt-4 text-lg text-text">
          Нас читают медиабайеры, команды, партнёрки и сервисы. Пять форматов, принимаем картинки и гифки. Условия и
          свободные даты — в личке.
        </p>
        <Button href={ADS_CONTACT_URL} size="lg" className="mt-6">
          <Send size={20} strokeWidth={1.75} aria-hidden />
          Написать в Telegram
        </Button>
      </div>

      <h2 className="mb-6 mt-14 text-2xl">Форматы</h2>
      <ul className="space-y-6">
        {FORMATS.map(({ key, where, preview }) => {
          const slot = AD_SLOTS[key];
          return (
            <li key={key} className="grid gap-5 rounded-card border border-petal/40 bg-deep/40 p-5 md:grid-cols-[1fr_1.4fr] md:items-center">
              <div>
                <h3 className="font-sans text-xl font-semibold">{slot.label}</h3>
                <p className="mt-2 text-text">{where}</p>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted">Десктоп</dt>
                    <dd className="mt-0.5 font-medium text-paper">{slot.desktop}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Мобайл</dt>
                    <dd className="mt-0.5 font-medium text-paper">{slot.mobile}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex justify-center" aria-hidden>
                <div className={`flex items-center justify-center rounded-card border border-dashed border-petal text-petal ${preview}`}>
                  <PetalIcon size={18} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-12 flex flex-col items-start gap-4 rounded-card border border-petal/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg text-text">Все рекламные материалы помечаются подписью «Реклама». По каждому слоту считаем показы и клики.</p>
        <Button href={ADS_CONTACT_URL} className="shrink-0">
          Узнать условия
        </Button>
      </div>
    </div>
  );
}
