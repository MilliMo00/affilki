import { z } from "zod";

// Одна схема на клиент и сервер: форма показывает те же ошибки, что вернул бы API.
export const submitSchema = z.object({
  name: z.string().trim().min(1, "Укажи имя или название команды").max(100),
  tg: z
    .string()
    .trim()
    .regex(/^(@|https:\/\/t\.me\/)?[a-zA-Z0-9_]{4,32}$/, "Нужен ник в Telegram, например @username"),
  category: z.string().trim().min(1).max(50),
  title: z.string().trim().min(5, "Заголовок слишком короткий").max(200),
  description: z.string().trim().min(20, "Опиши тему хотя бы в паре предложений").max(3000),
  draftUrl: z
    .string()
    .trim()
    .max(500)
    .regex(/^https:\/\/\S+$/, "Ссылка должна начинаться с https://")
    .or(z.literal("")),
  consent: z.literal(true, { message: "Без согласия заявку отправить нельзя" }),
  /** Honeypot: человек это поле не видит и оставляет пустым. */
  website: z.string().max(0).optional(),
});

export type SubmitInput = z.infer<typeof submitSchema>;
export type SubmitErrors = Partial<Record<keyof SubmitInput, string>>;

export function fieldErrors(error: z.ZodError): SubmitErrors {
  const errors: SubmitErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof SubmitInput;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
