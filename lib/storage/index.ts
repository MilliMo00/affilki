import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Хранилище загрузок. Сейчас — папка data/uploads на сервере (переживает деплои, в git не лежит);
// за этим интерфейсом её можно заменить на S3-совместимое хранилище.
// turbopackIgnore: папка с загрузками — данные, а не часть сборки.
const DIR = process.env.UPLOADS_DIR ?? join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads");
const MAX_BYTES = 2 * 1024 * 1024;

// Тип определяется по сигнатуре файла, а не по расширению или заголовку. SVG запрещён: в нём можно спрятать скрипт.
const SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: "png", mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "gif", mime: "image/gif", test: (b) => ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString("latin1")) },
  { ext: "webp", mime: "image/webp", test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
];

export function sniffImage(bytes: Buffer) {
  return SIGNATURES.find((signature) => signature.test(bytes)) ?? null;
}

/** Сохраняет картинку под случайным именем. Возвращает публичный URL или текст ошибки. */
export async function saveImage(file: File): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "Файл пустой." };
  if (file.size > MAX_BYTES) return { error: "Файл больше 2 МБ." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { error: "Подходят только PNG, JPG, GIF и WebP." };

  const name = `${randomBytes(12).toString("hex")}.${kind.ext}`;
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, name), bytes);
  return { url: `/uploads/${name}` };
}

/** Читает загруженный файл по имени. Имя строго проверяется — выйти из папки нельзя. */
export async function readUpload(name: string) {
  if (!/^[a-f0-9]{24}\.(png|jpg|gif|webp)$/.test(name)) return null;
  try {
    const bytes = await readFile(join(DIR, name));
    const kind = sniffImage(bytes);
    return kind ? { bytes, mime: kind.mime } : null;
  } catch {
    return null;
  }
}
