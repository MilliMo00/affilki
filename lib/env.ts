export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const ADS_CONTACT_URL = process.env.ADS_CONTACT_URL ?? "https://t.me/yappi_manager";

// Ссылка на канал AFFILKI. Пока канал не задан — ведёт на контакт.
export const TG_CHANNEL_URL = process.env.TG_CHANNEL_URL ?? ADS_CONTACT_URL;
