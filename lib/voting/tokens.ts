import { createHash, randomBytes } from "node:crypto";

/** Случайный токен: 24 байта = 192 бита, 32 символа base64url. */
export const randomToken = () => randomBytes(24).toString("base64url");

/** В базе лежит только хэш секрета — утечка базы не даёт чужих сессий. */
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** «Chrome, macOS» — подпись браузера для сообщения бота. */
export function uaLabel(ua: string) {
  const browser = /YaBrowser/.test(ua)
    ? "Яндекс Браузер"
    : /Edg\//.test(ua)
      ? "Edge"
      : /OPR\//.test(ua)
        ? "Opera"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Браузер";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "неизвестная система";
  return `${browser}, ${os}`;
}
