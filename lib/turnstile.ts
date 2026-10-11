// Тестовые секреты Cloudflare принимают любой токен, а те, что начинаются на 1x/2x/3x, — это именно они.
const TEST_SECRET = /^[123]x0{20,}/;

/** Проверка токена Cloudflare Turnstile на сервере. Клиентскому «прошёл капчу» не верим. */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret || !token) return false;
  // В проде тестовый секрет превращает капчу в формальность: лучше отказать всем и заметить это сразу.
  if (process.env.NODE_ENV === "production" && TEST_SECRET.test(secret)) {
    console.error("turnstile: в проде стоит тестовый секрет");
    return false;
  }
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const result = (await res.json()) as { success: boolean; hostname?: string };
    if (result.success !== true) return false;
    // Токен, выданный виджетом на чужом сайте с нашим публичным ключом, не годится.
    if (process.env.NODE_ENV === "production" && result.hostname) {
      const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com").hostname;
      if (result.hostname !== expected && result.hostname !== `www.${expected}`) return false;
    }
    return true;
  } catch {
    return false;
  }
}
