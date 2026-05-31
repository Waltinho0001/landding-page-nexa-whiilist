 /**
 * api/admin/stats.js
 * GET /api/admin/stats — Métricas consolidadas dos beta testers.
 *
 * Retorna:
 *   - Total de registros
 *   - Contagem por tier (FOUNDER, ELITE, COLLABORATOR, OBSERVER)
 *   - Últimos 5 registros
 */

import { applyCORS, sendSuccess, sendError } from '../../src/config/cors.js';
import { withAdminAuth } from './auth.js';
import { prisma } from '../../src/database/prisma.js';

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
      // Total de registros
      const totalResult = await prisma.betaUser.aggregate({
        _count: {
          id: true,
        },
      });

      const total = totalResult._count.id;

      // Contagem por tier
      const tierCounts = await prisma.betaUser.groupBy({
        by: ['tier'],
        _count: {
          id: true,
        },
      });

      // Transforma em objeto { FOUNDER: 10, ELITE: 25, ... }
      const distributionByTier = tierCounts.reduce((acc, item) => {
        acc[item.tier] = item._count.id;
        return acc;
      }, {});

      // Garante todos os tiers mesmo se zerados
      const allTiers = ['FOUNDER', 'ELITE', 'COLLABORATOR', 'OBSERVER'];
      for (const tier of allTiers) {
        if (!(tier in distributionByTier)) {
          distributionByTier[tier] = 0;
        }
      }

      // Últimos 5 registros (por createdAt descending)
      const recentSignups = await prisma.betaUser.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          tier: true,
          queuePosition: true,
          createdAt: true,
        },
      });

      return sendSuccess(res, {
        message: 'Métricas recuperadas com sucesso.',
        data: {
          total,
          distributionByTier,
          recentSignups,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('[admin/stats] Erro ao buscar métricas:', err.message);
      return sendError(
        res,
        'Erro ao recuperar métricas.',
        'STATS_ERROR',
        500
      );
    }
  });
}