import type { Nomination, Season } from "./types";

// Демо-данные до подключения базы. Все названия участников выдуманы.
type Seed = [slug: string, name: string, tagline: string];

function nominees(seeds: Seed[], percents?: number[]) {
  return seeds.map(([slug, name, tagline], i) => ({
    slug,
    name,
    tagline,
    logoUrl: null,
    links: { site: `https://example.com/${slug}`, tg: `https://t.me/${slug.replace(/-/g, "_")}` },
    result: percents ? { place: i + 1, percent: percents[i] } : undefined,
  }));
}

const NOMINATIONS_2026: Nomination[] = [
  {
    slug: "pp",
    title: "Партнёрка года",
    description: "ПП, с которой рынок лил больше и спокойнее всего: офферы, выплаты, поддержка.",
    criteria: "Стабильность выплат, качество офферов и апрува, работа менеджеров, условия для новичков и команд.",
    nominees: nominees([
      ["leadora", "Leadora", "Нутра и гемблинг, выплаты день в день"],
      ["cashpetal", "CashPetal", "Финансовые офферы под СНГ и Европу"],
      ["volna-partners", "Volna Partners", "Прямой рекл в дейтинге, 40+ гео"],
      ["offerhood", "Offerhood", "CPA-сеть с собственным колл-центром"],
      ["zaliv-network", "Zaliv Network", "Беттинг-офферы с ревшарой до 60%"],
    ]),
  },
  {
    slug: "team",
    title: "Команда года",
    description: "Арбитражная команда, которая показала результат и делилась опытом с рынком.",
    criteria: "Объёмы и стабильность, публичные кейсы, вклад в комьюнити, репутация у партнёрок.",
    nominees: nominees([
      ["nord-media", "Nord Media", "FB и TikTok, гемблинг в Tier-1"],
      ["krot-squad", "Krot Squad", "In-app трафик и свои приложения"],
      ["team-404", "404 Team", "Нутра в Латаме, 30 байеров"],
      ["tihiy-zaliv", "Тихий Залив", "Google UAC, крипта и финансы"],
      ["burj-buyers", "Burj Buyers", "Арабские гео, COD и нутра"],
    ]),
  },
  {
    slug: "service",
    title: "Сервис года",
    description: "Инструмент, без которого залив в этом году был бы дороже и больнее.",
    criteria: "Надёжность, скорость поддержки, цена, польза для соло-байеров и команд.",
    nominees: nominees([
      ["maskbox", "Maskbox", "Антидетект-браузер для командной работы"],
      ["trekly", "Trekly", "Трекер с клоакой и автоправилами"],
      ["creobank", "Creobank", "Spy-сервис по FB, TikTok и push"],
      ["paylily", "PayLily", "Виртуальные карты под рекламные кабинеты"],
      ["proksima", "Proksima", "Мобильные прокси, 90 стран"],
    ]),
  },
  {
    slug: "breakthrough",
    title: "Прорыв года",
    description: "Те, о ком год назад никто не слышал, а теперь знают все.",
    criteria: "Рост за год, новые подходы и связки, заметность в комьюнити.",
    nominees: nominees([
      ["svyazka-lab", "Svyazka Lab", "Команда, которая открыла рынку Threads"],
      ["mango-cpa", "Mango CPA", "Молодая ПП с эксклюзивами по Индии"],
      ["uplift-crew", "Uplift Crew", "С нуля до 15 байеров за год"],
      ["granit-ads", "Granit Ads", "Агентские кабинеты без предоплаты"],
      ["kometa-team", "Kometa Team", "Telegram Ads и мини-аппы"],
    ]),
  },
];

const NOMINATIONS_2025: Nomination[] = [
  {
    ...NOMINATIONS_2026[0],
    nominees: nominees(
      [
        ["leadora-2025", "Leadora", "Нутра и гемблинг, выплаты день в день"],
        ["offerhood-2025", "Offerhood", "CPA-сеть с собственным колл-центром"],
        ["riverpay-2025", "RiverPay", "Финансы и страхование"],
      ],
      [46, 31, 23],
    ),
  },
  {
    ...NOMINATIONS_2026[1],
    nominees: nominees(
      [
        ["team-404-2025", "404 Team", "Нутра в Латаме"],
        ["nord-media-2025", "Nord Media", "FB и TikTok, гемблинг"],
        ["sova-buying-2025", "Sova Buying", "Push и попсы"],
      ],
      [41, 37, 22],
    ),
  },
  {
    ...NOMINATIONS_2026[2],
    nominees: nominees(
      [
        ["trekly-2025", "Trekly", "Трекер с клоакой и автоправилами"],
        ["maskbox-2025", "Maskbox", "Антидетект-браузер"],
        ["proksima-2025", "Proksima", "Мобильные прокси"],
      ],
      [52, 29, 19],
    ),
  },
];

export const SEASONS: Season[] = [
  {
    year: 2026,
    title: "AFFILKI Awards 2026",
    stage: "VOTING",
    votingStartsAt: new Date("2026-10-01T09:00:00Z"),
    votingEndsAt: new Date("2026-11-15T20:59:00Z"),
    nextStageAt: new Date("2026-11-16T09:00:00Z"),
    resultsPublished: false,
    totalVotes: 4812,
    nominations: NOMINATIONS_2026,
  },
  {
    year: 2025,
    title: "AFFILKI Awards 2025",
    stage: "CEREMONY",
    votingStartsAt: new Date("2025-10-01T09:00:00Z"),
    votingEndsAt: new Date("2025-11-15T20:59:00Z"),
    resultsPublished: true,
    totalVotes: 3127,
    nominations: NOMINATIONS_2025,
  },
];
