// lib/obfuscator.ts
export function xorKey(): number {
  // PHP used decbin(7) in XOR; decbin(7) => "111" which coerces to 111 when used in XOR.
  return 111;
}

/**
 * randstr() - reproduce PHP randstr() behaviour exactly.
 * Observed behaviour: randstr() ALWAYS returns a 6-character hex string
 * (after PHP's post-processing), so we implement the same.
 */
export function randstr(): string {
  const now = new Date();
  const H = now.getHours();
  const i = now.getMinutes();
  const s = now.getSeconds();

  const sum = H + i + s;
  const str = String(sum);

  let r = '';
  for (let idx = 0; idx < str.length; idx++) {
    const ch = str.charCodeAt(idx);
    const x = ch ^ xorKey();
    let hx = x.toString(16);
    if (hx.length === 1) hx = '0' + hx;
    r += hx;
  }

  // PHP adjustments cause final length to be 6 in practice.
  if (r.length === 2) {
    r = String(48) + r + '00'; // "48" + r + "00"
  } else if (r.length === 4) {
    r = r + String(48); // r + "48"
  }

  // At this point r.length should be 6 (or still 6)
  return r;
}

/**
 * encodestr - encode plaintext to obfuscated hex string (compatible with PHP Encodestr)
 */
export function encodestr(s: string): string {
  let r = randstr(); // prefix 6 chars
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    const x = code ^ xorKey(); // XOR with 111
    let hx = x.toString(16);
    if (hx.length === 1) hx = '0' + hx; // pad to 2 hex chars
    r += hx + randstr(); // add encoded byte (2) + randstr (6)
  }
  return r;
}

/**
 * decodestr - properly decode the obfuscated string by skipping randstr blocks.
 * This function:
 *  - returns '' for empty/short input
 *  - removes the first 6 chars (prefix)
 *  - then reads in steps: [2 hex chars -> decode] + skip 6 chars (randstr)
 *
 * The result is the clean plaintext (no padding noise).
 */
export function decodestr(s: string): string {
  if (!s || s.length <= 6) return '';

  const trimmed = s.slice(6); // remove prefix
  let out = '';

  // Each encoded char is stored as: 2 hex chars + 6 hex chars (randstr) => 8 chars per char
  const blockSize = 8;
  const blocks = Math.floor(trimmed.length / blockSize);

  for (let b = 0; b < blocks; b++) {
    const byteHex = trimmed.substr(b * blockSize, 2); // first 2 chars of block
    // safety check
    if (!/^[0-9a-fA-F]{2}$/.test(byteHex)) break;
    const val = parseInt(byteHex, 16);
    const orig = val ^ xorKey();
    out += String.fromCharCode(orig);
  }

  // In some malformed/legacy cases the trimmed length might not be exactly multiple of 8,
  // so attempt a final pass for remaining pairs (fallback)
  const remStart = blocks * blockSize;
  for (let i = remStart; i + 1 < trimmed.length; i += 2) {
    const hexPair = trimmed.substr(i, 2);
    if (!/^[0-9a-fA-F]{2}$/.test(hexPair)) break;
    const val = parseInt(hexPair, 16);
    const orig = val ^ xorKey();
    out += String.fromCharCode(orig);
  }

  return out;
}

/**
 * decryptForClient - top-level helper that accepts stored DB value (possibly plain or obfuscated)
 * and returns the clean plaintext (email/mobile or original value if decoding not applicable).
 */
export function decryptForClient(stored: string | null | undefined): string {
  if (!stored) return '';
  if (typeof stored !== 'string') return String(stored);
  
  // If it already looks like a plain email, return as-is
  if (stored.includes('@')) return stored;
  
  // If it looks like a plain mobile number (10 digits), return as-is
  if (/^\d{10}$/.test(stored)) return stored;

  // If looks hex-like, attempt decoding using decodestr
  if (/^[0-9a-fA-F]+$/.test(stored) && stored.length >= 8) {
    const decoded = decodestr(stored);
    // Return the decoded value (could be email, mobile, or any other data)
    return decoded;
  }

  return stored;
}

/**
 * encryptForStorage - high-level wrapper to obfuscate plain text (email/mobile/etc) for DB storage.
 */
export function encryptForStorage(plain: string | null | undefined): string {
  if (!plain) return '';
  return encodestr(String(plain));
}

export default {
  xorKey,
  randstr,
  encodestr,
  decodestr,
  decryptForClient,
  encryptForStorage,
};
