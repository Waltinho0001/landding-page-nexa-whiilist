/**
 * api/admin/stats.js — GET /api/admin/stats
 * Returns aggregate statistics for beta users.
 * Uses shared CORS, auth, and response helpers for consistency.
 */

import { applyCORS, sendSuccess, sendError } from '../../src/config/cors.js';
import { withAdminAuth } from './auth.js';
import { prisma } from '../../src/database/prisma.js';

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  return withAdminAuth(req, res, async () => {
    try {
      const total = await prisma.betaUser.count();

      // Distribution by tier (ensure known tiers are present)
      const ALL_TIERS = ['ELITE', 'FOUNDER', 'OBSERVER'];
      const tierCounts = await prisma.betaUser.groupBy({
        by: ['tier'],
        _count: { _all: true },
      });
      const distributionByTier = ALL_TIERS.reduce((acc, tier) => {
        acc[tier] = 0;
        return acc;
      }, {});
      tierCounts.forEach((item) => {
        distributionByTier[item.tier] = item._count._all;
      });

      // Recent sign-ups (last 5)
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
      console.error('[admin/stats] Error');
      return sendError(res, 'Erro ao recuperar métricas.', 'STATS_ERROR', 500);
    }
  });
}
