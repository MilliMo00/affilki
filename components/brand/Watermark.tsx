import { cn } from "@/lib/cn";
import { Flower } from "./Flower";

/**
 * Огромный полупрозрачный цветок, обрезанный краем — как на постере.
 * Родитель должен быть relative + overflow-hidden.
 */
export function Watermark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[max(110%,720px)] -translate-x-1/2 -translate-y-[42%] text-petal opacity-45",
        className,
      )}
    >
      <Flower size="100%" rayColor="var(--indigo)" rayWidth={1.1} />
    </div>
  );
}
