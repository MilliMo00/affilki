import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { db } from "@/lib/db";
import type { TelegramApi } from "@/lib/telegram/client";
import { claimSession, findSession, handleDecision, handleStart, startLogin } from "@/lib/voting/login";
import { castVote } from "@/lib/voting/vote";

// Тесты ходят в отдельную базу affilki_test (см. npm test в README).
assert.match(process.env.DATABASE_URL ?? "", /affilki_test/, "тесты запускаются только на тестовой базе");

const HOUR = 3_600_000;
const fp = { ipHash: "ip", uaHash: "ua", uaLabel: "Chrome, macOS" };
const alice = { id: 1001, username: "alice", first_name: "Алиса" };
const bob = { id: 1002, username: "bob", first_name: "Боб" };

function fakeTg(opts: { subscribed?: boolean } = {}) {
  const sent: { chatId: number; text: string }[] = [];
  const tg: TelegramApi = {
    sendMessage: async (chatId, text) => void sent.push({ chatId, text }),
    editMessage: async () => {},
    answerCallback: async () => {},
    isChannelMember: async () => opts.subscribed ?? true,
    hasProfilePhoto: async () => true,
    channelMemberCount: async () => null,
  };
  return { tg, sent };
}

async function login(user = alice, tg = fakeTg().tg) {
  const { token, browserSecret } = await startLogin(fp);
  await handleStart(token, user, tg);
  const intent = await db.loginIntent.findUniqueOrThrow({ where: { token } });
  await handleDecision("ok", intent.id, user, tg);
  const claim = await claimSession(browserSecret);
  assert.equal(claim.status, "ok");
  const session = await findSession(claim.status === "ok" ? claim.sessionToken : undefined);
  assert.ok(session);
  return session;
}

const vote = (session: Awaited<ReturnType<typeof login>>, nomineeSlug: string, deps: Partial<Parameters<typeof castVote>[1]> = {}) =>
  castVote(
    { session, nomineeSlug, captchaToken: "t", ipHash: "ip", uaHash: "ua" },
    { tg: fakeTg().tg, verifyCaptcha: async () => true, ...deps },
  );

before(async () => {
  await db.$connect();
});

beforeEach(async () => {
  await db.vote.deleteMany();
  await db.voterSession.deleteMany();
  await db.loginIntent.deleteMany();
  await db.tgBan.deleteMany();
  await db.nominee.deleteMany();
  await db.nomination.deleteMany();
  await db.season.deleteMany();

  const season = await db.season.create({
    data: {
      year: 2026,
      title: "Тест",
      votingStartsAt: new Date(Date.now() - HOUR),
      votingEndsAt: new Date(Date.now() + HOUR),
    },
  });
  const nomination = (slug: string, requiresLegalReview = false) => ({
    seasonId: season.id,
    slug,
    title: slug,
    shortDesc: "",
    description: "",
    criteria: [],
    eligibility: "",
    icon: "users",
    group: "TEAMS" as const,
    requiresLegalReview,
  });
  await db.nomination.create({
    data: {
      ...nomination("teams"),
      nominees: { create: [{ slug: "a", name: "A", published: true }, { slug: "b", name: "B", published: true }] },
    },
  });
  await db.nomination.create({
    data: { ...nomination("events", true), nominees: { create: [{ slug: "unchecked", name: "U", published: true }] } },
  });
});

after(async () => {
  await db.$disconnect();
});

test("голос засчитывается, бот присылает квитанцию", async () => {
  const { tg, sent } = fakeTg();
  const result = await vote(await login(), "a", { tg });
  assert.equal(result.ok, true);
  assert.equal(await db.vote.count(), 1);
  await new Promise((r) => setImmediate(r));
  assert.match(sent.at(-1)?.text ?? "", /засчитан/);
});

test("повторный голос в номинации отклоняется, даже за другого участника", async () => {
  const session = await login();
  assert.equal((await vote(session, "a")).ok, true);
  const again = await vote(session, "b");
  assert.deepEqual([again.ok, !again.ok && again.error], [false, "already_voted"]);
  assert.equal(await db.vote.count(), 1);
});

test("два одновременных голоса — записывается ровно один", async () => {
  const session = await login();
  const results = await Promise.all([vote(session, "a"), vote(session, "b")]);
  assert.equal(results.filter((r) => r.ok).length, 1);
  assert.equal(await db.vote.count(), 1);
});

test("истёкшая ссылка входа не работает", async () => {
  const { tg, sent } = fakeTg();
  const { token, browserSecret } = await startLogin(fp, new Date(Date.now() - HOUR));
  await handleStart(token, alice, tg);
  assert.match(sent[0].text, /устарела/);
  assert.equal((await claimSession(browserSecret)).status, "expired");
  assert.equal(await db.voterSession.count(), 0);
});

test("чужую ссылку нельзя перехватить или подтвердить", async () => {
  const { tg, sent } = fakeTg();
  const { token, browserSecret } = await startLogin(fp);
  await handleStart(token, alice, tg);
  const intent = await db.loginIntent.findUniqueOrThrow({ where: { token } });

  // Боб открывает ту же ссылку и жмёт «Подтвердить» на чужом входе.
  await handleStart(token, bob, tg);
  assert.match(sent.at(-1)?.text ?? "", /устарела/);
  assert.match((await handleDecision("ok", intent.id, bob, tg)).text, /устарела/);
  assert.equal((await db.loginIntent.findUniqueOrThrow({ where: { token } })).tgUserId, BigInt(alice.id));

  // Без секрета из cookie сессию не получить, даже зная токен.
  assert.equal((await claimSession("wrong-secret")).status, "expired");
  assert.equal((await claimSession(browserSecret)).status, "pending");
});

test("«Это не я» отменяет вход", async () => {
  const { tg } = fakeTg();
  const { token, browserSecret } = await startLogin(fp);
  await handleStart(token, alice, tg);
  const intent = await db.loginIntent.findUniqueOrThrow({ where: { token } });
  await handleDecision("no", intent.id, alice, tg);
  assert.equal((await claimSession(browserSecret)).status, "rejected");
});

test("сессию по одной ссылке можно получить только один раз", async () => {
  const { tg } = fakeTg();
  const { token, browserSecret } = await startLogin(fp);
  await handleStart(token, alice, tg);
  const intent = await db.loginIntent.findUniqueOrThrow({ where: { token } });
  await handleDecision("ok", intent.id, alice, tg);
  assert.equal((await claimSession(browserSecret)).status, "ok");
  assert.equal((await claimSession(browserSecret)).status, "expired");
});

test("голос вне окна дат отклоняется", async () => {
  const session = await login();
  const early = await vote(session, "a", { now: new Date(Date.now() - 2 * HOUR) });
  const late = await vote(session, "a", { now: new Date(Date.now() + 2 * HOUR) });
  assert.equal(!early.ok && early.error, "not_started");
  assert.equal(!late.ok && late.error, "ended");
  assert.equal(await db.vote.count(), 0);
});

test("неподписанный аккаунт не голосует", async () => {
  const result = await vote(await login(), "a", { tg: fakeTg({ subscribed: false }).tg });
  assert.equal(!result.ok && result.error, "not_subscribed");
  assert.equal(await db.vote.count(), 0);
});

test("забаненный, слишком свежий и без username — не голосуют", async () => {
  const session = await login();
  await db.tgBan.create({ data: { tgUserId: BigInt(alice.id), reason: "тест", createdBy: "test" } });
  const banned = await vote(session, "a");
  assert.equal(!banned.ok && banned.error, "banned");
  await db.tgBan.deleteMany();

  await db.season.updateMany({ data: { maxTelegramId: BigInt(500) } });
  const fresh = await vote(session, "a");
  assert.equal(!fresh.ok && fresh.error, "too_new");

  await db.season.updateMany({ data: { maxTelegramId: null, requireUsername: true } });
  const anon = await vote(await login({ id: 1003, first_name: "Без ника" } as typeof alice), "a");
  assert.equal(!anon.ok && anon.error, "no_username");
  assert.equal(await db.vote.count(), 0);
});

test("непройденная капча не даёт голос", async () => {
  const result = await vote(await login(), "a", { verifyCaptcha: async () => false });
  assert.equal(!result.ok && result.error, "captcha");
  assert.equal(await db.vote.count(), 0);
});

test("за участника без юридической проверки проголосовать нельзя", async () => {
  const result = await vote(await login(), "unchecked");
  assert.equal(!result.ok && result.error, "not_found");
});
