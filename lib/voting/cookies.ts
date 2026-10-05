import type { NextRequest, NextResponse } from "next/server";
import { LOGIN_TTL_MS } from "./login";

const PROD = process.env.NODE_ENV === "production";

// Префикс __Host- заставляет браузер принимать cookie только по HTTPS и только для этого хоста.
export const SESSION_COOKIE = PROD ? "__Host-aff_s" : "aff_s";
export const LOGIN_COOKIE = PROD ? "__Host-aff_login" : "aff_login";

// Браузеры не хранят cookie дольше 400 дней, поэтому она продлевается при каждом заходе на сайт.
const SESSION_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

const base = { httpOnly: true, secure: PROD, sameSite: "lax" as const, path: "/" };

export const sessionToken = (request: NextRequest) => request.cookies.get(SESSION_COOKIE)?.value;
export const loginSecret = (request: NextRequest) => request.cookies.get(LOGIN_COOKIE)?.value;

export function setLoginCookie(response: NextResponse, secret: string) {
  response.cookies.set(LOGIN_COOKIE, secret, { ...base, maxAge: LOGIN_TTL_MS / 1000 });
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, { ...base, maxAge: SESSION_COOKIE_MAX_AGE });
  response.cookies.set(LOGIN_COOKIE, "", { ...base, maxAge: 0 });
}

/** Продлевает cookie действующей сессии ещё на 400 дней. */
export function refreshSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, { ...base, maxAge: SESSION_COOKIE_MAX_AGE });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...base, maxAge: 0 });
}
