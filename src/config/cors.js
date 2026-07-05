/**
 * src/config/cors.js
 * CORS restrito (allowlist explícita) e respostas JSON padronizadas.
 * Referência: SECURITY_AUDIT_CHECKLIST.md — CORS sem wildcard.
 */

const ALLOWED_ORIGINS = [
  process.env.DOMAIN?.replace(/\/$/, ''),
  process.env.FRONTEND_URL?.replace(/\/$/, ''),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, '')}` : null,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
].filter(Boolean);

/**
 * @param {object} req
 * @returns {Record<string, string>}
 */
export function getCORSHeaders(req) {
  const origin = req?.headers?.origin || '';
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}

/**
 * @param {object} req
 * @param {object} res
 * @returns {boolean}
 */
export function applyCORS(req, res) {
  const headers = getCORSHeaders(req);
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
}

/**
 * @param {object} res
 * @param {object} payload
 * @param {number} statusCode
 */
export function sendSuccess(res, payload, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    ...payload,
  });
}

/**
 * @param {object} res
 * @param {string} message
 * @param {string} errorCode
 * @param {number} statusCode
 * @param {object|undefined} details
 */
export function sendError(res, message, errorCode, statusCode = 400, details = undefined) {
  const body = {
    success: false,
    message,
    error: errorCode,
  };

  if (details) {
    body.details = details;
  }

  res.status(statusCode).json(body);
}
