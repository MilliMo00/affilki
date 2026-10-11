import assert from "node:assert/strict";
import { test } from "node:test";
import { clientIp, hashSalt, normalizeIp, rawClientIp } from "@/lib/request";

const req = (xff?: string) => new Request("https://affilki.com", { headers: xff ? { "x-forwarded-for": xff } : {} });

test("берём последний адрес: левее него клиент мог написать что угодно", () => {
  assert.equal(clientIp(req("6.6.6.6, 203.0.113.7")), "203.0.113.7");
  assert.equal(rawClientIp("6.6.6.6, 203.0.113.7"), "203.0.113.7");
  assert.equal(clientIp(req()), "unknown");
});

test("IPv6 сводится к подсети /64, IPv4-in-IPv6 — к IPv4", () => {
  assert.equal(normalizeIp("2001:db8:1:2:aaaa:bbbb:cccc:dddd"), "2001:db8:1:2::/64");
  assert.equal(normalizeIp("2001:db8:1:2:1111::1"), normalizeIp("2001:db8:1:2:2222::2"));
  assert.equal(normalizeIp("2001:db8::1"), "2001:db8:0:0::/64");
  assert.equal(normalizeIp("::ffff:203.0.113.7"), "203.0.113.7");
});

test("в проде без IP_HASH_SALT хэшировать нельзя", () => {
  const env = process.env as Record<string, string | undefined>;
  const saved = { salt: env.IP_HASH_SALT, node: env.NODE_ENV };
  try {
    delete env.IP_HASH_SALT;
    env.NODE_ENV = "production";
    assert.throws(() => hashSalt(), /IP_HASH_SALT/);
    env.NODE_ENV = "test";
    assert.equal(hashSalt(), "dev-salt");
  } finally {
    env.IP_HASH_SALT = saved.salt;
    env.NODE_ENV = saved.node;
  }
});
