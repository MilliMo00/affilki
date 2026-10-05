import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { aggregateDay, anonymizeVoters, purgeOldEvents } from "@/lib/analytics/aggregate";
import { entityOf } from "@/lib/analytics/record";
import { isBot, parseUa } from "@/lib/analytics/ua";
import { db } from "@/lib/db";

assert.match(process.env.DATABASE_URL ?? "", /affilki_test/, "тесты запускаются только на тестовой базе");

const DAY = 86_400_000;

beforeEach(async () => {
  await db.analyticsEvent.deleteMany();
  await db.dailyStat.deleteMany();
  await db.vote.deleteMany();
  await db.voterSession.deleteMany();
  await db.nominee.deleteMany();
  await db.nomination.deleteMany();
  await db.season.deleteMany();
});

after(() => db.$disconnect());

test("боты отсекаются по User-Agent, обычные браузеры — нет", () => {
  assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), true);
  assert.equal(isBot("curl/8.4.0"), true);
  assert.equal(isBot(""), true);
  const chrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
  assert.equal(isBot(chrome), false);
  assert.deepEqual(parseUa(chrome), { device: "desktop", browser: "Chrome", os: "macOS" });
  assert.equal(parseUa("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1").device, "mobile");
});

test("сущность определяется по адресу страницы", () => {
  assert.deepEqual(entityOf("/a/some-article"), { entityType: "article", entityId: "some-article" });
  assert.deepEqual(entityOf("/n/nord-media"), { entityType: "nominee", entityId: "nord-media" });
  assert.deepEqual(entityOf("/awards/news-channel"), { entityType: "nomination", entityId: "news-channel" });
  assert.equal(entityOf("/awards/live"), null);
  assert.equal(entityOf("/awards"), null);
});

test("агрегат за день: счётчик и уникальные, повторный запуск не удваивает", async () => {
  const ts = new Date(Date.UTC(2026, 9, 1, 12));
  const view = (visitorId: string, extra: object = {}) => ({ type: "page_view", ts, visitorId, device: "mobile", path: "/", ...extra });
  await db.analyticsEvent.createMany({
    data: [view("v1"), view("v1"), view("v2"), view("v3", { utmSource: "tg" }), { type: "ad_click", ts, visitorId: "v1", device: "mobile" }],
  });
  await aggregateDay(ts);
  await aggregateDay(ts);
  const stats = await db.dailyStat.findMany({ orderBy: [{ type: "asc" }, { source: "asc" }] });
  assert.deepEqual(
    stats.map((s) => [s.type, s.source, s.count, s.uniques]),
    [["ad_click", "", 1, 1], ["page_view", "", 3, 2], ["page_view", "tg", 1, 1]],
  );
});

test("сырые события старше 180 дней удаляются", async () => {
  await db.analyticsEvent.createMany({
    data: [{ type: "page_view", ts: new Date(Date.now() - 181 * DAY) }, { type: "page_view", ts: new Date(Date.now() - 10 * DAY) }],
  });
  assert.equal(await purgeOldEvents(), 1);
  assert.equal(await db.analyticsEvent.count(), 1);
});

test("через 90 дней после сезона Telegram ID заменяются хэшем, голоса остаются", async () => {
  const season = await db.season.create({
    data: { year: 2025, title: "Старый", votingStartsAt: new Date(Date.now() - 200 * DAY), votingEndsAt: new Date(Date.now() - 100 * DAY) },
  });
  const nomination = await db.nomination.create({
    data: {
      seasonId: season.id, slug: "n", title: "N", shortDesc: "", description: "", criteria: [], eligibility: "", icon: "users", group: "TEAMS",
      nominees: { create: [{ slug: "a", name: "A", published: true }] },
    },
    include: { nominees: true },
  });
  const data = { hasAvatar: true, nominationId: nomination.id, nomineeId: nomination.nominees[0].id, ipHash: "i", uaHash: "u" };
  await db.vote.create({ data: { ...data, tgUserId: BigInt(111), tgUsername: "alice" } });
  await db.vote.create({ data: { ...data, tgUserId: BigInt(222), tgUsername: "bob" } });

  assert.equal(await anonymizeVoters(), 2);
  const votes = await db.vote.findMany();
  assert.equal(votes.length, 2);
  assert.ok(votes.every((v) => v.tgUserId < 0 && v.tgUsername === null));
  assert.notEqual(votes[0].tgUserId, votes[1].tgUserId);
  assert.equal(await anonymizeVoters(), 0, "повторный запуск ничего не меняет");
});
