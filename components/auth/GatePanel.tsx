import { Send } from "lucide-react";
import { Flower } from "@/components/brand/Flower";
import { Button } from "@/components/ui/Button";

type GatePanelProps =
  | { variant: "login"; nomineeName?: string; onLogin?: () => void }
  | { variant: "subscribe"; channelUrl: string; onCheck?: () => void };

/** Содержимое диалога перед голосом: вход через Telegram или проверка подписки. */
export function GatePanel(props: GatePanelProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Flower size={56} className="text-paper" rayColor="var(--deep)" />
      {props.variant === "login" ? (
        <>
          <h2 className="text-xl">
            {props.nomineeName ? `Войди, чтобы проголосовать за ${props.nomineeName}` : "Вход через Telegram"}
          </h2>
          <p className="text-muted-bright">
            Голос привязан к Telegram-аккаунту: один аккаунт — один голос в номинации. Без паролей и почты.
          </p>
          <Button size="lg" className="w-full" onClick={props.onLogin}>
            <Send size={20} strokeWidth={1.75} aria-hidden />
            Войти через Telegram
          </Button>
          <p className="text-sm text-muted-bright">
            Сейчас демо-режим: вход и голоса сохраняются только в этом браузере.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl">Подпишись на канал, чтобы голосовать</h2>
          <p className="text-muted-bright">Голосуют подписчики канала AFFILKI. Подпишись и вернись — голос засчитаем сразу.</p>
          <Button size="lg" className="w-full" href={props.channelUrl}>
            <Send size={20} strokeWidth={1.75} aria-hidden />
            Подписаться
          </Button>
          <Button variant="secondary" className="w-full" onClick={props.onCheck}>
            Я подписался, проверить
          </Button>
        </>
      )}
    </div>
  );
}
