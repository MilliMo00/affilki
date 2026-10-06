import assert from "node:assert/strict";
import { test } from "node:test";
import { plainText, readingMinutes, renderMarkup } from "@/lib/markup";
import { slugify } from "@/lib/slug";

test("разметка: заголовки, списки, цитата, ссылки", () => {
  const html = renderMarkup("## Связка\n\nТекст с **жирным** и [ссылкой](https://example.com).\n\n- раз\n- два\n\n1. первый\n2. второй\n\n> цитата");
  assert.match(html, /<h2>Связка<\/h2>/);
  assert.match(html, /<strong>жирным<\/strong>/);
  assert.match(html, /<a href="https:\/\/example\.com" target="_blank" rel="noopener nofollow">ссылкой<\/a>/);
  assert.match(html, /<ul><li>раз<\/li><li>два<\/li><\/ul>/);
  assert.match(html, /<ol><li>первый<\/li><li>второй<\/li><\/ol>/);
  assert.match(html, /<blockquote><p>цитата<\/p><\/blockquote>/);
});

test("разметка: чужой HTML и скрипты обезвреживаются", () => {
  const attacks = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '[клик](javascript:alert(1))',
    '[клик](https://x.com" onmouseover="alert(1))',
    '![x](javascript:alert(1))',
    '![x](/uploads/../../etc/passwd)',
    '## <iframe src="https://evil.example"></iframe>',
    '```\n</code></pre><script>alert(1)</script>\n```',
  ];
  for (const attack of attacks) {
    const html = renderMarkup(attack);
    // Небезопасная ссылка остаётся обычным текстом, а не превращается в тег.
    assert.doesNotMatch(html, /<script|<iframe|<img[^>]+onerror|(?:href|src)="javascript:|onmouseover="/i, attack);
  }
  assert.match(renderMarkup("<b>x</b>"), /&lt;b&gt;x&lt;\/b&gt;/);
});

test("разметка: картинки только из своих загрузок или https", () => {
  assert.match(renderMarkup("![лого](/uploads/0123456789abcdef01234567.png)"), /<img src="\/uploads\/0123456789abcdef01234567\.png" alt="лого"/);
  assert.doesNotMatch(renderMarkup("![x](http://insecure.example/a.png)"), /<img/);
});

test("блок кода сохраняет пустые строки и экранируется", () => {
  const html = renderMarkup("```\nif a < b:\n\n    pause()\n```");
  assert.match(html, /<pre><code>if a &lt; b:\n\n {4}pause\(\)<\/code><\/pre>/);
});

test("текст без разметки и время чтения", () => {
  assert.equal(plainText("## Заголовок\n\nТекст с **жирным** и [ссылкой](https://x.com)."), "Заголовок Текст с жирным и ссылкой.");
  assert.equal(readingMinutes("слово ".repeat(400)), 2);
  assert.equal(readingMinutes("коротко"), 1);
});

test("адрес страницы из названия", () => {
  assert.equal(slugify("Тихий Залив"), "tihiy-zaliv");
  assert.equal(slugify("  Nord Media — №1!  "), "nord-media-1");
  assert.equal(slugify("ЩЁ"), "sche");
  assert.equal(slugify("!!!"), "item");
});

test("текст плаката из заголовка, когда редактор его не задал", async () => {
  const { posterText } = await import("@/components/articles/ArticleCover");
  assert.equal(posterText("Трекер: зачем он нужен и на что смотреть"), "Трекер");
  assert.equal(posterText("Разбор: связка вышла в ноль на третий день — резать или лить"), "связка вышла");
  assert.equal(posterText("Апрув и холд: почему деньги приходят не сразу"), "Апрув и холд");
  assert.equal(posterText("Как посчитать ROI связки и не обмануть себя"), "Как посчитать");
});
