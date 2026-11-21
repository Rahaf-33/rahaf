/** Password hashing with the browser's Web Crypto API (PBKDF2-SHA256). */
export const PBKDF2_ITERATIONS = 120_000;

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export function randomSalt(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return toHex(a.buffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('secure-context-required');
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

/** Constant-time comparison of two hex strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Returns an Arabic error key (translated in the UI) or null when the password is acceptable. */
export function passwordProblem(pw: string, username?: string): string | null {
  if (pw.length < 8) return 'كلمة المرور يجب ألا تقل عن 8 أحرف';
  if (!/[A-Za-z؀-ۿ]/.test(pw) || !/\d/.test(pw)) return 'كلمة المرور يجب أن تحتوي على حروف وأرقام';
  if (username && pw.toLowerCase().includes(username.toLowerCase())) return 'كلمة المرور يجب ألا تحتوي على اسم المستخدم';
  return null;
}

export const MAX_ATTEMPTS = 5;
export const LOCK_MS = 60_000;
export const SESSION_MS = 8 * 60 * 60 * 1000;
