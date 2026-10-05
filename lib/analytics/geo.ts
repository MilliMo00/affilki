import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CountryResponse, Reader } from "maxmind";

// Страна по IP — из локального файла базы (DB-IP Lite, обновляется скриптом scripts/cron.ts geoip).
// Никаких внешних запросов; сам IP никуда не сохраняется. Нет файла — страна просто не определяется.
const DB_PATH = process.env.GEOIP_DB ?? join(process.cwd(), "data", "geoip", "country.mmdb");

let reader: Promise<Reader<CountryResponse> | null> | null = null;

function open() {
  reader ??= existsSync(DB_PATH)
    ? import("maxmind").then((maxmind) => maxmind.open<CountryResponse>(DB_PATH)).catch(() => null)
    : Promise.resolve(null);
  return reader;
}

export async function countryOf(ip: string): Promise<string | null> {
  if (!ip || ip === "unknown") return null;
  try {
    return (await open())?.get(ip)?.country?.iso_code ?? null;
  } catch {
    return null;
  }
}
