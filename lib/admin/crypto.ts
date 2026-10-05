import * as nodeCrypto from "node:crypto";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

// ── TOTP (RFC 6238): SHA-1, 6 цифр, шаг 30 секунд — то, что понимают Google Authenticator и 2FAS ──

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SEC = 30;

function base32Encode(bytes: Buffer) {
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  return out;
}

function base32Decode(text: string) {
  let bits = "";
  for (const char of text.replace(/=+$/, "").toUpperCase()) {
    const value = B32.indexOf(char);
    if (value === -1) throw new Error("bad base32");
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export const newTotpSecret = () => base32Encode(randomBytes(20));

export const totpStep = (now = Date.now()) => Math.floor(now / 1000 / STEP_SEC);

export function totpCode(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, "0");
}

/** Проверяет код с допуском ±1 шаг. Возвращает шаг, на котором код совпал, или null. */
export function verifyTotp(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const current = totpStep(now);
  for (const step of [current, current - 1, current + 1]) {
    if (timingSafeEqual(Buffer.from(totpCode(secret, step)), Buffer.from(code))) return step;
  }
  return null;
}

export const totpUri = (secret: string, account: string) =>
  `otpauth://totp/${encodeURIComponent(`AFFILKI:${account}`)}?secret=${secret}&issuer=AFFILKI&algorithm=SHA1&digits=6&period=30`;

// ── Шифрование секрета TOTP: AES-256-GCM, ключ из ADMIN_ENC_KEY ──

function encKey() {
  const raw = process.env.ADMIN_ENC_KEY;
  if (!raw || raw.length < 32) throw new Error("ADMIN_ENC_KEY не задан или короче 32 символов");
  return createHash("sha256").update(raw).digest();
}

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString("base64")).join(".");
}

export function decrypt(packed: string) {
  const [iv, tag, data] = packed.split(".").map((part) => Buffer.from(part, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", encKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// ── Резервные коды: хранятся только хэши argon2id ──

const ARGON = { parallelism: 1, tagLength: 32, memory: 19_456, passes: 2 };

// argon2Sync есть в Node 24.7+, но ещё не описан в @types/node этой версии.
type Argon2Sync = (algorithm: "argon2id", params: typeof ARGON & { message: Buffer; nonce: Buffer }) => Buffer;
const argon2Sync = (nodeCrypto as unknown as { argon2Sync: Argon2Sync }).argon2Sync;

function argon(value: string, salt: Buffer) {
  return argon2Sync("argon2id", { message: Buffer.from(value), nonce: salt, ...ARGON });
}

export function hashSecret(value: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${argon(value, salt).toString("hex")}`;
}

export function verifySecret(value: string, stored: string) {
  const [salt, hash] = stored.split(":").map((part) => Buffer.from(part, "hex"));
  if (!salt?.length || !hash?.length) return false;
  return timingSafeEqual(argon(value, salt), hash);
}

/** 10 одноразовых кодов вида «k7mq-2xvd». Показываются один раз, в базе — только хэши. */
export function newBackupCodes() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const part = () => Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  const codes = Array.from({ length: 10 }, () => `${part()}-${part()}`);
  return { codes, hashes: codes.map(hashSecret) };
}

// ── Подпись короткоживущих значений (cookie между первым и вторым фактором) ──

export function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET не задан");
  return `${value}.${createHmac("sha256", secret).update(value).digest("base64url")}`;
}

export function unsign(signed: string | undefined) {
  if (!signed) return null;
  const index = signed.lastIndexOf(".");
  const value = signed.slice(0, index);
  const expected = Buffer.from(sign(value));
  const actual = Buffer.from(signed);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? value : null;
}
