import { Send } from "lucide-react";
import { Flower } from "@/components/brand/Flower";
import { Button } from "@/components/ui/Button";
import type { ChannelInfo } from "@/lib/data";
import { formatCount } from "@/lib/format";

export function TgChannelWidget({ channel }: { channel: ChannelInfo }) {
  return (
    <aside aria-label="Telegram-канал" className="rounded-card border border-petal/40 bg-deep/40 p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-indigo">
          <Flower size={34} className="text-paper" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-paper">{channel.title}</p>
          <p className="text-sm text-muted">{formatCount(channel.subscribers)} подписчиков</p>
        </div>
      </div>
      <p className="mt-4 text-text">Новости рынка, кейсы и всё про премию — раньше, чем на сайте.</p>
      <Button href={channel.url} className="mt-4 w-full">
        <Send size={18} strokeWidth={1.75} aria-hidden />
        Подписаться
      </Button>
    </aside>
  );
}
