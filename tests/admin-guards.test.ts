import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// Статическая проверка: права нельзя «забыть». Каждое серверное действие и каждая страница админки
// обязаны сами проверить сессию и право — проверка только в лейауте или только на клиенте не считается.

const ROOT = join(process.cwd(), "app", "admin-internal");
const GUARDS = /requirePermission\(|await guard\(|getPreAuthAdmin\(|await getAdmin\(\)/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(ROOT);

test("каждое серверное действие админки проверяет сессию и право", () => {
  const actionFiles = files.filter((file) => readFileSync(file, "utf8").startsWith('"use server"'));
  assert.ok(actionFiles.length >= 8, "файлы действий найдены");

  for (const file of actionFiles) {
    const source = readFileSync(file, "utf8");
    // Тела экспортируемых функций: от «export async function» до следующего экспорта или конца файла.
    const bodies = source.split(/\nexport async function /).slice(1);
    assert.ok(bodies.length > 0, file);
    for (const body of bodies) {
      const name = body.slice(0, body.indexOf("("));
      // Вход ещё без сессии: вместо неё — лимит попыток по IP.
      if (name === "startAdminLogin") {
        assert.match(body, /rateLimiter\.hit\(/, `${name}: нужен лимит попыток`);
        continue;
      }
      assert.match(body, GUARDS, `${file.replace(ROOT, "")} → ${name}: нет проверки прав`);
    }
  }
});

test("каждая страница панели проверяет право сама, а не полагается на лейаут", () => {
  const pages = files.filter((file) => file.includes("(panel)") && file.endsWith("page.tsx"));
  assert.ok(pages.length >= 14, "страницы панели найдены");
  for (const page of pages) {
    assert.match(readFileSync(page, "utf8"), /await requirePermission\(/, `${page.replace(ROOT, "")}: нет requirePermission`);
  }
});

test("обработчики API админки проверяют сессию", () => {
  const routes = files.filter((file) => file.endsWith("route.ts"));
  for (const route of routes) {
    const source = readFileSync(route, "utf8");
    // login-status работает до входа: его защищает секрет в cookie браузера, начавшего вход.
    if (route.includes("login-status")) {
      assert.match(source, /ADMIN_LOGIN_COOKIE/, route);
      continue;
    }
    assert.match(source, /getAdmin\(\)/, `${route.replace(ROOT, "")}: нет проверки сессии`);
  }
});

test("в проекте нет небезопасных сырых запросов", () => {
  const sources = [...walk(join(process.cwd(), "app")), ...walk(join(process.cwd(), "lib"))].filter((file) => /\.tsx?$/.test(file));
  for (const file of sources) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /\$queryRawUnsafe|\$executeRawUnsafe/, file);
  }
});
