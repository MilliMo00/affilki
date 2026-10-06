"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { done, failed, stepUp, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { SEGMENTS, createBroadcast, runBroadcast, telegramSender, textLimit, toTelegramHtml, visibleLength, type Segment } from "@/lib/broadcast";
import { db } from "@/lib/db";
import { saveImage } from "@/lib/storage";

const schema = z
  .object({
    segment: z.enum(Object.keys(SEGMENTS) as [Segment, ...Segment[]]),
    text: z.string().trim().min(1, "Напиши текст сообщения"),
    buttonText: z.string().trim().max(40, "Надпись на кнопке — до 40 символов"),
    buttonUrl: z.string().trim().max(500),
  })
  .superRefine((value, ctx) => {
    if (!!value.buttonText !== !!value.buttonUrl) ctx.addIssue({ code: "custom", message: "Для кнопки нужны и надпись, и ссылка" });
    if (value.buttonUrl && !/^https:\/\/\S+$/.test(value.buttonUrl)) ctx.addIssue({ code: "custom", message: "Ссылка кнопки должна начинаться с https://" });
  });

/** Проверка и подготовка сообщения: общая для пробной отправки и для рассылки. */
async function prepare(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries([...formData].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join("; ") };

  let imageUrl: string | null = String(formData.get("existingImage") ?? "") || null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const saved = await saveImage(image);
    if ("error" in saved) return { error: saved.error };
    imageUrl = saved.url;
  }
  if (imageUrl && !/^\/uploads\/[a-f0-9]{24}\.(png|jpg|gif|webp)$/.test(imageUrl)) return { error: "Картинка не найдена." };

  const length = visibleLength(toTelegramHtml(parsed.data.text));
  const limit = textLimit(!!imageUrl);
  if (length > limit) {
    return { error: `Текст длиннее лимита Telegram: ${length} из ${limit} символов${imageUrl ? " (с картинкой лимит меньше)" : ""}.` };
  }
  return {
    segment: parsed.data.segment,
    message: { text: parsed.data.text, imageUrl, buttonText: parsed.data.buttonText || null, buttonUrl: parsed.data.buttonUrl || null },
  };
}

export type BroadcastState = (NonNullable<ActionState> & { imageUrl?: string | null }) | null;

/** Пробная отправка только себе — посмотреть, как сообщение выглядит в Telegram. */
export async function sendTest(_: BroadcastState, formData: FormData): Promise<BroadcastState> {
  const context = await requirePermission("broadcast");
  const prepared = await prepare(formData);
  if ("error" in prepared) return failed(prepared.error!);

  const result = await telegramSender(context.admin.tgId, { ...prepared.message, photoFileId: null });
  if (!result.ok) return { ok: false, message: `Telegram не принял сообщение: ${result.error}`, imageUrl: prepared.message.imageUrl };
  // Загруженную картинку возвращаем форме, чтобы для рассылки её не пришлось выбирать заново.
  return { ok: true, message: "Отправили тебе в бот. Посмотри, как выглядит.", imageUrl: prepared.message.imageUrl };
}

/** Рассылка по сегменту. Опасное действие: нужен свежий код. */
export async function sendBroadcast(_: BroadcastState, formData: FormData): Promise<BroadcastState> {
  const context = await requirePermission("broadcast");
  const prepared = await prepare(formData);
  if ("error" in prepared) return failed(prepared.error!);

  const denied = await stepUp(context, formData);
  if (denied) return { ok: false, message: denied, imageUrl: prepared.message.imageUrl };

  if (await db.broadcast.findFirst({ where: { status: "SENDING" } })) {
    return { ok: false, message: "Предыдущая рассылка ещё идёт. Дождись её окончания или останови.", imageUrl: prepared.message.imageUrl };
  }

  const broadcast = await createBroadcast({ ...prepared.message, segment: prepared.segment, createdBy: context.admin.id });
  if (broadcast.total === 0) {
    await db.broadcast.update({ where: { id: broadcast.id }, data: { status: "DONE", finishedAt: new Date() } });
    return failed("В этом сегменте сейчас никого нет.");
  }
  await audit(context, "broadcast.send", { type: "broadcast", id: broadcast.id }, null, { segment: broadcast.segment, total: broadcast.total, text: broadcast.text.slice(0, 200) });
  // Отправка идёт в фоне: страница не ждёт, пока сообщение дойдёт до всех.
  void runBroadcast(broadcast.id).catch((error) => console.error("broadcast:", error));
  revalidatePath("/", "layout");
  return done(`Рассылка запущена: ${broadcast.total} получателей. Прогресс — ниже, обнови страницу.`);
}

/** Остановить идущую рассылку или продолжить остановленную. */
export async function controlBroadcast(id: string, action: "stop" | "resume", _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("broadcast");
  const broadcast = await db.broadcast.findUnique({ where: { id } });
  if (!broadcast) return failed("Рассылка не найдена.");

  if (action === "stop") {
    if (broadcast.status !== "SENDING") return failed("Рассылка уже не идёт.");
    await db.broadcast.update({ where: { id }, data: { status: "CANCELLED", finishedAt: new Date() } });
    await audit(context, "broadcast.stop", { type: "broadcast", id }, null, { sent: broadcast.sent, total: broadcast.total });
    revalidatePath("/", "layout");
    return done("Рассылка остановлена. Те, кому уже ушло, сообщение получили.");
  }

  const denied = await stepUp(context, formData);
  if (denied) return failed(denied);
  await db.broadcast.update({ where: { id }, data: { status: "SENDING", finishedAt: null } });
  await audit(context, "broadcast.resume", { type: "broadcast", id }, null, { sent: broadcast.sent, total: broadcast.total });
  void runBroadcast(id).catch((error) => console.error("broadcast:", error));
  revalidatePath("/", "layout");
  return done("Продолжаем отправку оставшимся.");
}
