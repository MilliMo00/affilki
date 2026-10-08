// Профиль участника номинации: ссылки-кнопки, кейсы, год основания и отдельные блоки текста.
// Модуль без серверных зависимостей — им пользуются и формы в браузере, и сервер.

export type LinkButton = { title: string; url: string };
export type CaseItem = { title: string; text: string; url: string | null; imageUrl: string | null };

/** Поля заявки в номинацию сверх общих (хранятся в Submission.details). */
export type NomineeDetails = {
  foundedYear: number | null;
  achievements: string;
  whyVote: string;
  cases: CaseItem[];
};

/** То, что хранится у участника в Nominee.profile. */
export type NomineeProfile = NomineeDetails & { buttons: LinkButton[] };

export const MAX_LINKS = 8;
export const MAX_CASES = 6;
export const FIRST_YEAR = 1990;

const HTTPS = /^https:\/\/[^\s"'<>]+$/;
// Картинка кейса — только наша загрузка: чужой адрес подставить нельзя.
const OWN_UPLOAD = /^\/uploads\/[a-f0-9]{24}\.(?:png|jpg|gif|webp)$/;

const KNOWN_HOSTS: [RegExp, string][] = [
  [/(^|\.)t\.me$/, "Telegram"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)vk\.com$/, "ВКонтакте"],
  [/(^|\.)(x\.com|twitter\.com)$/, "X"],
  [/(^|\.)behance\.net$/, "Behance"],
];

/** Подпись кнопки, если автор её не указал: название известной площадки или домен. */
export function linkTitle(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return KNOWN_HOSTS.find(([pattern]) => pattern.test(host))?.[1] ?? host;
  } catch {
    return "Ссылка";
  }
}

export const isTelegramLink = (url: string) => /^https:\/\/(?:www\.)?t\.me\//.test(url);

const text = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");

/** Ссылки из базы. Старые заявки хранили просто строки — они читаются как ссылки без подписи. */
export function readLinks(value: unknown): LinkButton[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? { title: "", url: item } : { title: text(item?.title, 40), url: text(item?.url, 300) }))
    .filter((link) => HTTPS.test(link.url))
    .map((link) => ({ title: link.title || linkTitle(link.url), url: link.url }));
}

function readCases(value: unknown): CaseItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const url = text(item?.url, 300);
      const imageUrl = text(item?.imageUrl, 80);
      return {
        title: text(item?.title, 120),
        text: text(item?.text, 800),
        url: HTTPS.test(url) ? url : null,
        imageUrl: OWN_UPLOAD.test(imageUrl) ? imageUrl : null,
      };
    })
    .filter((item) => item.title);
}

export function readDetails(value: unknown): NomineeDetails {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const year = Number(raw.foundedYear);
  return {
    foundedYear: Number.isInteger(year) && year >= FIRST_YEAR && year <= new Date().getFullYear() ? year : null,
    achievements: text(raw.achievements, 3000),
    whyVote: text(raw.whyVote, 2000),
    cases: readCases(raw.cases),
  };
}

export function readProfile(value: unknown): NomineeProfile {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return { ...readDetails(raw), buttons: readLinks(raw.buttons) };
}

// ── Разбор формы ───────────────────────────────────────────────────────────

type Errors = Record<string, string>;

function parseJson(value: FormDataEntryValue | null): unknown[] | null {
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Ссылки из формы: поле linksJson — список { title, url }. Пустые строки пропускаются. */
export function parseLinks(formData: FormData, field = "linksJson"): { links: LinkButton[] } | { errors: Errors } {
  const rows = (parseJson(formData.get(field)) ?? [])
    .map((item) => ({ title: text((item as LinkButton)?.title, 200), url: text((item as LinkButton)?.url, 400) }))
    .filter((row) => row.title || row.url);
  if (rows.length > MAX_LINKS) return { errors: { links: `Не больше ${MAX_LINKS} ссылок` } };
  for (const row of rows) {
    if (!HTTPS.test(row.url) || row.url.length > 300) return { errors: { links: `Ссылка «${row.title || row.url}» должна начинаться с https://` } };
    if (row.title.length > 40) return { errors: { links: "Название ссылки — не длиннее 40 символов" } };
  }
  return { links: rows.map((row) => ({ title: row.title || linkTitle(row.url), url: row.url })) };
}

export type ParsedCase = CaseItem & { key: string };

/**
 * Кейсы из формы: поле casesJson — список { key, title, text, url, imageUrl }.
 * Файл картинки приходит отдельным полем `caseImage:<key>` — его сохраняет вызывающий.
 */
export function parseCases(formData: FormData): { cases: ParsedCase[] } | { errors: Errors } {
  const rows = (parseJson(formData.get("casesJson")) ?? [])
    .map((item) => {
      const raw = (item ?? {}) as Record<string, unknown>;
      return {
        key: text(raw.key, 40).replace(/[^a-z0-9]/gi, ""),
        title: text(raw.title, 200),
        text: text(raw.text, 2000),
        url: text(raw.url, 400),
        imageUrl: text(raw.imageUrl, 80),
      };
    })
    .filter((row) => row.title || row.text || row.url || row.imageUrl || formData.get(`caseImage:${row.key}`) instanceof File);
  if (rows.length > MAX_CASES) return { errors: { cases: `Не больше ${MAX_CASES} кейсов` } };

  const cases: ParsedCase[] = [];
  for (const row of rows) {
    if (row.title.length < 2) return { errors: { cases: "У каждого кейса должно быть название" } };
    if (row.title.length > 120) return { errors: { cases: "Название кейса — не длиннее 120 символов" } };
    if (row.text.length > 800) return { errors: { cases: `Описание кейса «${row.title}» — не длиннее 800 символов` } };
    if (row.url && (!HTTPS.test(row.url) || row.url.length > 300)) return { errors: { cases: `Ссылка в кейсе «${row.title}» должна начинаться с https://` } };
    cases.push({ key: row.key, title: row.title, text: row.text, url: row.url || null, imageUrl: OWN_UPLOAD.test(row.imageUrl) ? row.imageUrl : null });
  }
  return { cases };
}

/** Год основания из формы: пусто — не указан. */
export function parseYear(value: FormDataEntryValue | null): { year: number | null } | { errors: Errors } {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return { year: null };
  const year = Number(raw);
  const now = new Date().getFullYear();
  if (!Number.isInteger(year) || year < FIRST_YEAR || year > now) return { errors: { foundedYear: `Год основания — от ${FIRST_YEAR} до ${now}` } };
  return { year };
}

/** «с 2019 года · 7 лет на рынке» — для карточки участника. */
export function yearsOnMarket(foundedYear: number, now = new Date()) {
  return Math.max(0, now.getFullYear() - foundedYear);
}
