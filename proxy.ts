import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PATH = (process.env.ADMIN_PATH ?? "/ctrl-dev").replace(/\/+$/, "");
const ADMIN_INTERNAL = "/admin-internal";
const ALLOWLIST = (process.env.ADMIN_IP_ALLOWLIST ?? "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

const notFound = () => new NextResponse(null, { status: 404 });

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Обычный /admin и внутренний путь отдают 404: админку нельзя найти перебором.
  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith(ADMIN_INTERNAL)) return notFound();

  if (pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)) {
    if (ALLOWLIST.length > 0) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
      if (!ALLOWLIST.includes(ip)) return notFound();
    }
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_INTERNAL + pathname.slice(ADMIN_PATH.length);
    const response = NextResponse.rewrite(url);
    // Адрес не упоминается в robots.txt — индексацию запрещают заголовки ответа.
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|brand/|icon.svg).*)"],
};
