/**
 * api/register.js
 * POST /api/register — Inscrição completa de beta tester.
 *
 * Fluxo:
 *   1. Verificação de método HTTP
 *   2. Aplicação de CORS
 *   3. Validação do payload com Zod
 *   4. Verificação de e-mail duplicado
 *   5. Cálculo da posição na fila
 *   6. Atribuição de tier e benefícios
 *   7. Persistência no PostgreSQL via Prisma
 *   8. Disparo de e-mail (não-bloqueante, fire-and-forget)
 *   9. Resposta ao frontend
 */

import { applyCORS, sendSuccess, sendError } from '../src/config/cors.js';
import { validateRegisterPayload } from '../src/utils/validation.js';
import { getNextPosition } from '../src/services/queueService.js';
import { assignRewards, getBenefitsByTier } from '../src/services/rewardsService.js';
import { sendConfirmationEmail } from '../src/services/emailService.js';
import { prisma } from '../src/database/prisma.js';

export default async function handler(req, res) {
  // 1. CORS — encerra se for preflight OPTIONS
  if (applyCORS(req, res)) return;

  // 2. Verificação de método
  if (req.method !== 'POST') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  // 3. Validação do payload com Zod
  const validation = validateRegisterPayload(req.body);
  if (!validation.success) {
    return sendError(
      res,
      validation.message,
      'INVALID_PAYLOAD',
      400,
      validation.details
    );
  }

  const { fullName, email, phone, socialMedia, profession, consent, consentVersion } = validation.data;

  try {
    // 4. Verificação de e-mail duplicado
    const existingUser = await prisma.betaUser.findUnique({
      where: { email },
      select: {
        id: true,
        fullName: true,
        email: true,
        queuePosition: true,
        tier: true,
        premiumMonths: true,
        lifetimeDiscount: true,
        createdAt: true,
      },
    });

    if (existingUser) {
      const rewards = getBenefitsByTier(existingUser.tier);
      console.log(`[register] E-mail já registrado: ${email} — posição #${existingUser.queuePosition}`);

      return sendSuccess(res, {
        message: 'E-mail já registrado. Aqui estão seus dados de inscrição.',
        data: {
          alreadyRegistered: true,
          position: existingUser.queuePosition,
          tier: existingUser.tier,
          registeredAt: existingUser.createdAt,
          benefits: {
            premiumMonths: existingUser.premiumMonths,
            lifetimeDiscount: existingUser.lifetimeDiscount,
            label: rewards.label,
            perks: rewards.perks,
          },
        },
      });
    }

    // 5. Cálculo da posição na fila
    const queuePosition = await getNextPosition();

    // 6. Atribuição de tier e benefícios
    const rewards = assignRewards(queuePosition);

    // 7. Persistência no banco de dados
    const newUser = await prisma.betaUser.create({
      data: {
        fullName: fullName.trim(),
        email,
        phone: phone || null,
        socialMedia: socialMedia || null,
        profession: profession || null,
        consent,
        queuePosition,
        tier: rewards.tier,
        premiumMonths: rewards.premiumMonths,
        lifetimeDiscount: rewards.lifetimeDiscount,
        consentVersion,
        consentDate: new Date(),
      },
    });

    console.log(`[register] Novo usuário registrado: ${email} — #${queuePosition} — ${rewards.tier}`);

    // 8. Disparo de e-mail (fire-and-forget — não bloqueia a resposta)
    sendConfirmationEmail(newUser, queuePosition, rewards).catch((err) => {
      console.error('[register] Erro não capturado no disparo de e-mail:', err.message);
    });

    // 9. Resposta ao frontend
    return sendSuccess(
      res,
      {
        message: 'Inscrição realizada com sucesso! Verifique seu e-mail.',
        data: {
          alreadyRegistered: false,
          position: queuePosition,
          tier: rewards.tier,
          registeredAt: newUser.createdAt,
          benefits: {
            premiumMonths: rewards.premiumMonths,
            lifetimeDiscount: rewards.lifetimeDiscount,
            label: rewards.label,
            perks: rewards.perks,
          },
        },
      },
      201
    );
  } catch (err) {
    // Captura erros de unique constraint (race condition entre requests)
    if (err.code === 'P2002') {
      console.warn(`[register] Race condition detectada para o e-mail: ${email}`);
      return sendError(
        res,
        'Este e-mail já foi registrado. Tente consultar seu status.',
        'EMAIL_DUPLICATE',
        409
      );
    }

    console.error('[register] Erro interno:', err.message ?? err);
    return sendError(
      res,
      'Erro interno do servidor. Tente novamente em instantes.',
      'INTERNAL_ERROR',
      500
    );
  }
}
