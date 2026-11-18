"use server";

import { revalidatePath } from "next/cache";
import { done, failed, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";
import { ensureTeamToken, isTestTeam, TEST_TEAM_SLUG } from "@/lib/team";

/** Создать ссылку команды или заменить её новой (старая перестанет работать). */
export async function makeTeamLink(nomineeId: string, regenerate: boolean): Promise<ActionState> {
  const context = await requirePermission("awards");
  if (!(await db.nominee.findUnique({ where: { id: nomineeId } }))) return failed("Участник не найден.");
  await ensureTeamToken(nomineeId, regenerate);
  await audit(context, regenerate ? "team_link.regenerate" : "team_link.create", { type: "nominee", id: nomineeId }, null, null);
  revalidatePath("/", "layout");
  return done(regenerate ? "Новая ссылка готова, старая больше не работает." : "Ссылка готова.");
}

/** Ссылки для всех опубликованных участников, у кого их ещё нет. */
export async function makeAllTeamLinks(): Promise<ActionState> {
  const context = await requirePermission("awards");
  const missing = await db.nominee.findMany({ where: { published: true, teamToken: null }, select: { id: true } });
  for (const nominee of missing) await ensureTeamToken(nominee.id);
  await audit(context, "team_link.create_all", { type: "nominee" }, null, { count: missing.length });
  revalidatePath("/", "layout");
  return done(missing.length ? `Создано ссылок: ${missing.length}.` : "У всех участников ссылки уже есть.");
}

/** Отметка «написал команде» — пишется в журнал действий: видно, кто и когда отметил. */
export async function setTeamContacted(nomineeId: string, contacted: boolean): Promise<ActionState> {
  const context = await requirePermission("awards");
  if (!(await db.nominee.findUnique({ where: { id: nomineeId }, select: { id: true } }))) return failed("Участник не найден.");
  await audit(context, contacted ? "team.contacted" : "team.uncontacted", { type: "nominee", id: nomineeId }, null, null);
  revalidatePath("/", "layout");
  return done(contacted ? "Отмечено: написал." : "Отметка снята.");
}

/** Тестовый участник: скрыт с сайта, нужен, чтобы самому пройти ссылку и посмотреть ответы бота. Одновременно — один. */
export async function createTestTeam(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("awards");
  if (await db.nominee.findFirst({ where: { slug: { startsWith: TEST_TEAM_SLUG } } })) return failed("Тестовый участник уже есть — сначала удали его.");
  const nomination = await db.nomination.findUnique({ where: { id: String(formData.get("nominationId") ?? "") } });
  if (!nomination) return failed("Выбери номинацию.");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80) || "Тестовый канал";
  const channel = String(formData.get("channel") ?? "").trim();
  if (channel && !/^https:\/\/(t\.me|telegram\.me)\/[A-Za-z0-9_+/-]+$/.test(channel)) return failed("Ссылка на канал — в виде https://t.me/имя_канала.");
  const nominee = await db.nominee.create({
    data: {
      nominationId: nomination.id,
      slug: `${TEST_TEAM_SLUG}${randomBytes(4).toString("hex")}`,
      name: `${name} (тест)`,
      published: false,
      profile: channel ? { buttons: [{ title: "Канал", url: channel }] } : undefined,
    },
  });
  await ensureTeamToken(nominee.id);
  await audit(context, "team_test.create", { type: "nominee", id: nominee.id }, null, { nomination: nomination.slug });
  revalidatePath("/", "layout");
  return done("Тестовый участник создан. Открой ссылку в Telegram.");
}

export async function deleteTestTeam(nomineeId: string): Promise<ActionState> {
  const context = await requirePermission("awards");
  const nominee = await db.nominee.findUnique({ where: { id: nomineeId } });
  if (!nominee || !isTestTeam(nominee.slug)) return failed("Это не тестовый участник.");
  await db.$transaction([db.vote.deleteMany({ where: { nomineeId } }), db.nominee.delete({ where: { id: nomineeId } })]);
  await audit(context, "team_test.delete", { type: "nominee", id: nomineeId }, null, null);
  revalidatePath("/", "layout");
  return done("Тестовый участник удалён.");
}
