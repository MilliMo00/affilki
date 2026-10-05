import assert from "node:assert/strict";
import { test } from "node:test";
import { decrypt, encrypt, hashSecret, newBackupCodes, sign, totpCode, totpStep, unsign, verifySecret, verifyTotp } from "@/lib/admin/crypto";

process.env.ADMIN_ENC_KEY ??= "test-key-test-key-test-key-test-key";
process.env.SESSION_SECRET ??= "test-session-secret";

test("TOTP совпадает с эталонными значениями RFC 6238", () => {
  // Секрет «12345678901234567890» в base32; эталон для SHA-1 из приложения B к RFC, усечённый до 6 цифр.
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  assert.equal(totpCode(secret, totpStep(59_000)), "287082");
  assert.equal(totpCode(secret, totpStep(1111111109_000)), "081804");
  assert.equal(totpCode(secret, totpStep(2000000000_000)), "279037");
});

test("код принимается в окне ±30 секунд и не принимается вне его", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  const now = 1_700_000_000_000;
  const code = totpCode(secret, totpStep(now));
  assert.equal(verifyTotp(secret, code, now), totpStep(now));
  assert.notEqual(verifyTotp(secret, code, now + 30_000), null);
  assert.equal(verifyTotp(secret, code, now + 90_000), null);
  assert.equal(verifyTotp(secret, "12345", now), null);
  assert.equal(verifyTotp(secret, "abcdef", now), null);
});

test("секрет шифруется и расшифровывается; подмена ломает расшифровку", () => {
  const packed = encrypt("JBSWY3DPEHPK3PXP");
  assert.notEqual(packed, "JBSWY3DPEHPK3PXP");
  assert.equal(decrypt(packed), "JBSWY3DPEHPK3PXP");
  assert.notEqual(encrypt("JBSWY3DPEHPK3PXP"), packed, "каждый раз новый вектор");
  const [iv, tag, data] = packed.split(".");
  const flipped = Buffer.from(data, "base64");
  flipped[0] ^= 1;
  assert.throws(() => decrypt([iv, tag, flipped.toString("base64")].join(".")));
});

test("резервные коды: 10 разных, в базе только хэши", () => {
  const { codes, hashes } = newBackupCodes();
  assert.equal(new Set(codes).size, 10);
  assert.ok(hashes.every((hash, i) => !hash.includes(codes[i])));
  assert.equal(verifySecret(codes[0], hashes[0]), true);
  assert.equal(verifySecret(codes[0], hashes[1]), false);
  assert.equal(verifySecret("nope-nope", hashSecret("real-code")), false);
});

test("подпись: подделанное значение не проходит", () => {
  const signed = sign("admin123:1700000000");
  assert.equal(unsign(signed), "admin123:1700000000");
  assert.equal(unsign(signed.replace("admin123", "admin999")), null);
  assert.equal(unsign(undefined), null);
});

test("загрузка: тип определяется по содержимому, SVG и подделки не проходят", async () => {
  const { sniffImage } = await import("@/lib/storage");
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  assert.equal(sniffImage(png)?.ext, "png");
  assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.ext, "jpg");
  assert.equal(sniffImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
  assert.equal(sniffImage(Buffer.from("<html><script>alert(1)</script></html>")), null);
  assert.equal(sniffImage(Buffer.from("GIF89a-but-truncated"))?.ext, "gif");
  assert.equal(sniffImage(Buffer.alloc(0)), null);
});
