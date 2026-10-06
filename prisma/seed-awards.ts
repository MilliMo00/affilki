import type { NomGroup } from "@prisma/client";

// Сезон 2026: 9 номинаций в порядке из ТЗ v2. Тексты стартовые — админ их правит.
// Все участники тестовые и помечены «(тест)»: перед запуском заменить настоящими.

type NomineeSeed = {
  slug: string;
  name: string;
  tagline: string;
  sources?: string[];
  rightOfReply?: string;
  legalChecked?: boolean;
};

type NominationSeed = {
  slug: string;
  title: string;
  shortDesc: string;
  description: string;
  criteria: string[];
  eligibility: string;
  icon: string;
  coverText: string;
  group: NomGroup;
  requiresLegalReview?: boolean;
  nominees: NomineeSeed[];
};

const t = (slug: string, name: string, tagline: string): NomineeSeed => ({ slug, name: `${name} (тест)`, tagline });

export const NOMINATION_SEEDS: NominationSeed[] = [
  {
    slug: "media-buying-team",
    title: "Лучшая медиабаинговая команда",
    shortDesc: "Команды, которые лили больше и стабильнее всех",
    description:
      "Награда арбитражной команде, которая в этом году показала результат на объёмах и удержала его. Размер команды, источники и вертикали значения не имеют.",
    criteria: [
      "Объёмы и стабильность результата за год",
      "Репутация у партнёрок и рекламодателей",
      "Публичные кейсы и вклад в комьюнити",
      "Условия для байеров внутри команды",
    ],
    eligibility: "Арбитражные команды любого размера, работающие на любых источниках и вертикалях.",
    icon: "users",
    coverText: "Команда",
    group: "TEAMS",
    nominees: [
      t("nord-media", "Nord Media", "FB и TikTok, гемблинг в Tier-1"),
      t("krot-squad", "Krot Squad", "In-app трафик и свои приложения"),
      t("team-404", "404 Team", "Нутра в Латаме, 30 байеров"),
      t("tihiy-zaliv", "Тихий Залив", "Google UAC, крипта и финансы"),
      t("burj-buyers", "Burj Buyers", "Арабские гео, COD и нутра"),
    ],
  },
  {
    slug: "influence-agency",
    title: "Лучшее инфлюенс-агентство",
    shortDesc: "Агентства, которые делают рынку рекламу у блогеров",
    description:
      "Агентства и команды, которые закупают рекламу у блогеров и в каналах для арбитражного рынка: подбирают площадки, ведут размещения и отвечают за результат.",
    criteria: [
      "Результативность размещений",
      "Прозрачность: отчёты и честная статистика",
      "Качество подбора блогеров и каналов",
      "Отзывы клиентов",
    ],
    eligibility: "Инфлюенс-агентства и команды по закупке рекламы у блогеров и в каналах для арбитражного рынка.",
    icon: "sparkles",
    coverText: "Инфлюенс",
    group: "TEAMS",
    nominees: [
      t("blogger-hub", "Blogger Hub", "Закупка рекламы у блогеров в TikTok и Reels"),
      t("channel-buy", "Channel Buy", "Посевы в Telegram-каналах"),
      t("influx-agency", "Influx Agency", "Инфлюенс под гемблинг и беттинг"),
      t("rekla-crew", "Rekla Crew", "Интеграции у YouTube-блогеров"),
    ],
  },
  {
    slug: "design-agency",
    title: "Лучшее дизайн-агентство",
    shortDesc: "Студии креативов, лендингов и брендинга для рынка",
    description:
      "Те, кто делает рынку лицо: креативы, которые проходят модерацию и дают CTR, лендинги, которые конвертят, и брендинг, который запоминают.",
    criteria: [
      "Качество и результативность работ",
      "Скорость и соблюдение сроков",
      "Понимание специфики источников и модерации",
      "Отзывы команд и партнёрок",
    ],
    eligibility: "Студии и агентства креативов, лендингов и брендинга для арбитражного рынка.",
    icon: "pen-tool",
    coverText: "Дизайн",
    group: "TEAMS",
    nominees: [
      t("creo-forge", "Creo Forge", "Видео-крео под гемблинг и беттинг"),
      t("lend-lab", "Lend Lab", "Лендинги и преленды под нутру"),
      t("pixel-zaliv", "Pixel Zaliv", "Статика и моушн для TikTok и FB"),
      t("brand-petal", "Brand Petal", "Брендинг партнёрок и сервисов"),
      t("ugc-factory", "UGC Factory", "UGC-ролики с актёрами под любые гео"),
    ],
  },
  {
    slug: "platform-launch",
    title: "Открытие года",
    shortDesc: "Новые сервисы, ПП, трекеры и платёжки этого года",
    description:
      "Продукты, которые появились на рынке в этом году и успели стать рабочим инструментом: партнёрки, трекеры, антидетекты, платёжки и другие сервисы.",
    criteria: [
      "Запуск в этом году",
      "Польза для байеров и команд",
      "Надёжность и поддержка",
      "Скорость развития продукта",
    ],
    eligibility: "Новые сервисы, партнёрки, трекеры, антидетекты и платёжки, запущенные в этом году.",
    icon: "rocket",
    coverText: "Открытие",
    group: "MARKET",
    nominees: [
      t("maskbox", "Maskbox", "Антидетект-браузер для командной работы"),
      t("trekly", "Trekly", "Трекер с клоакой и автоправилами"),
      t("paylily", "PayLily", "Виртуальные карты под рекламные кабинеты"),
      t("mango-cpa", "Mango CPA", "Партнёрка с эксклюзивами по Индии"),
      t("proksima", "Proksima", "Мобильные прокси, 90 стран"),
    ],
  },
  {
    slug: "loudest-event",
    title: "Самое громкое событие года",
    shortDesc: "Конференции, митапы и вечеринки, о которых говорили",
    description:
      "Событие, после которого ленты неделю были забиты фотками и инсайтами: конференция, митап, вечеринка или любой другой ивент рынка.",
    criteria: [
      "Масштаб и состав участников",
      "Качество программы и нетворкинга",
      "Организация",
      "Сколько о событии говорили после",
    ],
    eligibility: "Конференции, митапы, вечеринки и другие события арбитражного рынка этого года.",
    icon: "megaphone",
    coverText: "Событие",
    group: "MARKET",
    nominees: [
      t("zaliv-conf", "Zaliv Conf", "Двухдневная конференция, 3 000 участников"),
      t("buyers-night", "Buyers Night", "Закрытая вечеринка для команд"),
      t("cpa-camp", "CPA Camp", "Выездной кемп на 200 человек"),
      t("meetup-na-kryshe", "Митап на крыше", "Серия камерных встреч байеров"),
    ],
  },
  {
    slug: "news-channel",
    title: "Лучший новостной канал",
    shortDesc: "Каналы и медиа с новостями арбитража",
    description:
      "Откуда рынок узнаёт новости первым: Telegram-каналы и медиа, которые пишут быстро, точно и без воды.",
    criteria: [
      "Скорость и точность новостей",
      "Собственные материалы, а не репосты",
      "Регулярность",
      "Доверие аудитории",
    ],
    eligibility: "Telegram-каналы и медиа с новостями арбитража.",
    icon: "newspaper",
    coverText: "Новости",
    group: "MEDIA",
    nominees: [
      t("cpa-segodnya", "CPA сегодня", "Новости рынка каждый день в 10:00"),
      t("lenta-bayera", "Лента байера", "Апдейты источников и модерации"),
      t("traffic-wire", "Traffic Wire", "Короткие новости без комментариев"),
      t("arbitrazh-digest", "Арбитраж-дайджест", "Главное за неделю в одном посте"),
      t("ban-radar", "Ban Radar", "Сводки по банам и обновлениям политик"),
    ],
  },
  {
    slug: "jobs-channel",
    title: "Лучший канал по вакансиям",
    shortDesc: "Где рынок ищет работу и людей",
    description:
      "Каналы и площадки, через которые команды находят байеров, а специалисты — работу: с проверенными вакансиями и понятными условиями.",
    criteria: [
      "Качество и проверка вакансий",
      "Число закрытых позиций",
      "Удобство поиска",
      "Отсутствие скама",
    ],
    eligibility: "Каналы и площадки с вакансиями и резюме в арбитраже.",
    icon: "briefcase",
    coverText: "Вакансии",
    group: "MEDIA",
    nominees: [
      t("cpa-rabota", "CPA Работа", "Вакансии команд и партнёрок"),
      t("buyer-jobs", "Buyer Jobs", "Только медиабайинг, только проверенные"),
      t("hr-zaliv", "HR Залив", "Вакансии и резюме с вилками"),
      t("team-hunt", "Team Hunt", "Подбор тимлидов и хедов"),
    ],
  },
  {
    slug: "breakthrough",
    title: "Прорыв года",
    shortDesc: "Самый заметный рост за год",
    description:
      "Человек, команда или проект, о которых год назад почти никто не знал, а сегодня знают все. Награда за рост, а не за размер.",
    criteria: [
      "Рост за год в сравнении с собой",
      "Новые подходы и связки",
      "Заметность в комьюнити",
      "Устойчивость результата",
    ],
    eligibility: "Человек, команда или проект с самым заметным ростом за год.",
    icon: "trending-up",
    coverText: "Прорыв",
    group: "MARKET",
    nominees: [
      t("svyazka-lab", "Svyazka Lab", "Команда, открывшая рынку Threads"),
      t("uplift-crew", "Uplift Crew", "С нуля до 15 байеров за год"),
      t("granit-ads", "Granit Ads", "Агентские кабинеты без предоплаты"),
      t("kometa-team", "Kometa Team", "Telegram Ads и мини-аппы"),
      t("solo-rocket", "Solo Rocket", "Соло-байер, выросший в команду"),
    ],
  },
  {
    slug: "scandal-of-the-year",
    title: "Главный скандал года",
    shortDesc: "События, которые обсуждал весь рынок",
    description:
      "Публичные события и истории рынка, которые обсуждали все. Участники этой номинации — события, а не люди или компании. Мы описываем их нейтрально и только по публичным источникам.",
    criteria: [
      "Событие публичное и подтверждается источниками",
      "Его широко обсуждали в комьюнити",
      "Оно повлияло на рынок или на правила игры",
    ],
    eligibility: "Публичные события и истории арбитражного рынка этого года.",
    icon: "flame",
    coverText: "Скандал",
    group: "MARKET",
    requiresLegalReview: true,
    nominees: [
      {
        slug: "event-moderation-wave",
        name: "Волна блокировок рекламных кабинетов в марте (тест)",
        tagline: "Массовые блокировки агентских кабинетов за одну неделю",
        sources: ["https://example.com/test-source-1"],
        legalChecked: true,
      },
      {
        slug: "event-payout-delay",
        name: "Задержка выплат в партнёрской сети «Пример» (тест)",
        tagline: "Выплаты вебмастерам задержались на три недели",
        sources: ["https://example.com/test-source-2", "https://example.com/test-source-3"],
        rightOfReply: "Тестовый комментарий стороны: задержка была вызвана сменой платёжного провайдера, все выплаты проведены.",
        legalChecked: true,
      },
      {
        slug: "event-conference-cancel",
        name: "Отмена конференции за два дня до начала (тест)",
        tagline: "Организаторы перенесли событие и вернули билеты",
        sources: ["https://example.com/test-source-4"],
        legalChecked: true,
      },
      {
        slug: "event-tracker-outage",
        name: "Суточный сбой популярного трекера (тест)",
        tagline: "Сервис был недоступен 26 часов",
        sources: ["https://example.com/test-source-5"],
        legalChecked: true,
      },
      {
        // Не проверен — на сайте не показывается, пока админ не отметит «Проверено».
        slug: "event-unchecked",
        name: "Событие без юридической проверки (тест)",
        tagline: "Этой карточки не должно быть видно на сайте",
        sources: ["https://example.com/test-source-6"],
        legalChecked: false,
      },
    ],
  },
];
