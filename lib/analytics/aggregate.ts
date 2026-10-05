import { createHash } from "node:crypto";
import { db } from "@/lib/db";

const DAY = 86_400_000;
export const RAW_RETENTION_DAYS = 180;
export const TG_ID_RETENTION_DAYS = 90;

const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

/** Сворачивает события одних суток (UTC) в DailyStat. Повторный запуск пересчитывает день заново. */
export async function aggregateDay(day: Date) {
  const from = startOfUtcDay(day);
  const to = new Date(from.getTime() + DAY);
  const [, inserted] = await db.$transaction([
    db.dailyStat.deleteMany({ where: { date: from } }),
    db.$executeRaw`
      insert into "DailyStat" (id, date, type, "entityType", "entityId", source, device, count, uniques)
      select gen_random_uuid()::text, ${from}::date, type,
             coalesce("entityType", ''), coalesce("entityId", ''),
             coalesce(nullif("utmSource", ''), referrer, ''), coalesce(device, ''),
             count(*)::int,
             count(distinct coalesce("visitorId", "sessionId", "ipHash", id::text))::int
      from "AnalyticsEvent"
      where ts >= ${from} and ts < ${to}
      group by type, coalesce("entityType", ''), coalesce("entityId", ''),
               coalesce(nullif("utmSource", ''), referrer, ''), coalesce(device, '')`,
  ]);
  return inserted;
}

/** Сырые события старше 180 дней удаляются; агрегаты остаются. */
export async function purgeOldEvents(now = new Date()) {
  const result = await db.analyticsEvent.deleteMany({ where: { ts: { lt: new Date(now.getTime() - RAW_RETENTION_DAYS * DAY) } } });
  return result.count;
}

/**
 * Через 90 дней после конца сезона Telegram ID голосовавших заменяются необратимым хэшем.
 * Сами голоса остаются, чтобы итоги можно было пересчитать; сессии и ссылки входа удаляются.
 */
export async function anonymizeVoters(now = new Date()) {
  const cutoff = new Date(now.getTime() - TG_ID_RETENTION_DAYS * DAY);
  const seasons = await db.season.findMany({ where: { votingEndsAt: { lt: cutoff } }, select: { id: true } });
  if (seasons.length === 0) return 0;
  // Пока идёт более поздний сезон, сессии ещё нужны — чистим только когда закончились все.
  const active = await db.season.count({ where: { votingEndsAt: { gte: cutoff } } });

  const salt = process.env.IP_HASH_SALT ?? "dev-salt";
  const votes = await db.vote.findMany({
    where: { nomination: { seasonId: { in: seasons.map((s) => s.id) } }, tgUserId: { gt: 0 } },
    select: { id: true, tgUserId: true },
  });
  for (const vote of votes) {
    // Отрицательное число из хэша: не пересекается с настоящими ID и сохраняет уникальность (аккаунт, номинация).
    const digest = createHash("sha256").update(`${salt}:${vote.tgUserId}`).digest();
    const hashed = -(digest.readBigUInt64BE(0) >> BigInt(2)) - BigInt(1);
    await db.vote.update({ where: { id: vote.id }, data: { tgUserId: hashed, tgUsername: null } });
  }
  if (active === 0) {
    await db.voterSession.deleteMany();
    await db.loginIntent.deleteMany();
  }
  return votes.length;
}
