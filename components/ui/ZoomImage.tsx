"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

type ZoomImageProps = { src: string; alt: string; sizes: string; className?: string };

/** Картинка, которая по клику открывается крупно поверх страницы, а не в новой вкладке. */
export function ZoomImage({ src, alt, sizes, className }: ZoomImageProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" aria-label={`Открыть крупно: ${alt}`} onClick={() => dialog.current?.showModal()} className={className}>
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </button>
      {/* Клик по затемнению (сам dialog) закрывает окно; Esc закрывает его без нашего кода. */}
      <dialog
        ref={dialog}
        onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/90 p-4 backdrop:bg-ink/60 open:flex open:items-center open:justify-center sm:p-10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- полный размер без пережатия */}
        <img src={src} alt={alt} className="max-h-full max-w-full rounded-card object-contain" />
        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => dialog.current?.close()}
          className="focus-on-bright absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-paper text-deep hover:bg-text"
        >
          <X size={22} strokeWidth={1.75} aria-hidden />
        </button>
      </dialog>
    </>
  );
}
