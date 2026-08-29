/**
 * Lightweight HMAC-signed session cookie. Uses Web Crypto (SubtleCrypto) so
 * the same implementation runs in both the Edge middleware and Node route
 * handlers — no extra auth library needed for a single shared passcode.
 */

export const SESSION_COOKIE = "lb_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(s: string): Uint8Array {
  const normalized = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createSessionToken(secret: string): Promise<string> {
  const payload = { exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 };
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, payloadBytes));
  return `${base64url(payloadBytes)}.${base64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null, secret: string): Promise<boolean> {
  if (!token) return false;
  const [payloadPart, sigPart] = token.split(".");
  if (!payloadPart || !sigPart) return false;
  try {
    const payloadBytes = base64urlToBytes(payloadPart);
    const sigBytes = base64urlToBytes(sigPart);
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes as BufferSource, payloadBytes as BufferSource);
    if (!valid) return false;
    const payload = JSON.parse(decoder.decode(payloadBytes)) as { exp: number };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/** Constant-time string compare so passcode checks don't leak timing info. */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}
