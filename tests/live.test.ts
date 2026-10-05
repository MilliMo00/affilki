import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { db } from "@/lib/db";
import { computeSnapshot } from "@/lib/live/snapshot";

assert.match(process.env.DATABASE_URL ?? "", /affilki_test/, "тесты запускаются только на тестовой базе");

const HOUR = 3_600_000;
let tgId = 5000;

async function setup(season: Partial<Parameters<typeof db.season.create>[0]["data"]> = {}) {
  const created = await db.season.create({
    data: {
      year: 2026,
      title: "Тест",
      votingStartsAt: new Date(Date.now() - 100 * HOUR),
      votingEndsAt: new Date(Date.now() + 100 * HOUR),
      liveMinVotes: 3,
      ...season,
    },
  });
  const nomination = await db.nomination.create({
    data: {
      seasonId: created.id,
      slug: "teams",
      title: "Команды",
      shortDesc: "",
      description: "",
      criteria: [],
      eligibility: "",
      icon: "users",
      group: "TEAMS",
      order: 1,
      nominees: { create: [{ slug: "a", name: "A", published: true }, { slug: "b", name: "B", published: true }] },
    },
    include: { nominees: true },
  });
  const bySlug = Object.fromEntries(nomination.nominees.map((n) => [n.slug, n.id]));
  const vote = (slug: string, extra: object = {}) =>
    db.vote.create({
      data: { tgUserId: BigInt(tgId++), hasAvatar: true, nominationId: nomination.id, nomineeId: bySlug[slug], ipHash: "i", uaHash: "u", ...extra },
    });
  return { season: created, vote };
}

beforeEach(async () => {
  await db.vote.deleteMany();
  await db.tgBan.deleteMany();
  await db.nominee.deleteMany();
  await db.nomination.deleteMany();
  await db.season.deleteMany();
});

after(() => db.$disconnect());

test("меньше порога голосов — распределение не показывается", async () => {
  const { season, vote } = await setup();
  await vote("a");
  await vote("b");
  const snapshot = await computeSnapshot(season);
  assert.equal(snapshot.status, "live");
  assert.equal(snapshot.totalVotes, 2);
  assert.deepEqual(snapshot.nominations[0], { slug: "teams", title: "Команды", number: 1, state: "collecting", rows: [] });
});

test("режим percent не раскрывает точные числа", async () => {
  const { season, vote } = await setup();
  await Promise.all([vote("a"), vote("a"), vote("a"), vote("b")]);
  const nomination = (await computeSnapshot(season)).nominations[0];
  assert.deepEqual(nomination.rows.map((r) => [r.slug, r.place, r.percent]), [["a", 1, 75], ["b", 2, 25]]);
  assert.equal(nomination.total, undefined);
  assert.ok(nomination.rows.every((r) => r.count === undefined));
  assert.doesNotMatch(JSON.stringify(nomination), /count|total/);
});

test("режим counts показывает числа", async () => {
  const { season, vote } = await setup({ liveMode: "COUNTS" });
  await Promise.all([vote("a"), vote("a"), vote("b")]);
  const nomination = (await computeSnapshot(season)).nominations[0];
  assert.equal(nomination.total, 3);
  assert.deepEqual(nomination.rows.map((r) => r.count), [2, 1]);
});

test("аннулированные голоса и голоса забаненных не учитываются", async () => {
  const { season, vote } = await setup();
  await Promise.all([vote("a"), vote("a"), vote("a")]);
  await vote("b", { voidedAt: new Date(), voidReason: "тест" });
  const bannedVote = await vote("b");
  await db.tgBan.create({ data: { tgUserId: bannedVote.tgUserId, reason: "тест", createdBy: "t" } });
  const snapshot = await computeSnapshot(season);
  assert.equal(snapshot.totalVotes, 3);
  assert.deepEqual(snapshot.nominations[0].rows.map((r) => r.percent), [100, 0]);
});

test("за 48 часов до конца табло замораживается: только общее число", async () => {
  const { season, vote } = await setup({ votingEndsAt: new Date(Date.now() + 47 * HOUR) });
  await Promise.all([vote("a"), vote("a"), vote("a"), vote("b")]);
  const snapshot = await computeSnapshot(season);
  assert.equal(snapshot.status, "frozen");
  assert.equal(snapshot.totalVotes, 4);
  assert.deepEqual(snapshot.nominations, []);
});

test("до старта и при выключенном live распределения нет", async () => {
  const soon = await setup({ votingStartsAt: new Date(Date.now() + HOUR) });
  assert.equal((await computeSnapshot(soon.season)).status, "soon");
  const off = await computeSnapshot({ ...soon.season, liveEnabled: false });
  assert.deepEqual([off.status, off.nominations.length], ["off", 0]);
});

test("после публикации итогов табло открыто и порог не действует", async () => {
  const { season, vote } = await setup({ votingEndsAt: new Date(Date.now() - HOUR), resultsPublished: true });
  await vote("b");
  const snapshot = await computeSnapshot(season);
  assert.equal(snapshot.status, "final");
  assert.deepEqual(snapshot.nominations[0].rows.map((r) => [r.slug, r.percent]), [["b", 100], ["a", 0]]);
});
