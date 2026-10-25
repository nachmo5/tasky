// apps/api/src/auth/password.ts
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify<string, Buffer, number, ScryptOptions, Buffer>(scryptCb);
const PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }; // OWASP; needs maxmem above the 32 MiB default
const KEY_LENGTH = 64;

export async function hashText(text: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(text, salt, KEY_LENGTH, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyHash(stored: string, password: string): Promise<boolean> {
  const [, N, r, p, salt, key] = stored.split("$");
  const expected = Buffer.from(key!, "base64");
  const actual = await scrypt(password, Buffer.from(salt!, "base64"), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: PARAMS.maxmem,
  });
  return timingSafeEqual(actual, expected);
}
