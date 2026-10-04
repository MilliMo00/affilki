import { WORDMARK_LETTERS, WORDMARK_VIEWBOX } from "./geometry";

export function Wordmark({ height = 20, className }: { height?: number; className?: string }) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      height={height}
      width={(height * 469) / 100}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="AFFILKI"
    >
      {WORDMARK_LETTERS.map((letter, i) => (
        <path key={i} d={letter.d} transform={`translate(${letter.x})`} fillRule="evenodd" />
      ))}
    </svg>
  );
}
