import crypto from 'crypto';

type SealedPayload = {
  iv: string;
  tag: string;
  data: string;
};

function getEncryptionKey(): Buffer {
  const encoded = process.env.YOUTUBE_TOKEN_ENCRYPTION_KEY;
  if (!encoded) {
    throw new Error('Missing YOUTUBE_TOKEN_ENCRYPTION_KEY. Set it in apps/web/.env.local.');
  }
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) {
    throw new Error('YOUTUBE_TOKEN_ENCRYPTION_KEY must be base64 for 32 bytes.');
  }
  return key;
}

export function sealSecret(value: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload: SealedPayload = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  };
  return JSON.stringify(payload);
}

export function openSecret(payload: string): string {
  const key = getEncryptionKey();
  let parsed: SealedPayload;
  try {
    parsed = JSON.parse(payload) as SealedPayload;
  } catch {
    throw new Error('Invalid encrypted payload.');
  }
  const iv = Buffer.from(parsed.iv, 'base64');
  const tag = Buffer.from(parsed.tag, 'base64');
  const data = Buffer.from(parsed.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}
