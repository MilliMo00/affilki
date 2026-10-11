import { getLiveSnapshot } from "@/lib/live/snapshot";
import { clientIp, hashValue } from "@/lib/request";

export const dynamic = "force-dynamic";

// Соединение живёт не дольше 10 минут: браузер сам переподключится, а «забытые» потоки не копятся.
const MAX_LIFETIME_MS = 10 * 60 * 1000;
// Несколько вкладок и общий адрес (офис, мобильная сеть) помещаются; десятки потоков с одного адреса — нет.
const MAX_STREAMS_PER_IP = 20;
const openStreams = new Map<string, number>();

/** Server-Sent Events: один поток на клиента, сервер шлёт агрегированный снимок раз в liveRefreshSec. */
export async function GET(request: Request) {
  // Не больше нескольких потоков с одного адреса: иначе десятки тысяч «зависших» соединений кладут сервер.
  const ipKey = hashValue(clientIp(request));
  if ((openStreams.get(ipKey) ?? 0) >= MAX_STREAMS_PER_IP) return new Response(null, { status: 429, headers: { "Retry-After": "30" } });
  openStreams.set(ipKey, (openStreams.get(ipKey) ?? 0) + 1);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const left = (openStreams.get(ipKey) ?? 1) - 1;
    if (left <= 0) openStreams.delete(ipKey);
    else openStreams.set(ipKey, left);
  };

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      const close = () => {
        if (closed) return;
        closed = true;
        release();
        clearTimeout(timer);
        try {
          controller.close();
        } catch {}
      };
      request.signal.addEventListener("abort", close);

      const tick = async () => {
        if (closed) return;
        try {
          const snapshot = await getLiveSnapshot();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
          if (Date.now() - startedAt > MAX_LIFETIME_MS) return close();
          timer = setTimeout(tick, Math.max(5, snapshot?.refreshSec ?? 15) * 1000);
        } catch {
          close();
        }
      };

      // Подсказка браузеру: через сколько переподключаться после разрыва.
      controller.enqueue(encoder.encode("retry: 5000\n\n"));
      await tick();
    },
    cancel() {
      closed = true;
      release();
      clearTimeout(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
