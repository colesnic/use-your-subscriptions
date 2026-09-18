const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { hash: "SHA-256", iterations, name: "PBKDF2", salt },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  if (!stored) {
    return false;
  }

  const [scheme, iterationsRaw, saltRaw, hashRaw] = stored.split("$");
  if (scheme !== "pbkdf2" || !(iterationsRaw && saltRaw && hashRaw)) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const actual = await derive(password, fromBase64(saltRaw), iterations);
  const expected = fromBase64(hashRaw);
  if (actual.length !== expected.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < actual.length; index += 1) {
    diff |= actual[index] ^ expected[index];
  }
  return diff === 0;
}

export async function burnPasswordCheck(password: string) {
  await derive(password, new Uint8Array(SALT_LENGTH), ITERATIONS);
}
