import { AdSlot } from "@/components/ads/AdSlot";

const INLINE_AFTER_PARAGRAPH = 3;

/** Делит HTML после N-го абзаца, чтобы вставить между частями рекламный слот. */
function splitAfterParagraph(html: string, n: number): [string, string] {
  let index = -1;
  for (let i = 0; i < n; i++) {
    index = html.indexOf("</p>", index + 1);
    if (index === -1) return [html, ""];
  }
  const cut = index + "</p>".length;
  return [html.slice(0, cut), html.slice(cut)];
}

/** Тело статьи. HTML должен быть санитизирован на сервере до сохранения (ТЗ, раздел 11). */
export function ArticleBody({ html }: { html: string }) {
  const [head, tail] = splitAfterParagraph(html, INLINE_AFTER_PARAGRAPH);

  return (
    <>
      <div className="article-body" dangerouslySetInnerHTML={{ __html: head }} />
      {tail && (
        <>
          <AdSlot slotKey="article_inline" className="my-8" />
          <div className="article-body" dangerouslySetInnerHTML={{ __html: tail }} />
        </>
      )}
    </>
  );
}
