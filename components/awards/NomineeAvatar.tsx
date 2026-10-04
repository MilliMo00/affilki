import Image from "next/image";
import { cn } from "@/lib/cn";

type NomineeAvatarProps = { name: string; logoUrl: string | null; size?: number; className?: string };

/** Лого участника; без лого — инициалы. */
export function NomineeAvatar({ name, logoUrl, size = 56, className }: NomineeAvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-petal bg-ink font-display font-bold text-paper",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {logoUrl ? <Image src={logoUrl} alt="" fill sizes={`${size}px`} className="object-cover" /> : initials}
    </span>
  );
}
