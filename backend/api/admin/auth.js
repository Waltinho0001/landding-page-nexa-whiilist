/**
 * api/admin/auth.js
 * Middleware de verificação do ADMIN_SECRET para rotas administrativas.
 * Implementa timing-safe comparison para proteger contra timing attacks.
 *
 * Uso:
 *   import { withAdminAuth } from './auth.js';
 *
 *   export default async function handler(req, res) {
 *     return withAdminAuth(req, res, async () => {
 *       // lógica da rota protegida
 *     });
 *   }
 */

import { sendError } from '../../src/config/cors.js';
import { timingSafeEqual, randomBytes } from 'crypto';

const ADMIN_SECRET = process.env.ADMIN_SECRET;
const MIN_SECRET_LENGTH = 32; // 256 bits

/**
 * Verifica se o ADMIN_SECRET está configurado e atende requisitos mínimos.
 * @returns {boolean}
 */
export function isAdminSecretConfigured() {
  return !!ADMIN_SECRET && ADMIN_SECRET.length >= MIN_SECRET_LENGTH;
}

/**
 * Comparação timing-safe entre tokens.
 * Protege contra timing attacks que revelam tamanho/padrão do token válido.
 *
 * @param {string} providedToken - Token da requisição
 * @param {string} expectedToken - Token esperado
 * @returns {boolean}
 */
function compareTokens(providedToken, expectedToken) {
  try {
    // Ambos devem ser strings
    if (typeof providedToken !== 'string' || typeof expectedToken !== 'string') {
      return false;
    }

    // Ambos devem ter o mesmo tamanho (evita variação de timing)
    if (providedToken.length !== expectedToken.length) {
      return false;
    }

    // Comparação timing-safe
    return timingSafeEqual(
      Buffer.from(providedToken, 'utf-8'),
      Buffer.from(expectedToken, 'utf-8')
    );
  } catch (err) {
    // timingSafeEqual lança erro se os buffers não têm o mesmo tamanho
    return false;
  }
}

/**
 * Middleware de autenticação para rotas admin.
 * Verifica o header Authorization: Bearer <token>
 *
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} handler - Handler a ser executado se autenticado
 * @returns {Promise<any>}
 */
export async function withAdminAuth(req, res, handler) {
  // Verifica se o secret está configurado
  if (!isAdminSecretConfigured()) {
    console.error(
      '[admin/auth] ADMIN_SECRET not configured or too short (min ' + MIN_SECRET_LENGTH + ' chars)'
    );
    return sendError(
      res,
      'Configuração de servidor inválida.',
      'SERVER_MISCONFIGURED',
      500
    );
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.warn('[admin/auth] Missing authorization header');
    return sendError(
      res,
      'Token de acesso não fornecido.',
      'UNAUTHORIZED',
      401
    );
  }

  // Espera formato: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.warn('[admin/auth] Invalid authorization format');
    return sendError(
      res,
      'Formato de autorização inválido. Use: Bearer <token>',
      'INVALID_AUTH_FORMAT',
      401
    );
  }

  const token = parts[1];

  // Comparação timing-safe
  const isValid = compareTokens(token, ADMIN_SECRET);

  if (!isValid) {
    // Log seguro: não expõe token
    console.warn('[admin/auth] Invalid token attempt');
    return sendError(
      res,
      'Token de acesso inválido.',
      'UNAUTHORIZED',
      401
    );
  }

  // Token válido — executa o handler
  try {
    return await handler();
  } catch (err) {
    console.error('[admin/auth] Handler error (type: ' + (err.code ?? 'unknown') + ')');
    throw err;
  }
}