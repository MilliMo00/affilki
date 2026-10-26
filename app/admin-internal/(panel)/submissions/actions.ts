"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { done, failed, type ActionState } from "@/lib/admin/action";
import { audit } from "@/lib/admin/audit";
import { can, requirePermission } from "@/lib/admin/auth";
import { adminUrl } from "@/lib/admin/path";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/voting/tokens";
import { MAX_NOMINEES } from "@/lib/entry-rules";
import { approve, caseImagesFrom, checkTarget, nominationIsFull, fieldsOf, imageFrom, parseSubmission, reject, returnForChanges } from "@/lib/submissions";

type Decision = "save" | "approve" | "return" | "reject";

const comment = z.string().trim().min(5, "Напиши автору, что именно поправить или почему отказ").max(2000);

/** Правка заявки модератором и решение по ней. */
export async function decideSubmission(id: string, decision: Decision, _: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission();
  const submission = await db.submission.findUnique({ where: { id } });
  if (!submission) return failed("Заявка не найдена.");
  // Заявки в номинации — тем, кто ведёт премию; статьи — тем, кто ведёт контент.
  if (!can(context.admin.role, submission.kind === "NOMINEE" ? "awards" : "content")) return failed("Нет прав на этот тип заявок.");
  if (submission.status === "APPROVED") return failed("Заявка уже опубликована. Правь участника или статью в их разделе.");
  // Заявку, подготовленную редакцией, решает команда по своей ссылке: здесь её можно только править.
  if (submission.status === "INVITED" && decision !== "save") return failed("Эта заявка ждёт подтверждения команды. Отправь им ссылку — решение за ними.");

  // Модератор может исправить любые поля перед решением — они сохраняются всегда.
  formData.set("kind", submission.kind);
  const parsed = parseSubmission(formData);
  if ("errors" in parsed) return failed(`Проверь поля: ${Object.values(parsed.errors).join("; ")}`);
  const targetErrors = decision === "approve" ? await checkTarget({ ...parsed.data }) : null;
  if (targetErrors && !("nominationId" in targetErrors && /не принимаются/.test(targetErrors.nominationId))) {
    return failed(Object.values(targetErrors).join("; "));
  }
  const image = await imageFrom(formData, submission.imageUrl);
  if ("error" in image) return failed(image.error);
  const cases = await caseImagesFrom(formData, parsed.data.cases);
  if ("error" in cases) return failed(cases.error);

  const edited = await db.submission.update({ where: { id }, data: { ...fieldsOf(parsed.data, cases.cases), imageUrl: image.url } });

  if (decision === "save") {
    await audit(context, "submission.edit", { type: "submission", id }, { title: submission.title }, { title: edited.title });
    revalidatePath("/", "layout");
    return done(
      edited.status === "INVITED"
        ? "Анкета сохранена. Отправь команде ссылку — они увидят её такой."
        : "Правки сохранены. Автор их пока не видит — заявка ждёт решения.",
    );
  }

  if (decision === "approve") {
    if (edited.kind === "NOMINEE" && (await nominationIsFull(edited.nominationId!))) {
      return failed(`В номинации уже ${MAX_NOMINEES} участников — это максимум. Сними кого-то с публикации или выбери другую номинацию.`);
    }
    const result = await approve(edited, {
      tagline: String(formData.get("tagline") ?? "").trim().slice(0, 200),
      excerpt: String(formData.get("excerpt") ?? "").trim().slice(0, 300),
    });
    await audit(context, "submission.approve", { type: "submission", id }, { status: submission.status }, { status: "APPROVED", resultId: result.resultId });
    revalidatePath("/", "layout");
    return done(`Опубликовано: ${result.publicUrl}. Автору ушло уведомление в бот.`);
  }

  const parsedComment = comment.safeParse(formData.get("adminComment"));
  if (!parsedComment.success) return failed(parsedComment.error.issues[0].message);

  if (decision === "return") {
    await returnForChanges(edited, parsedComment.data);
    await audit(context, "submission.return", { type: "submission", id }, { status: submission.status }, { status: "CHANGES_REQUESTED", comment: parsedComment.data });
    revalidatePath("/", "layout");
    return done("Заявка возвращена автору. Ему ушло уведомление в бот.");
  }

  await reject(edited, parsedComment.data);
  await audit(context, "submission.reject", { type: "submission", id }, { status: submission.status }, { status: "REJECTED", comment: parsedComment.data });
  revalidatePath("/", "layout");
  return done("Заявка отклонена. Автору ушло уведомление в бот.");
}

const inviteSchema = z.object({
  nominationId: z.string().min(1, "Выбери номинацию").max(40),
  title: z.string().trim().min(2, "Укажи название команды").max(160),
  contact: z.string().trim().max(120),
});

/** Редакция готовит заявку за команду: черновик со ссылкой, по которой команда его подтвердит. */
export async function createInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requirePermission("awards");
  const parsed = inviteSchema.safeParse(Object.fromEntries([...formData].filter(([, value]) => typeof value === "string")));
  if (!parsed.success) return failed(parsed.error.issues.map((issue) => issue.message).join("; "));
  if (!(await db.nomination.findUnique({ where: { id: parsed.data.nominationId } }))) return failed("Номинация не найдена.");

  const submission = await db.submission.create({
    data: {
      kind: "NOMINEE",
      status: "INVITED",
      authorName: parsed.data.title,
      contact: parsed.data.contact || "—",
      title: parsed.data.title,
      text: "",
      links: [],
      nominationId: parsed.data.nominationId,
      inviteToken: randomToken(),
      ipHash: "editor",
    },
  });
  await audit(context, "submission.invite", { type: "submission", id: submission.id }, null, { title: submission.title });
  redirect(adminUrl(`/submissions/${submission.id}`));
}

/** Удалить черновик редакции, который команда ещё не подтвердила. */
export async function deleteInvite(id: string): Promise<ActionState> {
  const context = await requirePermission("awards");
  const submission = await db.submission.findUnique({ where: { id } });
  if (!submission || submission.status !== "INVITED") return failed("Удалить можно только неподтверждённую заявку редакции.");
  await db.submission.delete({ where: { id } });
  await audit(context, "submission.invite_delete", { type: "submission", id }, { title: submission.title }, null);
  redirect(adminUrl("/submissions?status=INVITED"));
}
