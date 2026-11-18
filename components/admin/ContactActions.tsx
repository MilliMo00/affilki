"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Связаться с командой: «Скопировать и написать» кладёт сообщение в буфер и открывает чат с контактом
 * (вставить текст в чужой чат по ссылке Telegram не даёт), «Отправить через Telegram» открывает выбор
 * чата с уже вписанным текстом.
 */
export function ContactActions({ contacts, message, shareUrl, onContact }: { contacts: string[]; message: string; shareUrl: string; /** Отметить «написал». */ onContact?: () => Promise<unknown> }) {
  const router = useRouter();
  const mark = () => onContact?.().then(() => router.refresh());
  const copyAndOpen = async (username: string) => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Буфер недоступен — чат всё равно откроем, текст можно скопировать кнопкой рядом.
    }
    window.open(`https://t.me/${username}`, "_blank", "noopener");
    void mark();
  };
  const button = "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold";

  return (
    <>
      {contacts.map((username) => (
        <button key={username} type="button" onClick={() => copyAndOpen(username)} className={`${button} focus-on-bright bg-paper text-deep hover:bg-text`}>
          <Send size={16} strokeWidth={1.75} aria-hidden />
          Скопировать и написать @{username}
        </button>
      ))}
      <a href={shareUrl} target="_blank" rel="noopener" onClick={() => void mark()} className={`${button} border border-petal text-paper hover:border-glow`}>
        <Send size={16} strokeWidth={1.75} aria-hidden />
        Отправить через Telegram
      </a>
    </>
  );
}
