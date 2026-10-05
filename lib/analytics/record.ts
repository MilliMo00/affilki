import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clientIp, hashValue } from "@/lib/request";
import { countryOf } from "./geo";
import { isBot, parseUa } from "./ua";

export type EventInput = {
  type: string;
  path?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  sessionId?: string | null;
  visitorId?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  meta?: Prisma.InputJsonValue;
  ts?: Date;
};

// Cookie админ-сессии: действия админов в статистику не попадают.
const ADMIN_COOKIE = /(?:^|;\s*)(?:__Host-)?aff_admin=/;

/** Сущность по адресу страницы: статья, участник или номинация. */
export function entityOf(path: string): { entityType: string; entityId: string } | null {
  const match = /^\/(a|n|awards)\/([a-z0-9-]{1,120})\/?$/.exec(path);
  if (!match || (match[1] === "awards" && match[2] === "live")) return null;
  return { entityType: { a: "article", n: "nominee", awards: "nomination" }[match[1]]!, entityId: match[2] };
}

/** Что известно о запросе; null — если это бот или админ, и событие писать не нужно. */
export async function requestContext(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua) || ADMIN_COOKIE.test(request.headers.get("cookie") ?? "")) return null;
  const ip = clientIp(request);
  return { ipHash: hashValue(ip), country: await countryOf(ip), ...parseUa(ua) };
}

/** Пишет события одного запроса. Ошибки аналитики никогда не ломают основной сценарий. */
export async function recordEvents(request: Request, events: EventInput[]) {
  try {
    const context = await requestContext(request);
    if (!context || events.length === 0) return 0;
    const result = await db.analyticsEvent.createMany({ data: events.map((event) => ({ ...context, ...event })) });
    return result.count;
  } catch (error) {
    console.error("analytics:", error);
    return 0;
  }
}

/** Событие, которое возникает на сервере (шаги входа, голос, заявка). Не ждём записи. */
export function recordServerEvent(request: Request | null, event: EventInput) {
  if (request) return void recordEvents(request, [event]);
  // Шаги внутри бота: запроса от браузера нет, пишем событие без контекста.
  void db.analyticsEvent.create({ data: event }).catch((error) => console.error("analytics:", error));
}
