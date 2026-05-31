 /**
 * api/admin/list.js
 * GET /api/admin/list — Listagem paginada e filtrada de beta testers.
 *
 * Query params:
 *   - page: número da página (default: 1)
 *   - limit: itens por página (default: 20, max: 100)
 *   - tier: filtro por tier (opcional: FOUNDER, ELITE, COLLABORATOR, OBSERVER)
 *
 * Retorna:
 *   { success: true, data: { items, total, page, totalPages } }
 */

import { applyCORS, sendSuccess, sendError } from '../../src/config/cors.js';
import { withAdminAuth } from './auth.js';
import { prisma } from '../../src/database/prisma.js';

const VALID_TIERS = ['FOUNDER', 'ELITE', 'COLLABORATOR', 'OBSERVER'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Valida e converte um valor para inteiro positivo.
 * @param {string|number} value
 * @param {number} defaultValue
 * @returns {number}
 */
function parsePositiveInt(value, defaultValue) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) {
    return defaultValue;
  }
  return parsed;
}

export default async function handler(req, res) {
  // CORS
  if (applyCORS(req, res)) return;

  // Apenas GET
  if (req.method !== 'GET') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  // Autenticação admin
  return withAdminAuth(req, res, async () => {
    try {
      // Parse dos query params
      const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
      let limit = parsePositiveInt(req.query.limit, DEFAULT_LIMIT);

      // Limita ao máximo permitido
      if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
      }

      // Filtro por tier (opcional)
      const tierFilter = req.query.tier;
      let whereClause = {};

      if (tierFilter) {
        if (!VALID_TIERS.includes(tierFilter.toUpperCase())) {
          return sendError(
            res,
            `Tier inválido. Valores permitidos: ${VALID_TIERS.join(', ')}`,
            'INVALID_TIER',
            400
          );
        }
        whereClause.tier = tierFilter.toUpperCase();
      }

      // Calcula offset para paginação
      const skip = (page - 1) * limit;

      // Busca registros com paginação
      const [items, total] = await Promise.all([
        prisma.betaUser.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { queuePosition: 'asc' },
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            socialMedia: true,
            profession: true,
            queuePosition: true,
            tier: true,
            premiumMonths: true,
            lifetimeDiscount: true,
            createdAt: true,
          },
        }),
        prisma.betaUser.count({
          where: whereClause,
        }),
      ]);

      // Calcula total de páginas
      const totalPages = Math.ceil(total / limit);

      return sendSuccess(res, {
        message: 'Lista recuperada com sucesso.',
        data: {
          items,
          total,
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (err) {
      console.error('[admin/list] Erro ao listar usuários:', err.message);
      return sendError(
        res,
        'Erro ao recuperar lista de usuários.',
        'LIST_ERROR',
        500
      );
    }
  });
}