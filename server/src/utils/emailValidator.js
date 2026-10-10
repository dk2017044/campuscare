import dns from 'dns/promises';

// Known temporary / disposable fake email domains
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'mailinator.com',
  'trashmail.com',
  'dispostable.com',
  'yopmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'throwawaymail.com',
  'getairmail.com',
  'maildrop.cc'
]);

// In-memory OTP store with 10-minute expiry
const otpStore = new Map();

/**
 * Validates email format, domain validity, and DNS MX records for 100% FREE verification
 * @param {string} email - The email to test
 * @returns {Promise<{ isValid: boolean, error?: string, details?: object }>}
 */
export async function validateEmailAddress(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.' };
  }

  const clean = email.trim().toLowerCase();

  // 1. Strict RFC 5322 regex format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, error: 'Invalid email format. Please check spelling.' };
  }

  const [username, domain] = clean.split('@');

  if (!username || !domain) {
    return { isValid: false, error: 'Email must contain a valid username and domain.' };
  }

  // 2. Reject disposable fake email domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { isValid: false, error: 'Temporary or disposable email services are not permitted.' };
  }

  // 3. Gmail-specific validation
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  if (isGmail) {
    // Gmail usernames: 6-30 chars, alphanumeric + periods, no consecutive dots
    if (username.length < 6 || username.length > 30) {
      return {
        isValid: false,
        error: 'Gmail usernames must be between 6 and 30 characters long.'
      };
    }
    if (/^\.|\.$|\.\./.test(username)) {
      return {
        isValid: false,
        error: 'Gmail username cannot start, end, or contain consecutive dots.'
      };
    }
    if (!/^[a-z0-9.]+$/.test(username)) {
      return {
        isValid: false,
        error: 'Gmail usernames can only contain letters (a-z), numbers (0-9), and periods (.).'
      };
    }
  }

  // 4. DNS MX Record Verification (100% FREE via Node.js native DNS)
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        isValid: false,
        error: `Domain '@${domain}' does not have any active mail exchange (MX) servers configured.`
      };
    }

    return {
      isValid: true,
      cleanEmail: clean,
      details: {
        domain,
        isGmail,
        mxRecordsCount: mxRecords.length,
        primaryServer: mxRecords[0]?.exchange || 'unknown'
      }
    };
  } catch (dnsErr) {
    if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA') {
      return {
        isValid: false,
        error: `Domain '@${domain}' does not exist or has no mail servers. Please enter a valid email.`
      };
    }
    // If local network DNS lookup times out, allow valid regex + domain structure
    return {
      isValid: true,
      cleanEmail: clean,
      details: { domain, isGmail, warning: 'DNS verification skipped due to network timeout' }
    };
  }
}

/**
 * Generate a 6-digit OTP for email verification
 */
export function generateEmailOtp(email) {
  const clean = email.trim().toLowerCase();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(clean, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
  return otp;
}

/**
 * Verify submitted OTP against store
 */
export function verifyEmailOtp(email, submittedOtp) {
  const clean = email.trim().toLowerCase();
  const record = otpStore.get(clean);

  if (!record) {
    return { verified: false, error: 'No OTP requested for this email or OTP expired.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(clean);
    return { verified: false, error: 'OTP has expired. Please request a new verification code.' };
  }

  if (record.otp !== submittedOtp.trim()) {
    return { verified: false, error: 'Incorrect OTP verification code. Please check and try again.' };
  }

  otpStore.delete(clean);
  return { verified: true };
}
