import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * 1. RATE LIMITING ENGINE (DDoS & Brute-Force Defense)
 */

// Standard Rate Limit JSON Response Format
const createRateLimitHandler = (message, code = 'RATE_LIMIT_EXCEEDED') => (req, res) => {
  res.status(429).json({
    success: false,
    error: message,
    code,
    retryAfter: res.getHeader('Retry-After') || 60
  });
};

// General API Limiter: 300 requests per 15 minutes per IP
export const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many requests from this IP. Please slow down and try again later.')
});

// Authentication Brute-Force Limiter: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many login attempts. Account access throttled for 15 minutes for security.', 'AUTH_THROTTLED')
});

// PIN Verification Brute-Force Limiter: 10 attempts per 15 minutes per IP
export const pinVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many PIN verification attempts. Case access throttled for 15 minutes to protect case privacy.', 'PIN_THROTTLED')
});

// Report Submission Spam Limiter: 15 submissions per 10 minutes per IP
export const reportSubmissionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Report submission rate limit reached. Please wait a few minutes before submitting another report.', 'SUBMISSION_THROTTLED')
});

// File Upload Limiter: 20 uploads per 15 minutes per IP
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Upload limit reached. Please wait before uploading more evidence.', 'UPLOAD_THROTTLED')
});

/**
 * 2. HTTP SECURITY HEADERS (OWASP Best Practice via Helmet)
 */
export const configureSecurityHeaders = () => {
  return helmet({
    // Allow frontend SPA to load uploaded evidence preview images across origins
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Managed at gateway/SPA level to allow dynamic asset loading
    xssFilter: true,
    noSniff: true,
    frameguard: { action: 'deny' }, // Clickjacking defense
    hidePoweredBy: true // Prevent server fingerprinting
  });
};

/**
 * 3. INPUT SANITIZATION & INJECTION DEFENSE (XSS & Prototype Pollution)
 */

// Recursive sanitization of strings and objects
function sanitizeValue(val) {
  if (typeof val === 'string') {
    // Strip script tags, javascript: pseudo-protocols, and null bytes
    return val
      .replace(/\0/g, '') // Null byte injection
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Script tags
      .replace(/javascript:/gi, '') // javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // inline on* event handlers (e.g. onerror=, onload=)
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val !== null && typeof val === 'object') {
    const cleanObj = {};
    for (const key of Object.keys(val)) {
      // Prototype Pollution Prevention: block __proto__, constructor, prototype keys
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleanObj[key] = sanitizeValue(val[key]);
    }
    return cleanObj;
  }
  return val;
}

export const sanitizeInputs = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * 4. PARAMETER VALIDATION HELPERS
 */

// Validate Case ID format: must be CC- followed by 6 to 12 alphanumeric characters
export const isValidCaseId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^CC-[A-Z0-9]{4,16}$/i.test(id.trim());
};

// Validate 6-digit PIN format
export const isValidPin = (pin) => {
  if (!pin || typeof pin !== 'string') return false;
  return /^\d{6}$/.test(pin.trim());
};

/**
 * 5. CENTRALIZED ERROR HANDLING MIDDLEWARE
 */

// 404 Handler for undefined API routes
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND'
  });
};

// Global Error Handler for Express
export const globalErrorHandler = (err, req, res, next) => {
  // Catch JSON parsing syntax errors (e.g., malformed POST payload)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body.',
      code: 'BAD_REQUEST_JSON'
    });
  }

  // Catch Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds maximum allowed limit (10MB).',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
      code: 'UPLOAD_ERROR'
    });
  }

  // Log server error securely (without leaking stack traces to client)
  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500
    ? 'An internal server error occurred. Please try again later.'
    : err.message || 'Request failed';

  return res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
};
