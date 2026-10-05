"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { track } from "@/lib/track";
import { Button } from "./Button";

type ShareButtonProps = {
  /** Путь на сайте, например /n/leadora. */
  path: string;
  title: string;
  label?: string;
  /** Всегда копировать ссылку, без нативного share. */
  copyOnly?: boolean;
  className?: string;
};

/** Нативный share на мобиле, иначе копирует ссылку. */
export function ShareButton({ path, title, label = "Поделиться", copyOnly, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    track("share_click", { target: path.split("?")[0] });
    if (!copyOnly && navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Button variant="secondary" onClick={share} className={className}>
      {copied ? <Check size={18} strokeWidth={1.75} aria-hidden /> : <Share2 size={18} strokeWidth={1.75} aria-hidden />}
      <span aria-live="polite">{copied ? "Ссылка скопирована" : label}</span>
    </Button>
  );
}
