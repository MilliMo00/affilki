import { verifyCode, type AdminContext } from "./auth";

/** Результат серверного действия для формы админки. */
export type ActionState = { ok: boolean; message: string } | null;

export const done = (message = "Сохранено"): ActionState => ({ ok: true, message });
export const failed = (message: string): ActionState => ({ ok: false, message });

/**
 * Повторное подтверждение опасного действия свежим кодом из приложения.
 * Возвращает сообщение об ошибке или null, если код верный.
 */
export async function stepUp(context: AdminContext, formData: FormData): Promise<string | null> {
  const result = await verifyCode(context.admin, formData.get("totp"));
  return result.ok ? null : `${result.error} Действие не выполнено.`;
}
