/**
 * api/admin/auth.js — Middleware timing-safe para ADMIN_SECRET.
 */

import { timingSafeEqual } from 'crypto';
import { sendError } from '../../src/config/cors.js';

const MIN_SECRET_LENGTH = 32;

export function isAdminSecretConfigured() {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && secret.length >= MIN_SECRET_LENGTH;
}

function compareTokens(providedToken, expectedToken) {
  try {
    if (typeof providedToken !== 'string' || typeof expectedToken !== 'string') {
      return false;
    }
    if (providedToken.length !== expectedToken.length) {
      return false;
    }
    return timingSafeEqual(
      Buffer.from(providedToken, 'utf-8'),
      Buffer.from(expectedToken, 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * @param {object} req
 * @param {object} res
 * @param {() => Promise<unknown>} handler
 */
export async function withAdminAuth(req, res, handler) {
  if (!isAdminSecretConfigured()) {
    console.error('[admin/auth] ADMIN_SECRET missing or too short');
    return sendError(res, 'Configuração de servidor inválida.', 'SERVER_MISCONFIGURED', 500);
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return sendError(res, 'Token de acesso não fornecido.', 'UNAUTHORIZED', 401);
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return sendError(res, 'Formato de autorização inválido.', 'INVALID_AUTH_FORMAT', 401);
  }

  if (!compareTokens(parts[1], process.env.ADMIN_SECRET)) {
    console.warn('[admin/auth] Invalid token attempt');
    return sendError(res, 'Token de acesso inválido.', 'UNAUTHORIZED', 401);
  }

  return handler();
}
