/**
 * api/admin/list.js — GET /api/admin/list?page=&limit=&tier=
 */

import { applyCORS, sendSuccess, sendError } from '../../src/config/cors.js';
import { validateAdminListQuery } from '../../src/utils/validation.js';
import { withAdminAuth } from './auth.js';
import { prisma } from '../../src/database/prisma.js';

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  return withAdminAuth(req, res, async () => {
    const parsed = validateAdminListQuery(req.query);
    if (!parsed.success) {
      return sendError(res, parsed.message, 'INVALID_QUERY', 400);
    }

    const { page, limit, tier } = parsed.data;
    const whereClause = tier ? { tier } : {};
    const skip = (page - 1) * limit;

    try {
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
            consent: true,
            consentVersion: true,
            consentDate: true,
            createdAt: true,
            lossExperience: true,
          },
        }),
        prisma.betaUser.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

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
      console.error('[admin/list] Error');
      return sendError(res, 'Erro ao recuperar lista.', 'LIST_ERROR', 500);
    }
  });
}
