import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PATH = (process.env.ADMIN_PATH ?? "/ctrl-dev").replace(/\/+$/, "");
const ADMIN_INTERNAL = "/admin-internal";
const ALLOWLIST = (process.env.ADMIN_IP_ALLOWLIST ?? "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);
const DEV = process.env.NODE_ENV === "development";

const notFound = () => new NextResponse(null, { status: 404 });

/**
 * Строгий CSP: скрипты выполняются только с одноразовым nonce этого запроса
 * (и те, что такие скрипты подгрузили сами). Инлайн-скрипт без nonce — в том числе
 * внедрённый через XSS — браузер не выполнит.
 */
function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    // В разработке React нужен eval для отладки; в проде его нет.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${DEV ? " 'unsafe-eval'" : ""}`,
    // Инлайн-стили нужны анимациям (атрибут style); выполнить код через них нельзя.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    // Единственный чужой фрейм — капча Cloudflare Turnstile.
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(DEV ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Обычный /admin и внутренний путь отдают 404: админку нельзя найти перебором.
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith(ADMIN_INTERNAL)) return notFound();

  const isAdmin = pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);
  if (isAdmin && ALLOWLIST.length > 0) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    if (!ALLOWLIST.includes(ip)) return notFound();
  }

  // API и загруженные файлы — не страницы: CSP страницы им не нужен (у файлов он свой, строже).
  const isDocument = !pathname.startsWith("/api/") && !pathname.startsWith("/uploads/") && !pathname.includes("/api/");
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  if (isDocument) {
    // Next читает nonce из CSP в заголовках запроса и ставит его на свои скрипты.
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }

  let response: NextResponse;
  if (isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_INTERNAL + pathname.slice(ADMIN_PATH.length);
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    // Адрес не упоминается в robots.txt — индексацию запрещают заголовки ответа.
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "no-store");
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isDocument) response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Прокси обрабатывает и prefetch-запросы: иначе запрос с заголовком prefetch обошёл бы запрет на /admin-internal.
  matcher: ["/((?!_next/static|_next/image|brand/|icon.svg).*)"],
};
