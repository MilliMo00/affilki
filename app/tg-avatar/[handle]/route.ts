import { OWNER_CONTACT_URL, PARTNERS_CONTACT_URL, SUPPORT_CONTACT_URL, TG_CHANNEL_URL } from "@/lib/env";

// Аватарки контактов AFFILKI из Telegram: берём картинку из превью страницы t.me/<имя>.
// Отдаём со своего домена и держим в памяти несколько часов — Telegram не дёргаем на каждый показ,
// а новая аватарка появляется на сайте сама.

const ALLOWED = new Set([PARTNERS_CONTACT_URL, SUPPORT_CONTACT_URL, OWNER_CONTACT_URL, TG_CHANNEL_URL].map((url) => url.split("/").pop()!.toLowerCase()));
const TTL = 6 * 60 * 60_000;
const MAX_BYTES = 2 * 1024 * 1024;

type Cached = { body: ArrayBuffer; type: string; until: number };
const globalForAvatars = globalThis as unknown as { tgAvatars?: Map<string, Cached> };
const cache = (globalForAvatars.tgAvatars ??= new Map());

// Прозрачный пиксель: если аватарку получить не удалось, под ним виден фирменный цветок.
const EMPTY = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="), (c) => c.charCodeAt(0));

async function load(handle: string): Promise<Cached | null> {
  const page = await fetch(`https://t.me/${handle}`, { signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.text() : ""));
  const src = /<meta property="og:image" content="(https:\/\/[^"]+)"/.exec(page)?.[1];
  // Картинки Telegram лежат на его CDN; чужие адреса не загружаем.
  if (!src || !/^https:\/\/cdn\d*\.(telesco\.pe|telegram-cdn\.org)\//.test(src)) return null;
  const image = await fetch(src, { signal: AbortSignal.timeout(8000) });
  const type = image.headers.get("content-type") ?? "";
  if (!image.ok || !/^image\/(jpeg|png|webp)$/.test(type)) return null;
  const body = await image.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return null;
  return { body, type, until: Date.now() + TTL };
}

export async function GET(_: Request, { params }: { params: Promise<{ handle: string }> }) {
  const handle = (await params).handle.toLowerCase();
  if (!ALLOWED.has(handle)) return new Response(null, { status: 404 });

  let entry = cache.get(handle);
  if (!entry || entry.until < Date.now()) {
    const fresh = await load(handle).catch(() => null);
    // Telegram недоступен — показываем прежнюю аватарку, если она была.
    if (fresh) cache.set(handle, (entry = fresh));
  }
  if (!entry) {
    return new Response(EMPTY, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" } });
  }
  return new Response(entry.body, { headers: { "Content-Type": entry.type, "Cache-Control": "public, max-age=21600" } });
}
