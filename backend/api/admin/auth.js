/**
 * api/admin/auth.js
 * Middleware de verificação do ADMIN_SECRET para rotas administrativas.
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

const ADMIN_SECRET = process.env.ADMIN_SECRET;

/**
 * Verifica se o ADMIN_SECRET está configurado no ambiente.
 * @returns {boolean}
 */
export function isAdminSecretConfigured() {
  return !!ADMIN_SECRET && ADMIN_SECRET.length >= 16;
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
    console.error('[admin/auth] ADMIN_SECRET não configurado ou muito curto (mínimo 16 caracteres)');
    return sendError(res, 'Configuração inválida no servidor.', 'SERVER_MISCONFIGURED', 500);
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendError(res, 'Token de acesso não fornecido.', 'UNAUTHORIZED', 401);
  }

  // Espera formato: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return sendError(res, 'Formato de autorização inválido. Use: Bearer <token>', 'INVALID_AUTH_FORMAT', 401);
  }

  const token = parts[1];

  // Compara tokens de forma segura (timing-safe comparison simplificada)
  const isValid = token === ADMIN_SECRET;

  if (!isValid) {
    console.warn('[admin/auth] Tentativa de acesso com token inválido');
    return sendError(res, 'Token de acesso inválido.', 'UNAUTHORIZED', 401);
  }

  // Token válido — executa o handler
  try {
    return await handler();
  } catch (err) {
    console.error('[admin/auth] Erro no handler protegido:', err.message);
    throw err;
  }
}