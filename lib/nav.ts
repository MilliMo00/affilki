export const MAIN_NAV = [
  { href: "/awards", label: "Премия" },
  { href: "/articles", label: "Статьи" },
  { href: "/submit", label: "Подать заявку" },
  { href: "/ads", label: "Реклама" },
] as const;

// Рубрики по умолчанию: ими же засеивается БД в Фазе 3.
export const DEFAULT_CATEGORIES = [
  { slug: "articles", title: "Статьи" },
  { slug: "cases", title: "Кейсы" },
  { slug: "news", title: "Новости" },
  { slug: "interviews", title: "Интервью" },
  { slug: "reviews", title: "Обзоры" },
] as const;
