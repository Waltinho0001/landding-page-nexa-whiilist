/**
 * api/register.js — POST /api/register
 * Rate limit, honeypot, Zod, Prisma, Resend (fire-and-forget).
 * Referência: SECURITY_AUDIT_CHECKLIST.md
 */

import { applyCORS, sendSuccess, sendError } from '../src/config/cors.js';
import {
  validateRegisterPayload,
  hashIpAddress,
  isHoneypotTriggered,
} from '../src/utils/validation.js';
import { assignRewards, getBenefitsByTier } from '../src/services/rewardsService.js';
import { sendConfirmationEmail } from '../src/services/emailService.js';
import { prisma } from '../src/database/prisma.js';

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 3600000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function checkRateLimit(ipHash) {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ipHash) || [];
  const recentTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false };
  }

  recentTimestamps.push(now);
  rateLimitStore.set(ipHash, recentTimestamps);

  if (Math.random() < 0.01) {
    for (const [key, values] of rateLimitStore.entries()) {
      const recent = values.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (recent.length === 0) rateLimitStore.delete(key);
      else rateLimitStore.set(key, recent);
    }
  }

  return { allowed: true };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress || '0.0.0.0';
}

function fakeHoneypotSuccess(res) {
  const rewards = getBenefitsByTier('OBSERVER');
  return sendSuccess(
    res,
    {
      message: 'Inscrição realizada com sucesso! Verifique seu e-mail.',
      data: {
        alreadyRegistered: false,
        position: 9999,
        tier: 'OBSERVER',
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
}

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  if (isHoneypotTriggered(req.body)) {
    console.info('[register] Honeypot triggered');
    return fakeHoneypotSuccess(res);
  }

  const ipHash = hashIpAddress(getClientIp(req));
  const rateCheck = checkRateLimit(ipHash);

  if (!rateCheck.allowed) {
    console.warn('[register] Rate limit exceeded');
    return sendError(
      res,
      'Limite de requisições excedido. Tente novamente em 1 hora.',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter: 3600 }
    );
  }

  const validation = validateRegisterPayload(req.body);
  if (!validation.success) {
    return sendError(res, validation.message, 'INVALID_PAYLOAD', 400, validation.details);
  }

  const { fullName, email, phone, socialMedia, profession, consent, consentVersion } =
    validation.data;

  try {
    const existingUser = await prisma.betaUser.findUnique({
      where: { email },
      select: {
        queuePosition: true,
        tier: true,
        premiumMonths: true,
        lifetimeDiscount: true,
        createdAt: true,
      },
    });

    if (existingUser) {
      const rewards = getBenefitsByTier(existingUser.tier);
      console.info('[register] Duplicate registration attempt');

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

    const created = await prisma.betaUser.create({
      data: {
        fullName,
        email,
        phone,
        socialMedia,
        profession,
        consent,
        consentVersion,
        consentDate: new Date(),
      },
    });

    const queuePosition = created.queuePosition;
    const rewards = assignRewards(queuePosition);

    const newUser = await prisma.betaUser.update({
      where: { id: created.id },
      data: {
        tier: rewards.tier,
        premiumMonths: rewards.premiumMonths,
        lifetimeDiscount: rewards.lifetimeDiscount,
      },
    });

    console.info(`[register] New signup — tier ${rewards.tier}`);

    sendConfirmationEmail(newUser, queuePosition, rewards).catch(() => {
      console.error('[register] Email dispatch error');
    });

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
    if (err.code === 'P2002') {
      return sendError(
        res,
        'Este e-mail já foi registrado. Tente consultar seu status.',
        'EMAIL_DUPLICATE',
        409
      );
    }

    console.error('[register] Internal error');
    return sendError(
      res,
      'Erro ao processar inscrição. Tente novamente em instantes.',
      'INTERNAL_ERROR',
      500
    );
  }
}
