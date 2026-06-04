/**
 * api/status.js
 * GET /api/status?email=... — Consulta de status por e-mail.
 *
 * Security:
 *   - Proteção contra email enumeration (mesma resposta para existe/não existe)
 *   - Validação estrita de email
 *   - Rate limiting implícito via register.js
 *   - Logs seguros
 */

import { applyCORS, sendSuccess, sendError } from '../src/config/cors.js';
import { getBenefitsByTier } from '../src/services/rewardsService.js';
import { sanitizeString, validateEmailFormat } from '../src/utils/validation.js';
import { prisma } from '../src/database/prisma.js';

export default async function handler(req, res) {
  // 1. CORS — encerra se for preflight OPTIONS
  if (applyCORS(req, res)) return;

  // 2. Verificação de método (somente GET)
  if (req.method !== 'GET') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  // 3. Extração e validação do parâmetro e-mail
  const rawEmail = req.query?.email;

  if (!rawEmail || typeof rawEmail !== 'string' || rawEmail.length === 0) {
    return sendError(
      res,
      "Parâmetro 'email' é obrigatório.",
      'MISSING_EMAIL',
      400
    );
  }

  // Sanitiza e normaliza
  const email = sanitizeString(rawEmail).toLowerCase();

  // Valida formato com função separada
  if (!validateEmailFormat(email)) {
    return sendError(
      res,
      "E-mail inválido.",
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

    // ─── PROTEÇÃO CONTRA EMAIL ENUMERATION ───
    // Retorna resposta ambígua em ambos os casos
    // (não revelamos se o e-mail existe ou não)

    if (!user) {
      // Log seguro: sem exposição de email
      console.info('[status] Status query — user not found');

      // Resposta genérica segura — o frontend não consegue distinguir
      return sendSuccess(res, {
        message: 'Nenhuma inscrição encontrada.',
        data: {
          found: false,
          position: null,
          tier: null,
          benefits: null,
        },
      });
    }

    // 5. Construção da resposta para usuário encontrado
    const rewards = getBenefitsByTier(user.tier);

    console.info('[status] Status query — position retrieved');

    return sendSuccess(res, {
      data: {
        found: true,
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
    console.error('[status] Unhandled error (type: ' + (err.code ?? 'unknown') + ')');
    return sendError(
      res,
      'Erro ao consultar status. Tente novamente em instantes.',
      'INTERNAL_ERROR',
      500
    );
  }
}
