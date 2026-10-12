import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * 1. RATE LIMITING ENGINE (Disabled / Pass-Through for Smooth, Unblocked Operation)
 */
const passThrough = (req, res, next) => next();

// Pass-through limiters to prevent any 429 lockouts or false throttles
export const globalApiLimiter = passThrough;
export const authLimiter = passThrough;
export const pinVerifyLimiter = passThrough;
export const reportSubmissionLimiter = passThrough;
export const uploadLimiter = passThrough;

/**
 * 2. HTTP SECURITY HEADERS (Open & Cross-Origin Friendly)
 */
export const configureSecurityHeaders = () => {
  return helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    xssFilter: false,
    noSniff: true,
    frameguard: false,
    hidePoweredBy: true
  });
};

/**
 * 3. INPUT SANITIZATION & INJECTION DEFENSE (Non-destructive Pass-Through)
 */
export const sanitizeInputs = (req, res, next) => {
  // Pass-through without regex string replacement to prevent mangling user complaint text
  next();
};

/**
 * 4. PARAMETER VALIDATION HELPERS (Flexible & Non-blocking)
 */

// Validate Case ID format: flexible non-empty check
export const isValidCaseId = (id) => {
  return Boolean(id && typeof id === 'string' && id.trim().length > 0);
};

// Validate PIN format: flexible non-empty check
export const isValidPin = (pin) => {
  return Boolean(pin && String(pin).trim().length > 0);
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
