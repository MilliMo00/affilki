// Разбор User-Agent: устройство, браузер, ОС и признак бота. Сам UA в базу не пишется.

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|httpclient|scrapy|facebookexternalhit|telegrambot|whatsapp|vkshare/i;

export const isBot = (ua: string) => ua.length < 20 || BOT.test(ua);

export function parseUa(ua: string) {
  const device = /iPad|Tablet|(Android(?!.*Mobile))/.test(ua) ? "tablet" : /Mobi|iPhone|Android/.test(ua) ? "mobile" : "desktop";
  const browser = /YaBrowser/.test(ua)
    ? "Yandex"
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
              : "Other";
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
            : "Other";
  return { device, browser, os };
}
