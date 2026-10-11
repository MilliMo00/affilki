import { createHash } from "node:crypto";

/**
 * IP клиента. Сайт стоит за Caddy, который сам дописывает адрес клиента в конец X-Forwarded-For,
 * поэтому берём последний элемент: всё, что левее, мог подставить сам клиент.
 * IPv6 приводим к подсети /64: у одного абонента их миллиарды, и по отдельным адресам лимиты бесполезны.
 */
export function clientIp(request: Request) {
  return normalizeIp(request.headers.get("x-forwarded-for"));
}

/** Точный адрес клиента — для определения страны и для Turnstile; в базе и в лимитах его не используем. */
export function rawClientIp(headerValue: string | null | undefined) {
  const parts = headerValue?.split(",") ?? [];
  return parts[parts.length - 1]?.trim() || "unknown";
}

export function normalizeIp(header: string | null | undefined) {
  const parts = header?.split(",") ?? [];
  const ip = parts[parts.length - 1]?.trim();
  if (!ip) return "unknown";
  if (!ip.includes(":") || ip.startsWith("::ffff:")) return ip.replace(/^::ffff:/, "");
  // Раскрываем «::» и оставляем первые четыре группы.
  const [head, tail = ""] = ip.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right] : left;
  return `${groups.slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

/** Соль для хэшей. В проде без неё не работаем: с известной солью хэш IPv4 или Telegram ID подбирается за секунды. */
export function hashSalt() {
  const salt = process.env.IP_HASH_SALT;
  if (salt) return salt;
  if (process.env.NODE_ENV === "production") throw new Error("IP_HASH_SALT не задан");
  return "dev-salt";
}

/** Хэш с солью из env: сами IP и User-Agent мы не храним. */
export function hashValue(value: string) {
  return createHash("sha256").update(`${hashSalt()}:${value}`).digest("hex").slice(0, 32);
}

/** Мутации принимаем только со своего origin (защита от CSRF). */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
