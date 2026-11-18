"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ContactedToggleProps = {
  contacted: boolean;
  /** Когда и кто отметил — подпись рядом с галочкой. */
  note?: string;
  onChange: (contacted: boolean) => Promise<unknown>;
};

/** Галочка «Написал»: сохраняется сразу, без кнопки «Сохранить». */
export function ContactedToggle({ contacted, note, onChange }: ContactedToggleProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(contacted);
  const [pending, startTransition] = useTransition();

  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${checked ? "border-paper bg-paper text-deep" : "border-petal text-paper hover:border-glow"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.checked;
          setChecked(next);
          startTransition(async () => {
            await onChange(next);
            router.refresh();
          });
        }}
        className="size-4 accent-[#30209D]"
      />
      {checked ? "Написал" : "Не писал"}
      {checked && note && <span className="font-normal">· {note}</span>}
    </label>
  );
}
