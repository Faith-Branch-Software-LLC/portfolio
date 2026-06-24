import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALG = 'aes-256-gcm';
const PREFIX = 'enc1:'; // versioned prefix — easy to add enc2 later

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) throw new Error('ENCRYPTION_KEY env var missing');
  if (hex.length !== 64) throw new Error('ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext.startsWith(PREFIX)) return ciphertext; // plaintext passthrough (backward compat)
  const key = getKey();
  const parts = ciphertext.slice(PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivHex, tagHex, dataHex] = parts;
  const decipher = createDecipheriv(ALG, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(dataHex, 'hex')).toString('utf8') + decipher.final('utf8');
}

// Encrypt a config object → store as { _enc: "enc1:..." }
export function encryptConfig(config: object): { _enc: string } {
  return { _enc: encrypt(JSON.stringify(config)) };
}

// Decrypt config from DB — handles both encrypted and legacy plaintext objects
export function decryptConfig<T>(raw: unknown): T {
  const obj = raw as Record<string, unknown>;
  if (typeof obj._enc === 'string') {
    return JSON.parse(decrypt(obj._enc)) as T;
  }
  return raw as T; // legacy plaintext row — works until re-saved
}
