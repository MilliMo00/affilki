import { NextResponse } from "next/server";
import { getLiveSnapshot } from "@/lib/live/snapshot";

export const dynamic = "force-dynamic";

/** Фолбэк для клиентов без SSE: тот же снимок обычным запросом. */
export async function GET() {
  return NextResponse.json(await getLiveSnapshot(), { headers: { "Cache-Control": "no-store" } });
}
