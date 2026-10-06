/** Синхронный инлайн-скрипт: выполняется до первой отрисовки, React его не перезапускает. */
export function InlineScript({ html, nonce }: { html: string; nonce?: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      // nonce из CSP этого запроса: без него браузер инлайн-скрипт не выполнит.
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
