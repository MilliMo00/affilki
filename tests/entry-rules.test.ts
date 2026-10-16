import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { db } from "@/lib/db";
import { MAX_NOMINEES, MIN_CASES } from "@/lib/entry-rules";
import { checkTarget, parseSubmission } from "@/lib/submissions";

assert.match(process.env.DATABASE_URL ?? "", /affilki_test/, "тесты запускаются только на тестовой базе");

beforeEach(async () => {
  await db.vote.deleteMany();
  await db.submission.deleteMany();
  await db.nominee.deleteMany();
  await db.nomination.deleteMany();
  await db.season.deleteMany();
});

after(() => db.$disconnect());

async function nominations() {
  const season = await db.season.create({ data: { year: 2026, title: "T", votingStartsAt: new Date(), votingEndsAt: new Date(Date.now() + 1e6) } });
  const make = (slug: string, isEvent = false) =>
    db.nomination.create({
      data: { seasonId: season.id, slug, title: slug, shortDesc: "", description: "", criteria: [], eligibility: "", icon: "users", group: "TEAMS", isEvent },
    });
  return { a: await make("a"), b: await make("b"), events: await make("events", true) };
}

function form(nominationId: string, cases: number) {
  const data = new FormData();
  data.set("kind", "NOMINEE");
  data.set("authorName", "Команда");
  data.set("contact", "@team");
  data.set("title", "Команда Проба");
  data.set("text", "Льём гемблинг с прошлого года, выросли с трёх до двадцати байеров.");
  data.set("achievements", "Открыли два новых гео и запустили свою партнёрку.");
  data.set("whyVote", "Делимся связками и кейсами в открытую, без воды.");
  data.set("nominationId", nominationId);
  data.set("casesJson", JSON.stringify(Array.from({ length: cases }, (_, i) => ({ key: `c${i}`, title: `Кейс ${i + 1}`, text: "", url: "", imageUrl: "" }))));
  const parsed = parseSubmission(data);
  assert.ok("data" in parsed);
  return parsed.data;
}

const author = { tgUserId: BigInt(42) };
const submit = (nominationId: string) =>
  db.submission.create({ data: { kind: "NOMINEE", tgUserId: author.tgUserId, authorName: "a", contact: "c", title: "t", text: "x", links: [], nominationId, ipHash: "i" } });

test(`заявка без ${MIN_CASES} кейсов не проходит, с ними — проходит`, async () => {
  const { a } = await nominations();
  assert.match((await checkTarget(form(a.id, MIN_CASES - 1), true, author))?.cases ?? "", /минимум/);
  assert.equal(await checkTarget(form(a.id, MIN_CASES), true, author), null);
});

test("подать можно только в одну номинацию; отклонённая заявка и события не мешают", async () => {
  const { a, b, events } = await nominations();
  const first = await submit(a.id);
  assert.match((await checkTarget(form(b.id, MIN_CASES), true, author))?.nominationId ?? "", /только в одну/);
  // Ту же заявку можно править, в том числе перенести в другую номинацию.
  assert.equal(await checkTarget(form(b.id, MIN_CASES), true, { ...author, exceptId: first.id }), null);
  // Другой человек подаёт свободно.
  assert.equal(await checkTarget(form(b.id, MIN_CASES), true, { tgUserId: BigInt(43) }), null);

  await db.submission.update({ where: { id: first.id }, data: { status: "REJECTED" } });
  assert.equal(await checkTarget(form(b.id, MIN_CASES), true, author), null);

  await db.submission.update({ where: { id: first.id }, data: { status: "PENDING", nominationId: events.id } });
  assert.equal(await checkTarget(form(b.id, MIN_CASES), true, author), null);
});

test(`в номинации не больше ${MAX_NOMINEES} участников`, async () => {
  const { a } = await nominations();
  await db.nominee.createMany({ data: Array.from({ length: MAX_NOMINEES - 1 }, (_, i) => ({ nominationId: a.id, slug: `n${i}`, name: `N${i}`, published: true })) });
  assert.equal(await checkTarget(form(a.id, MIN_CASES), true, author), null);
  await db.nominee.create({ data: { nominationId: a.id, slug: "last", name: "Last", published: true } });
  assert.match((await checkTarget(form(a.id, MIN_CASES), true, author))?.nominationId ?? "", /мест нет/);
});

test("номинация событий: без кейсов и текстовых блоков команды, и она не занимает «одну номинацию»", async () => {
  const { a, events } = await nominations();
  const data = { ...form(events.id, 0), achievements: "", whyVote: "" };
  assert.equal(await checkTarget(data, true, author), null);
  await submit(events.id);
  assert.equal(await checkTarget(form(a.id, MIN_CASES), true, author), null);
});
