import { timingSafeEqual } from 'node:crypto';

const HASH_SCHEME = 'pbkdf2-sha256';
const PBKDF2_ITERATIONS = 600_000;
const HASH_BYTES = 32;

async function derivePbkdf2(password: string, salt: string, iterations: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' }, material, HASH_BYTES * 8);
  return new Uint8Array(bits);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16));
}

function constantTimeHexEqual(actual: Uint8Array, expectedHex: string): boolean {
  if (!/^[a-f\d]{64}$/i.test(expectedHex)) return false;
  return timingSafeEqual(actual, fromHex(expectedHex));
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const digest = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `${HASH_SCHEME}$${PBKDF2_ITERATIONS}$${toHex(digest)}`;
}

export function createSalt(): string {
  return crypto.randomUUID();
}

export interface PasswordVerification {
  valid: boolean;
  needsRehash: boolean;
}

export async function verifyPasswordWithUpgrade(password: string, salt: string, storedHash: string): Promise<PasswordVerification> {
  const [scheme, iterationsValue, versionedHash] = storedHash.split('$');
  if (scheme === HASH_SCHEME && Number(iterationsValue) === PBKDF2_ITERATIONS && versionedHash) {
    const actual = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
    return { valid: constantTimeHexEqual(actual, versionedHash), needsRehash: false };
  }

  // Upgrade the previous PBKDF2 format and the original SHA-256(password + salt) format on successful login.
  if (/^[a-f\d]{64}$/i.test(storedHash)) {
    const pbkdf2 = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
    if (constantTimeHexEqual(pbkdf2, storedHash)) return { valid: true, needsRehash: true };
    const legacyDigest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${password}${salt}`)));
    if (constantTimeHexEqual(legacyDigest, storedHash)) return { valid: true, needsRehash: true };
  }
  return { valid: false, needsRehash: false };
}

export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  return (await verifyPasswordWithUpgrade(password, salt, storedHash)).valid;
}
