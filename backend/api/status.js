/**
 * api/status.js
 * GET /api/status?email=... — Consulta de status por e-mail.
 *
 * Fluxo:
 *   1. Verificação de método HTTP (somente GET)
 *   2. Aplicação de CORS
 *   3. Extração e validação do parâmetro ?email=
 *   4. Busca do usuário no banco de dados
 *   5. Retorno dos dados de posição, tier e benefícios
 */

import { applyCORS, sendSuccess, sendError } from '../src/config/cors.js';
import { getBenefitsByTier } from '../src/services/rewardsService.js';
import { prisma } from '../src/database/prisma.js';

export default async function handler(req, res) {
  // 1. CORS — encerra se for preflight OPTIONS
  if (applyCORS(req, res)) return;

  // 2. Verificação de método
  if (req.method !== 'GET') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  // 3. Extração e validação do parâmetro e-mail
  const rawEmail = req.query?.email;

  if (!rawEmail || typeof rawEmail !== 'string') {
    return sendError(
      res,
      "Parâmetro 'email' é obrigatório na query string.",
      'MISSING_EMAIL',
      400
    );
  }

  const email = rawEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return sendError(
      res,
      "Parâmetro 'email' inválido.",
      'INVALID_EMAIL',
      400
    );
  }

  try {
    // 4. Busca do usuário no banco de dados
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
      return sendError(
        res,
        'Nenhuma inscrição encontrada para este e-mail.',
        'USER_NOT_FOUND',
        404
      );
    }

    // 5. Construção da resposta
    const rewards = getBenefitsByTier(user.tier);

    console.log(`[status] Consulta para: ${email} — #${user.queuePosition} — ${user.tier}`);

    return sendSuccess(res, {
      data: {
        fullName: user.fullName,
        email: user.email,
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
    console.error('[status] Erro interno:', err.message ?? err);
    return sendError(
      res,
      'Erro interno do servidor. Tente novamente em instantes.',
      'INTERNAL_ERROR',
      500
    );
  }
}
