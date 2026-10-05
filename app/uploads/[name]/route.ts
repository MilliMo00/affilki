import { readUpload } from "@/lib/storage";

/** Отдаёт загруженные картинки. Имя файла случайное и неизменяемое, поэтому кэш — на год. */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const file = await readUpload((await params).name);
  if (!file) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
