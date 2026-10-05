// Фоновые задачи: запускаются планировщиком на сервере.
//   npx tsx scripts/cron.ts nightly   — агрегаты за вчера и сегодня, чистка старых событий, обезличивание
//   npx tsx scripts/cron.ts geoip     — обновить локальную базу «IP → страна» (раз в месяц)
import { createWriteStream, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { aggregateDay, anonymizeVoters, purgeOldEvents } from "../lib/analytics/aggregate";
import { db } from "../lib/db";

async function nightly() {
  const now = new Date();
  for (const day of [new Date(now.getTime() - 86_400_000), now]) {
    console.log(`aggregate ${day.toISOString().slice(0, 10)}: ${await aggregateDay(day)} строк`);
  }
  console.log(`purged events: ${await purgeOldEvents(now)}`);
  console.log(`anonymized votes: ${await anonymizeVoters(now)}`);
}

// База DB-IP Lite (CC BY 4.0, ссылка на db-ip.com стоит на /privacy). Выходит раз в месяц.
async function geoip() {
  const target = process.env.GEOIP_DB ?? join(process.cwd(), "data", "geoip", "country.mmdb");
  mkdirSync(dirname(target), { recursive: true });
  const now = new Date();
  for (const offset of [0, 1]) {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)).toISOString().slice(0, 7);
    const res = await fetch(`https://download.db-ip.com/free/dbip-country-lite-${month}.mmdb.gz`);
    if (!res.ok || !res.body) continue;
    await pipeline(Readable.fromWeb(res.body as never), createGunzip(), createWriteStream(`${target}.tmp`));
    renameSync(`${target}.tmp`, target);
    return console.log(`geoip: ${month} → ${target}`);
  }
  throw new Error("geoip: не удалось скачать базу");
}

const tasks: Record<string, () => Promise<void>> = { nightly, geoip };
const task = tasks[process.argv[2] ?? ""];
if (!task) {
  console.error(`Задача не найдена. Доступно: ${Object.keys(tasks).join(", ")}`);
  process.exit(1);
}
task()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
