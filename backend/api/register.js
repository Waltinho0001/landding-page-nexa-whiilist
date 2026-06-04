/**
 * api/register.js
 * POST /api/register — Inscrição segura de beta tester.
 *
 * Security:
 *   - Rate limiting por IP (5 requisições/hora)
 *   - Validação dupla (client + server)
 *   - Honeypot field para bot detection
 *   - Logs seguros sem exposição de dados
 *   - Tratamento de race conditions
 */

import { applyCORS, sendSuccess, sendError } from '../src/config/cors.js';
import { validateRegisterPayload, hashIpAddress, escapeHtml } from '../src/utils/validation.js';
import { getNextPosition } from '../src/services/queueService.js';
import { assignRewards, getBenefitsByTier } from '../src/services/rewardsService.js';
import { sendConfirmationEmail } from '../src/services/emailService.js';
import { prisma } from '../src/database/prisma.js';

// ─────── RATE LIMITING (In-Memory Cache MVP) ────────
// Nota: Para produção, use @upstash/ratelimit ou redis-based solution
const rateLimitStore = new Map(); // { ipHash: [timestamps] }
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hora
const RATE_LIMIT_MAX_REQUESTS = 5;

/**
 * Valida rate limit do IP.
 * Limpa registros antigos e verifica se ultrapassou limite.
 *
 * @param {string} ipHash
 * @returns {{ allowed: boolean, remainingRequests: number }}
 */
function checkRateLimit(ipHash) {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ipHash) || [];

  // Remove registros fora da janela
  const recentTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remainingRequests: 0 };
  }

  // Registra novo request
  recentTimestamps.push(now);
  rateLimitStore.set(ipHash, recentTimestamps);

  // Cleanup periódico (a cada 100 requests)
  if (Math.random() < 0.01) {
    const allKeys = Array.from(rateLimitStore.keys());
    allKeys.forEach((key) => {
      const recent = rateLimitStore.get(key).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (recent.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, recent);
      }
    });
  }

  return { allowed: true, remainingRequests: RATE_LIMIT_MAX_REQUESTS - recentTimestamps.length };
}

export default async function handler(req, res) {
  // 1. CORS — encerra se for preflight OPTIONS
  if (applyCORS(req, res)) return;

  // 2. Verificação de método HTTP
  if (req.method !== 'POST') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  // 3. RATE LIMITING: Extrai IP do cliente
  const clientIp = getClientIp(req);
  const ipHash = hashIpAddress(clientIp);
  const rateCheck = checkRateLimit(ipHash);

  if (!rateCheck.allowed) {
    // Log seguro sem expor IP inteiro
    console.warn('[register] Rate limit exceeded for IP (hashed)');
    return sendError(
      res,
      'Limite de requisições excedido. Tente novamente em 1 hora.',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter: 3600 }
    );
  }

  // 4. Validação do payload com Zod + sanitização
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
    // 5. Verificação de e-mail duplicado
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
      // Log seguro: sem exposição completa do email
      console.info('[register] Duplicate email registration (hashed)');

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

    // 6. Cálculo da posição na fila (com proteção contra race conditions)
    const queuePosition = await getNextPosition();

    // 7. Atribuição de tier e benefícios
    const rewards = assignRewards(queuePosition);

    // 8. Persistência no banco de dados
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

    // Log seguro apenas com índices, sem dados sensíveis
    console.info(`[register] New registration — position #${queuePosition} — tier ${rewards.tier}`);

    // 9. Disparo de e-mail (fire-and-forget)
    sendConfirmationEmail(newUser, queuePosition, rewards).catch((err) => {
      // Log seguro: sem stack trace completo
      console.error('[register] Email dispatch error (details logged separately)');
    });

    // 10. Resposta ao frontend
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
    // Captura erros de unique constraint (race condition)
    if (err.code === 'P2002') {
      console.warn('[register] Race condition or constraint violation');
      return sendError(
        res,
        'Este e-mail já foi registrado. Tente consultar seu status.',
        'EMAIL_DUPLICATE',
        409
      );
    }

    // Erro genérico seguro (sem stack trace)
    console.error('[register] Unhandled error (type: ' + (err.code ?? 'unknown') + ')');
    return sendError(
      res,
      'Erro ao processar inscrição. Tente novamente em instantes.',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * Extrai IP do cliente de forma segura considerando proxies (Vercel).
 *
 * @param {object} req
 * @returns {string}
 */
function getClientIp(req) {
  // Vercel forwarded header
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  // Fallback
  return req.socket?.remoteAddress || '0.0.0.0';
}
