import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "focus-on-bright bg-paper text-deep hover:bg-text",
  secondary: "border border-petal text-paper hover:border-glow hover:bg-glow/20",
  ghost: "text-text hover:bg-paper/10 hover:text-paper",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-14 px-8 text-lg",
};

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };
type AsButton = Common & { href?: undefined } & Omit<ComponentProps<"button">, "className" | "children">;
type AsLink = Common & { href: string } & Omit<ComponentProps<"a">, "className" | "children" | "href">;

export function Button(props: AsButton | AsLink) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (rest.href !== undefined) {
    const { href, ...linkProps } = rest;
    if (/^https?:\/\//.test(href)) {
      return (
        <a href={href} target="_blank" rel="noopener" className={classes} {...linkProps}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
