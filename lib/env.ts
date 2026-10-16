export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Контакты AFFILKI (владелец, 2026-10-16). Переменные окружения нужны, только чтобы их переопределить.
/** Реклама, спонсорство, сотрудничество. */
export const PARTNERS_CONTACT_URL = process.env.PARTNERS_CONTACT_URL ?? "https://t.me/affilki_partners";
/** Поддержка: вход, голос, заявки, удаление данных. */
export const SUPPORT_CONTACT_URL = process.env.SUPPORT_CONTACT_URL ?? "https://t.me/affilki_support";
/** Владелец проекта. */
export const OWNER_CONTACT_URL = process.env.OWNER_CONTACT_URL ?? "https://t.me/affilki_owner";

/** @username из ссылки t.me. */
export const handleOf = (url: string) => `@${url.split("/").pop()}`;

// Ссылка на канал AFFILKI.
export const TG_CHANNEL_URL = process.env.TG_CHANNEL_URL ?? "https://t.me/affilki_cpa";
