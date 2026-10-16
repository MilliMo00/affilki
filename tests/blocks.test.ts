import assert from "node:assert/strict";
import { test } from "node:test";
import { parseBlocks, serializeBlocks } from "@/lib/blocks";
import { renderMarkup } from "@/lib/markup";

test("блоки редактора ⇄ разметка: разбор и сборка не теряют содержимое", () => {
  const source = "Вступление **жирно** и [ссылка](https://a.b).\nВторая строка.\n\n## Цифры\n\n- бюджет 1000\n- ROI 40%\n\n![Скрин](/uploads/0123456789abcdef01234567.png)\n\n> Цитата";
  const blocks = parseBlocks(source);
  assert.deepEqual(blocks.map((b) => b.type), ["text", "heading", "list", "image", "quote"]);
  assert.equal(serializeBlocks(blocks), source);
});

test("пустые блоки пропускаются, подпись к фото не ломает разметку", () => {
  const source = serializeBlocks([
    { key: "a", type: "text", text: "  " },
    { key: "b", type: "image", url: "/uploads/0123456789abcdef01234567.png", caption: "скрин (кабинет) [1]" },
    { key: "c", type: "heading", text: "" },
    { key: "d", type: "list", text: "раз\n\nдва\n" },
  ]);
  assert.equal(source, "![скрин  кабинет   1](/uploads/0123456789abcdef01234567.png)\n\n- раз\n- два");
  assert.match(renderMarkup(source), /<img src="\/uploads\/0123456789abcdef01234567\.png"/);
});
