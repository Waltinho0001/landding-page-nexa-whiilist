/**
 * src/config/cors.js
 * Headers CORS e utilitários de resposta padronizados.
 */

const ALLOWED_ORIGINS = [
  process.env.DOMAIN || '',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:3001',
].filter(Boolean);

/**
 * Retorna os headers CORS para uma request específica.
 * Usa lista de origens permitidas em vez de '*' por segurança.
 *
 * @param {object} req - Objeto request do Vercel/Node
 * @returns {object} headers CORS
 */
export function getCORSHeaders(req) {
  const origin = req?.headers?.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Aplica headers CORS à resposta e verifica se é um preflight OPTIONS.
 * Retorna true se a resposta já foi encerrada (preflight).
 *
 * @param {object} req
 * @param {object} res
 * @returns {boolean} true se for preflight e a resposta já foi encerrada
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
 * Envia uma resposta JSON padronizada de sucesso.
 *
 * @param {object} res
 * @param {object} data
 * @param {number} statusCode
 */
export function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    ...data,
  });
}

/**
 * Envia uma resposta JSON padronizada de erro.
 *
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
