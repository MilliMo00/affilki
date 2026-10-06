import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { audience, createBroadcast, rememberBotUser, runBroadcast, setSubscribed, toTelegramHtml, visibleLength, type Sender } from "@/lib/broadcast";
import { db } from "@/lib/db";

assert.match(process.env.DATABASE_URL ?? "", /affilki_test/, "тесты запускаются только на тестовой базе");

beforeEach(async () => {
  await db.broadcast.deleteMany();
  await db.botUser.deleteMany();
  await db.vote.deleteMany();
  await db.voterSession.deleteMany();
  await db.submission.deleteMany();
  await db.nominee.deleteMany();
  await db.nomination.deleteMany();
  await db.season.deleteMany();
});

after(() => db.$disconnect());

const users = (ids: number[]) => Promise.all(ids.map((id) => rememberBotUser({ id, first_name: `u${id}` })));
const message = { text: "Привет", imageUrl: null, buttonText: null, buttonUrl: null };

test("разметка рассылки превращается в HTML Telegram, чужие теги экранируются", () => {
  assert.equal(
    toTelegramHtml("**Старт** голосования *завтра*. [Голосовать](https://affilki.com/awards) <script>x</script> & `код`"),
    '<b>Старт</b> голосования <i>завтра</i>. <a href="https://affilki.com/awards">Голосовать</a> &lt;script&gt;x&lt;/script&gt; &amp; <code>код</code>',
  );
  // Небезопасные ссылки не становятся ссылками.
  assert.doesNotMatch(toTelegramHtml("[x](javascript:alert(1))"), /<a /);
  assert.doesNotMatch(toTelegramHtml('[x](https://a.b" onclick="x)'), /<a /);
  assert.equal(visibleLength(toTelegramHtml("**жирный** текст")), "жирный текст".length);
});

test("в рассылку не попадают отписавшиеся и те, кто заблокировал бота", async () => {
  await users([1, 2, 3, 4]);
  await setSubscribed(2, false);
  await db.botUser.update({ where: { tgUserId: BigInt(3) }, data: { blockedAt: new Date() } });
  assert.deepEqual((await audience("all")).map(Number).sort(), [1, 4]);

  // Человек снова написал боту — блокировка снимается, отписка остаётся.
  await rememberBotUser({ id: 3 });
  await rememberBotUser({ id: 2 });
  assert.deepEqual((await audience("all")).map(Number).sort(), [1, 3, 4]);
});

test("сегменты: проголосовавшие, вошедшие без голоса, авторы заявок", async () => {
  await users([1, 2, 3, 4]);
  const season = await db.season.create({ data: { year: 2026, title: "T", votingStartsAt: new Date(), votingEndsAt: new Date(Date.now() + 1e6) } });
  const nomination = await db.nomination.create({
    data: { seasonId: season.id, slug: "n", title: "N", shortDesc: "", description: "", criteria: [], eligibility: "", icon: "users", group: "TEAMS", nominees: { create: [{ slug: "a", name: "A" }] } },
    include: { nominees: true },
  });
  await db.vote.create({ data: { tgUserId: BigInt(1), hasAvatar: true, nominationId: nomination.id, nomineeId: nomination.nominees[0].id, ipHash: "i", uaHash: "u" } });
  for (const id of [1, 2]) {
    await db.voterSession.create({ data: { id: `s${id}`, tgUserId: BigInt(id), ipHash: "i", uaHash: "u", expiresAt: new Date(Date.now() + 1e9) } });
  }
  await db.submission.create({ data: { kind: "ARTICLE", tgUserId: BigInt(3), authorName: "a", contact: "c", title: "t", text: "x", links: [], ipHash: "i" } });

  assert.deepEqual((await audience("voters")).map(Number), [1]);
  assert.deepEqual((await audience("not_voted")).map(Number), [2]);
  assert.deepEqual((await audience("authors")).map(Number), [3]);
});

test("рассылка: считает отправленные, помечает заблокировавших, никому не шлёт дважды", async () => {
  await users([1, 2, 3, 4, 5]);
  const log: number[] = [];
  const send: Sender = async (chatId) => {
    log.push(Number(chatId));
    if (chatId === BigInt(2)) return { ok: false, reason: "blocked", error: "Forbidden: bot was blocked by the user" };
    if (chatId === BigInt(4)) return { ok: false, reason: "error", error: "Bad Request" };
    return { ok: true };
  };

  const broadcast = await createBroadcast({ ...message, segment: "all", createdBy: "t" });
  assert.equal(broadcast.total, 5);
  await runBroadcast(broadcast.id, send, 0);
  // Повторный запуск (например, после перезапуска сервера) ничего не отправляет заново.
  await runBroadcast(broadcast.id, send, 0);

  const done = await db.broadcast.findUniqueOrThrow({ where: { id: broadcast.id } });
  assert.deepEqual([done.status, done.sent, done.blocked, done.failed], ["DONE", 3, 1, 1]);
  assert.deepEqual([...log].sort(), [1, 2, 3, 4, 5]);
  assert.ok((await db.botUser.findUniqueOrThrow({ where: { tgUserId: BigInt(2) } })).blockedAt);
  // Заблокировавший в следующую рассылку уже не попадает.
  assert.equal((await audience("all")).length, 4);
});

test("рассылка возобновляется с места остановки и останавливается при отмене", async () => {
  await users([1, 2, 3, 4, 5, 6]);
  const log: number[] = [];
  const broadcast = await createBroadcast({ ...message, segment: "all", createdBy: "t" });

  // «Сервер упал» после трёх сообщений: отменяем рассылку изнутри отправителя.
  const flaky: Sender = async (chatId) => {
    log.push(Number(chatId));
    if (log.length === 3) await db.broadcast.update({ where: { id: broadcast.id }, data: { status: "CANCELLED" } });
    return { ok: true };
  };
  await runBroadcast(broadcast.id, flaky, 0);
  const paused = await db.broadcast.findUniqueOrThrow({ where: { id: broadcast.id } });
  assert.equal(paused.status, "CANCELLED");
  assert.ok(paused.sent < 6 || log.length === 6);

  // Продолжаем: получают только те, кому ещё не отправляли.
  await db.broadcast.update({ where: { id: broadcast.id }, data: { status: "SENDING" } });
  await runBroadcast(broadcast.id, async (chatId) => (log.push(Number(chatId)), { ok: true }), 0);
  assert.deepEqual([...log].sort(), [1, 2, 3, 4, 5, 6], "каждый получил ровно одно сообщение");
  assert.equal((await db.broadcast.findUniqueOrThrow({ where: { id: broadcast.id } })).sent, 6);
});

test("картинка загружается один раз: дальше используется file_id", async () => {
  await users([1, 2, 3]);
  const seen: (string | null)[] = [];
  const send: Sender = async (_, msg) => {
    seen.push(msg.photoFileId);
    return { ok: true, fileId: "tg-file-1" };
  };
  const broadcast = await createBroadcast({ ...message, imageUrl: "/uploads/x.png", segment: "all", createdBy: "t" });
  await runBroadcast(broadcast.id, send, 0);
  assert.deepEqual(seen, [null, "tg-file-1", "tg-file-1"]);
});
