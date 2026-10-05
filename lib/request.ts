import { createHash } from "node:crypto";

/** IP клиента. Сайт стоит за Caddy, который сам выставляет X-Forwarded-For. */
export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** Хэш с солью из env: сами IP и User-Agent мы не храним. */
export function hashValue(value: string) {
  const salt = process.env.IP_HASH_SALT ?? "dev-salt";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 32);
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
