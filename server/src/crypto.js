import crypto from 'crypto';

/**
 * Generate a cryptographically strong random Case ID.
 * Format: CC-XXXXXXX (e.g., CC-7X4P9K2)
 */
export function generateCaseId() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed ambiguous characters (0, O, 1, I)
  const bytes = crypto.randomBytes(7);
  let id = '';
  for (let i = 0; i < 7; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return `CC-${id}`;
}

/**
 * Generate a cryptographically strong 6-digit random PIN.
 * e.g., "482913"
 */
export function generatePin() {
  const pinNumber = crypto.randomInt(100000, 999999);
  return pinNumber.toString();
}

/**
 * Hash PIN with a salt using SHA-256
 */
export function hashPin(pin, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.createHmac('sha256', salt).update(pin.trim()).digest('hex');
  return { hash, salt };
}

/**
 * Verify a PIN against stored hash and salt
 */
export function verifyPin(inputPin, storedHash, salt) {
  if (!inputPin || !storedHash || !salt) return false;
  const { hash } = hashPin(inputPin, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}
