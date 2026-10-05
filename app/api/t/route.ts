import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { entityOf, recordEvents, type EventInput } from "@/lib/analytics/record";
import { rateLimiter } from "@/lib/ratelimit";
import { clientIp, hashValue } from "@/lib/request";

// Типы, которые может прислать браузер. Шаги входа и голоса пишет только сервер.
const CLIENT_TYPES = ["page_view", "ad_impression", "ad_click", "vote_click", "share_click", "article_read"] as const;

const id = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
const short = z.string().max(120);

const bodySchema = z.object({
  sid: id.nullish(),
  vid: id.nullish(),
  ref: short.nullish(),
  utm: z.object({ source: short.nullish(), medium: short.nullish(), campaign: short.nullish() }).nullish(),
  events: z
    .array(
      z.object({
        type: z.enum(CLIENT_TYPES),
        path: z.string().max(300).regex(/^\//),
        ts: z.number().int().nullish(),
        meta: z.record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()])).nullish(),
      }),
    )
    .min(1)
    .max(50),
});

const DAY = 86_400_000;

/** Приём событий аналитики пачкой. sendBeacon шлёт сюда же при уходе со страницы. */
export async function POST(request: Request) {
  const ipHash = hashValue(clientIp(request));
  if (!(await rateLimiter.hit(`t:${ipHash}`, 120, 60_000)).ok) return new NextResponse(null, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  const { sid, vid, ref, utm, events } = parsed.data;

  const now = Date.now();
  const rows: EventInput[] = events.map((event) => ({
    type: event.type,
    path: event.path,
    ...entityOf(event.path.split("?")[0]),
    sessionId: sid ?? null,
    visitorId: vid ?? null,
    referrer: ref ?? null,
    utmSource: utm?.source ?? null,
    utmMedium: utm?.medium ?? null,
    utmCampaign: utm?.campaign ?? null,
    meta: event.meta ?? undefined,
    // Время клиента принимаем только в разумных пределах — иначе серверное.
    ts: event.ts && Math.abs(now - event.ts) < DAY ? new Date(event.ts) : new Date(now),
  }));

  // Счётчик просмотров статьи: не чаще раза в сутки на посетителя.
  for (const row of rows) {
    if (row.type !== "page_view" || row.entityType !== "article" || !row.entityId) continue;
    const seen = await db.analyticsEvent.findFirst({
      where: {
        type: "page_view",
        entityType: "article",
        entityId: row.entityId,
        ts: { gte: new Date(now - DAY) },
        OR: [{ ipHash }, ...(vid ? [{ visitorId: vid }] : [])],
      },
      select: { id: true },
    });
    if (!seen) await db.article.updateMany({ where: { slug: row.entityId }, data: { views: { increment: 1 } } });
  }

  await recordEvents(request, rows);
  return new NextResponse(null, { status: 204 });
}
