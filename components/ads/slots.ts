// Рекламные слоты (ТЗ раздел 7). Размер заглушки = размер проданного слота,
// чтобы вёрстка не прыгала после продажи.
export const AD_SLOTS = {
  home_top: {
    label: "Баннер на главной",
    desktop: "1200×150",
    mobile: "360×120",
    box: "aspect-[360/120] w-full md:aspect-[1200/150]",
  },
  feed_inline: {
    label: "Карточка в ленте",
    desktop: "как карточка статьи",
    mobile: "как карточка статьи",
    box: "h-full min-h-[300px] w-full",
  },
  article_inline: {
    label: "Баннер в статье",
    desktop: "728×90",
    mobile: "360×120",
    box: "aspect-[360/120] w-full max-w-[728px] md:aspect-[728/90]",
  },
  sidebar: {
    label: "Сайдбар",
    desktop: "300×600",
    mobile: "скрыт",
    box: "hidden h-[600px] w-[300px] lg:flex",
  },
  awards_top: {
    label: "Баннер над номинациями",
    desktop: "1200×150",
    mobile: "360×120",
    box: "aspect-[360/120] w-full md:aspect-[1200/150]",
  },
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;
