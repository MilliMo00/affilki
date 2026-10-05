import { type NextRequest } from "next/server";
import { can, getAdmin } from "@/lib/admin/auth";
import { resolvePeriod } from "@/lib/admin/period";
import { countries, devices, nomineeSources, sources, topArticles, topPages, voteFunnel, votesByDay } from "@/lib/admin/stats";

type Table = { head: string[]; rows: (string | number | null)[][] };

// Значения, начинающиеся с = + - @, Excel выполняет как формулы — обезвреживаем апострофом.
const cell = (value: string | number | null) => {
  const text = value === null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** Выгрузка любой таблицы дашборда в CSV. Только для тех, у кого есть доступ к статистике. */
export async function GET(request: NextRequest) {
  const context = await getAdmin();
  if (!context || !can(context.admin.role, "stats")) return new Response(null, { status: 404 });

  const params = request.nextUrl.searchParams;
  const { from, to, period } = resolvePeriod(params.get("days") ?? undefined);
  const report = params.get("report") ?? "";

  const tables: Record<string, () => Promise<Table>> = {
    pages: async () => ({ head: ["Страница", "Просмотры", "Посетители"], rows: (await topPages(from, to)).map((r) => [r.label, r.value, r.extra ?? 0]) }),
    sources: async () => ({ head: ["Источник", "Посетители"], rows: (await sources(from, to)).map((r) => [r.label, r.value]) }),
    devices: async () => ({ head: ["Устройство", "Посетители"], rows: (await devices(from, to)).map((r) => [r.label, r.value]) }),
    countries: async () => ({ head: ["Страна", "Посетители"], rows: (await countries(from, to)).map((r) => [r.label, r.value]) }),
    funnel: async () => {
      const funnel = await voteFunnel(from, to);
      return { head: ["Шаг или причина отказа", "Количество"], rows: [...funnel.steps, ...funnel.reasons].map((r) => [r.label, r.value]) };
    },
    votes: async () => ({ head: ["День", "Голоса"], rows: (await votesByDay(from, to)).map((r) => [r.label, r.value]) }),
    nominees: async () => ({ head: ["Участник", "Источник", "Посетители"], rows: (await nomineeSources(from, to)).map((r) => [r.nominee, r.source, r.visitors]) }),
    articles: async () => ({
      head: ["Статья", "Просмотры", "Читатели", "Средняя глубина, %"],
      rows: (await topArticles(from, to)).map((r) => [r.slug, r.views, r.readers, r.depth === null ? null : Math.round(r.depth)]),
    }),
  };
  const build = tables[report];
  if (!build) return new Response(null, { status: 404 });

  const table = await build();
  // BOM — чтобы Excel открыл кириллицу правильно.
  const csv = "﻿" + [table.head, ...table.rows].map((row) => row.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="affilki-${report}-${period.key}d.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
