"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Кнопка «Скопировать»: кладёт текст в буфер и на пару секунд показывает «Скопировано». */
export function CopyButton({ text, label = "Скопировать" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Без доступа к буферу (старый браузер, не https) — запасной способ через выделение.
      const area = document.createElement("textarea");
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-2 rounded-full border border-petal px-4 text-sm font-semibold text-paper hover:border-glow">
      {copied ? <Check size={16} strokeWidth={2} aria-hidden /> : <Copy size={16} strokeWidth={1.75} aria-hidden />}
      {copied ? "Скопировано" : label}
    </button>
  );
}
