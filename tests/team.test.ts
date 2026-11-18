import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { db } from "@/lib/db";
import { handleUpdate } from "@/lib/telegram/bot";
import type { TelegramApi } from "@/lib/telegram/client";
import { ensureTeamToken, teamStatsText } from "@/lib/team";

assert.match(process.env.DATABASE_URL ?? "", /affilki_test/, "тесты запускаются только на тестовой базе");

const HOUR = 3_600_000;
const sent: { chat: number; text: string }[] = [];
const tg: TelegramApi = {
  sendMessage: async (chat, text) => void sent.push({ chat, text }),
  editMessage: async () => {},
  answerCallback: async () => {},
  isChannelMember: async () => true,
  hasProfilePhoto: async () => true,
  usernameOf: async () => null,
  channelMemberCount: async () => null,
};
const say = (from: number, text: string) => handleUpdate({ message: { text, from: { id: from, username: `u${from}` }, chat: { id: from, type: "private" } } }, tg);

beforeEach(async () => {
  sent.length = 0;
  await db.vote.deleteMany();
  await db.nominee.deleteMany();
  await db.nomination.deleteMany();
  await db.season.deleteMany();
  await db.botUser.deleteMany();
});
after(() => db.$disconnect());

async function setup(season: { votingStartsAt: Date; votingEndsAt: Date; liveFreezeHours?: number }) {
  const s = await db.season.create({ data: { year: 2026, title: "T", ...season } });
  const n = await db.nomination.create({
    data: {
      seasonId: s.id, slug: "n", title: "Номинация", shortDesc: "", description: "", criteria: [], eligibility: "", icon: "users", group: "TEAMS",
      nominees: { create: [{ slug: "a", name: "Команда А", published: true }, { slug: "b", name: "Команда Б", published: true }] },
    },
    include: { nominees: true },
  });
  const [a, b] = n.nominees;
  const vote = (nomineeId: string, tgUserId: number) =>
    db.vote.create({ data: { tgUserId: BigInt(tgUserId), hasAvatar: true, nominationId: n.id, nomineeId, ipHash: "i", uaHash: "u" } });
  return { a, b, vote };
}

test("ссылка команды привязывает аккаунт; заменённая ссылка перестаёт работать", async () => {
  const { a } = await setup({ votingStartsAt: new Date(Date.now() + HOUR), votingEndsAt: new Date(Date.now() + 100 * HOUR) });
  const token = await ensureTeamToken(a.id);
  assert.equal(await ensureTeamToken(a.id), token, "без замены ссылка та же");

  await say(1, `/start t_${token}`);
  assert.match(sent.at(-1)!.text, /подключены к «Команда А»/);
  assert.equal(await db.nomineeOwner.count({ where: { nomineeId: a.id } }), 1);

  // Коллега по той же ссылке тоже подключается.
  await say(2, `/start t_${token}`);
  assert.equal(await db.nomineeOwner.count({ where: { nomineeId: a.id } }), 2);

  const fresh = await ensureTeamToken(a.id, true);
  assert.notEqual(fresh, token);
  await say(3, `/start t_${token}`);
  assert.match(sent.at(-1)!.text, /не действует/);
  // Уже подключённые остаются.
  assert.equal(await db.nomineeOwner.count({ where: { nomineeId: a.id } }), 2);
});

test("голоса и место: до старта — без цифр, во время — голоса и место, в заморозке — без места", async () => {
  const before = await setup({ votingStartsAt: new Date(Date.now() + HOUR), votingEndsAt: new Date(Date.now() + 100 * HOUR) });
  await say(1, `/start t_${await ensureTeamToken(before.a.id)}`);
  assert.match((await teamStatsText(BigInt(1)))!, /Голосование начнётся/);

  await db.season.updateMany({ data: { votingStartsAt: new Date(Date.now() - HOUR) } });
  await before.vote(before.b.id, 10);
  await before.vote(before.b.id, 11);
  await before.vote(before.a.id, 12);
  const live = (await teamStatsText(BigInt(1)))!;
  assert.match(live, /Голосов: 1\./);
  assert.match(live, /Место в номинации: 2 из 2/);

  await db.season.updateMany({ data: { votingEndsAt: new Date(Date.now() + HOUR), liveFreezeHours: 48 } });
  const frozen = (await teamStatsText(BigInt(1)))!;
  assert.match(frozen, /Голосов: 1\./);
  assert.match(frozen, /Место скрыто/);

  // Через бота: команда /stats отвечает тем же.
  await say(1, "/stats");
  assert.match(sent.at(-1)!.text, /Команда А/);
  await say(99, "/stats");
  assert.match(sent.at(-1)!.text, /не привязан/);
});
