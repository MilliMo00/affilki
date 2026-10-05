import { getLiveSnapshot } from "@/lib/live/snapshot";
import { LiveTicker } from "./LiveTicker";

/** Серверная обёртка: строка появляется только во время голосования. */
export async function LiveTickerSlot() {
  const snapshot = await getLiveSnapshot();
  if (!snapshot || (snapshot.status !== "live" && snapshot.status !== "frozen")) return null;
  return <LiveTicker initial={snapshot} />;
}
