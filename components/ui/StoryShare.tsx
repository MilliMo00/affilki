"use client";

import { Check, Send, Smartphone } from "lucide-react";
import { useState } from "react";
import { track } from "@/lib/track";
import { Button } from "./Button";

type StoryShareProps = {
  /** Страница, которой делятся: /n/slug, /awards/slug, /a/slug. Картинка лежит по адресу path + "/story". */
  path: string;
  /** Текст для поста в Telegram. */
  text: string;
  className?: string;
};

/**
 * Поделиться в сторис и в Telegram.
 * Сторис: на телефоне открывается системное меню с готовой картинкой (Instagram, Telegram и другие),
 * а ссылка копируется — её добавляют стикером «Ссылка». На компьютере картинка скачивается.
 */
export function StoryShare({ path, text, className }: StoryShareProps) {
  const [state, setState] = useState<"idle" | "busy" | "shared" | "saved" | "failed">("idle");

  const story = async () => {
    setState("busy");
    track("share_click", { target: path, channel: "story" });
    const url = new URL(`${path}?utm_source=story&utm_medium=share`, window.location.origin).toString();
    try {
      const res = await fetch(`${path}/story`);
      if (!res.ok) throw new Error("image");
      const file = new File([await res.blob()], "affilki-story.png", { type: "image/png" });
      // Ссылку кладём в буфер заранее: в Instagram её останется вставить в стикер.
      await navigator.clipboard.writeText(url).catch(() => {});

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setState("shared");
        } catch {
          // Человек закрыл меню — это не ошибка.
          setState("idle");
        }
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(link.href);
      setState("saved");
    } catch {
      setState("failed");
    }
  };

  const telegram = `https://t.me/share/url?url=${encodeURIComponent(new URL(`${path}?utm_source=telegram&utm_medium=share`, process.env.NEXT_PUBLIC_SITE_URL ?? "https://affilki.com").toString())}&text=${encodeURIComponent(text)}`;

  return (
    <div className={className}>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={story} disabled={state === "busy"}>
          {state === "shared" || state === "saved" ? <Check size={18} strokeWidth={1.75} aria-hidden /> : <Smartphone size={18} strokeWidth={1.75} aria-hidden />}
          {state === "busy" ? "Готовим картинку…" : "В сторис"}
        </Button>
        <Button variant="secondary" href={telegram} onClick={() => track("share_click", { target: path, channel: "telegram" })}>
          <Send size={18} strokeWidth={1.75} aria-hidden />В Telegram
        </Button>
      </div>
      <p aria-live="polite" className="mt-3 min-h-6 text-center text-sm text-muted-bright">
        {state === "shared" && "Ссылка скопирована — добавь её в сторис стикером «Ссылка»."}
        {state === "saved" && "Картинка скачана, ссылка скопирована. Выложи картинку в сторис и добавь ссылку стикером."}
        {state === "failed" && "Не получилось подготовить картинку. Попробуй ещё раз."}
      </p>
    </div>
  );
}
