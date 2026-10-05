"use client";

// Клиентская часть аналитики: копит события и отправляет пачками на /api/t.
// Без согласия на аналитические cookie идентификатор посетителя не создаётся и не отправляется.

type Meta = Record<string, string | number | boolean>;
type QueuedEvent = { type: string; path: string; ts: number; meta?: Meta };

const CONSENT_COOKIE = "aff_consent";
const VISITOR_COOKIE = "aff_vid";
const YEAR = 365 * 24 * 60 * 60;
const SESSION_IDLE_MS = 30 * 60 * 1000;

let queue: QueuedEvent[] = [];
let timer: number | undefined;

const cookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? null;
const setCookie = (name: string, value: string, maxAge: number) =>
  (document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`);
const randomId = () => crypto.randomUUID().replace(/-/g, "");

export type Consent = "all" | "necessary" | null;
export const getConsent = (): Consent => cookie(CONSENT_COOKIE) as Consent;

export function setConsent(value: "all" | "necessary") {
  setCookie(CONSENT_COOKIE, value, YEAR);
  if (value === "necessary") setCookie(VISITOR_COOKIE, "", 0);
}

function visitorId() {
  if (getConsent() !== "all") return null;
  let id = cookie(VISITOR_COOKIE);
  if (!id) id = randomId();
  setCookie(VISITOR_COOKIE, id, YEAR);
  return id;
}

/** Идентификатор визита: живёт во вкладке, сбрасывается после 30 минут без действий. */
function sessionInfo() {
  try {
    const now = Date.now();
    const saved = JSON.parse(sessionStorage.getItem("aff_session") ?? "null") as
      | { id: string; at: number; ref: string | null; utm: Record<string, string | null> }
      | null;
    const fresh = saved && now - saved.at < SESSION_IDLE_MS;
    const params = new URLSearchParams(location.search);
    let referrer: string | null = null;
    try {
      const host = document.referrer ? new URL(document.referrer).hostname : null;
      referrer = host && host !== location.hostname ? host : null;
    } catch {}
    const session = fresh
      ? { ...saved, at: now }
      : {
          id: randomId(),
          at: now,
          ref: referrer,
          utm: { source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign") },
        };
    sessionStorage.setItem("aff_session", JSON.stringify(session));
    return session;
  } catch {
    return { id: null, ref: null, utm: {} };
  }
}

export function flush(useBeacon = false) {
  window.clearTimeout(timer);
  timer = undefined;
  if (queue.length === 0) return;
  const session = sessionInfo();
  const body = JSON.stringify({ sid: session.id, vid: visitorId(), ref: session.ref, utm: session.utm, events: queue });
  queue = [];
  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/t", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/t", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  }
}

export function track(type: string, meta?: Meta) {
  if (typeof window === "undefined") return;
  // Источник перехода и UTM запоминаем сразу: к моменту отправки человек может уйти на другую страницу.
  sessionInfo();
  queue.push({ type, path: location.pathname + location.search, ts: Date.now(), meta });
  // После клика человек, скорее всего, уйдёт со страницы — отправляем сразу, не дожидаясь таймера.
  if (queue.length >= 10 || type.endsWith("_click")) return flush();
  timer ??= window.setTimeout(() => flush(), 2000);
}
