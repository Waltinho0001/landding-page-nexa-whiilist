/**
 * api/status.js — GET /api/status?email=
 * Proteção contra enumeração de e-mail (mesma estrutura found/not found).
 */

import { applyCORS, sendSuccess, sendError } from '../src/config/cors.js';
import { validateStatusQuery } from '../src/utils/validation.js';
import { getBenefitsByTier } from '../src/services/rewardsService.js';
import { prisma } from '../src/database/prisma.js';

const NOT_FOUND_PAYLOAD = {
  message: 'Consulta processada.',
  data: {
    found: false,
    position: null,
    tier: null,
    benefits: null,
  },
};

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  const validation = validateStatusQuery({ email: req.query?.email });
  if (!validation.success) {
    return sendError(res, validation.message, 'INVALID_EMAIL', 400);
  }

  const { email } = validation.data;

  try {
    const user = await prisma.betaUser.findUnique({
      where: { email },
      select: {
        fullName: true,
        email: true,
        queuePosition: true,
        tier: true,
        premiumMonths: true,
        lifetimeDiscount: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.info('[status] Query completed — not found');
      return sendSuccess(res, NOT_FOUND_PAYLOAD);
    }

    const rewards = getBenefitsByTier(user.tier);
    console.info('[status] Query completed — found');

    const nameParts = user.fullName ? user.fullName.trim().split(/\s+/) : [''];
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : nameParts[0].substring(0, 2).toUpperCase();

    return sendSuccess(res, {
      message: 'Consulta processada.',
      data: {
        found: true,
        initials,
        position: user.queuePosition,
        tier: user.tier,
        registeredAt: user.createdAt,
        benefits: {
          premiumMonths: user.premiumMonths,
          lifetimeDiscount: user.lifetimeDiscount,
          label: rewards.label,
          perks: rewards.perks,
        },
      },
    });
  } catch (err) {
    console.error('[status] Internal error');
    return sendError(
      res,
      'Erro ao consultar status. Tente novamente em instantes.',
      'INTERNAL_ERROR',
      500
    );
  }
}
