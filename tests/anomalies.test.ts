import assert from "node:assert/strict";
import { test } from "node:test";
import { detectAnomalies, median, type VoteRow } from "@/lib/admin/anomalies";

const base = new Date("2026-11-25T10:00:00Z").getTime();
const vote = (i: number, at: number, extra: Partial<VoteRow> = {}): VoteRow => ({
  tgUserId: BigInt(1000 + i),
  tgUsername: `user${i}`,
  hasAvatar: true,
  ipHash: `ip${i}`,
  createdAt: new Date(base + at),
  ...extra,
});
const options = { burstFactor: 3, medianTgId: BigInt(5000) };
const codes = (votes: VoteRow[]) => detectAnomalies(votes, options).map((flag) => flag.code);

// Обычная картина: голоса размазаны по трём суткам с неровными интервалами.
const organic = Array.from({ length: 40 }, (_, i) => vote(i, i * 97 * 60_000 + ((i * i * 37) % 89) * 60_000));

test("обычное голосование не даёт флагов", () => {
  assert.deepEqual(codes(organic), []);
});

test("меньше 10 голосов — не анализируем", () => {
  assert.deepEqual(codes(Array.from({ length: 9 }, (_, i) => vote(i, i * 1000, { tgUsername: null }))), []);
});

test("всплеск за 10 минут", () => {
  const burst = Array.from({ length: 25 }, (_, i) => vote(100 + i, 50 * 3_600_000 + i * 13_000 + ((i * 31) % 7) * 900));
  assert.ok(codes([...organic, ...burst]).includes("burst"));
});

test("свежие аккаунты и аккаунты без username", () => {
  const farm = Array.from({ length: 30 }, (_, i) =>
    vote(i, i * 83 * 60_000 + ((i * 131) % 2_000_000), { tgUserId: BigInt(9000 + i), tgUsername: null, hasAvatar: false }),
  );
  const found = codes(farm);
  assert.ok(found.includes("fresh"));
  assert.ok(found.includes("anonymous"));
});

test("много аккаунтов с одного адреса", () => {
  const shared = organic.map((v, i) => (i < 8 ? { ...v, ipHash: "same" } : v));
  assert.ok(codes(shared).includes("shared_ip"));
});

test("одинаковые интервалы между голосами", () => {
  const robot = Array.from({ length: 20 }, (_, i) => vote(i, i * 45_000 + (i % 2) * 300));
  assert.ok(codes(robot).includes("uniform"));
});

test("медиана", () => {
  assert.equal(median([BigInt(5), BigInt(1), BigInt(9)]), BigInt(5));
  assert.equal(median([]), null);
});
