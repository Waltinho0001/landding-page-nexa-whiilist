/**
 * api/register.js — POST /api/register
 * Rate limit, honeypot, Zod, Prisma, Resend (fire-and-forget).
 * Referência: SECURITY_AUDIT_CHECKLIST.md
 * Compatível com Vercel Serverless Functions + ES Modules
 */

import { applyCORS, sendSuccess, sendError } from '../src/config/cors.js';
import {
  validateRegisterPayload,
  hashIpAddress,
  isHoneypotTriggered,
  escapeHtml,
} from '../src/utils/validation.js';
import { assignRewards, getBenefitsByTier } from '../src/services/rewardsService.js';
import { sendConfirmationEmail } from '../src/services/emailService.js';
import { prisma } from '../src/database/prisma.js';

// Configurações de Rate Limiting (MVP in-memory)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hora
const RATE_LIMIT_MAX_REQUESTS = 5;

/**
 * Verifica rate limiting por IP hash
 * @param {string} ipHash - Hash SHA256 do IP do cliente
 * @returns {{ allowed: boolean }}
 */
function checkRateLimit(ipHash) {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ipHash) || [];
  const recentTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false };
  }

  recentTimestamps.push(now);
  rateLimitStore.set(ipHash, recentTimestamps);

  // Cleanup ocasional para evitar memory leak (1% de chance)
  if (Math.random() < 0.01) {
    for (const [key, values] of rateLimitStore.entries()) {
      const recent = values.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (recent.length === 0) rateLimitStore.delete(key);
      else rateLimitStore.set(key, recent);
    }
  }

  return { allowed: true };
}

/**
 * Extrai o IP do cliente de forma segura, considerando proxies (Vercel, Cloudflare, etc.)
 * Retorna o IP bruto (não hash) para que a camada de rate‑limiting possa aplicar o hash separadamente.
 */
function getClientIp(req) {
  // Tenta obter IP dos headers de proxy (ordem de prioridade)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];

  let ip = '';

  if (forwarded) {
    // x-forwarded-for pode ter múltiplos IPs: "client, proxy1, proxy2"
    ip = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  } else if (cfConnectingIp) {
    ip = cfConnectingIp;
  } else {
    // Fallback para conexão direta
    ip = req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
  }

  // Remove prefixo IPv6 (::ffff:) se presente
  return ip.replace('::ffff:', '');
}

/**
 * Resposta de sucesso silenciosa para honeypot
 * @param {import('http').ServerResponse} res
 * @returns {import('http').ServerResponse}
 */
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

/**
 * HANDLER PRINCIPAL — Vercel Serverless Function
 */
export default async function handler(req, res) {
  // Aplica CORS
  if (applyCORS(req, res)) return;

  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  // Body parsing: Vercel auto-parseia req.body para application/json
  const body = req.body ?? {};

  // 🤖 Honeypot
  if (isHoneypotTriggered(body)) {
    console.info('[register] Honeypot triggered — bot silently rejected');
    return fakeHoneypotSuccess(res);
  }

  // 🔐 Rate Limiting
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

  // Validação com Zod
  const validation = validateRegisterPayload(body);
  if (!validation.success) {
    return sendError(res, validation.message, 'INVALID_PAYLOAD', 400, validation.details);
  }

  const { fullName, email, phone, socialMedia, profession, consent, consentVersion, lossExperience } = validation.data;

  try {
    // Verifica email existente
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
      console.info('[register] Duplicate registration');
      return sendSuccess(res, {
        message: 'E-mail já registrado.',
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
    
        
    // ✅ CALCULAR queuePosition MANUALMENTE COM RETRY PARA EVITAR RACE CONDITION
    let created;
    let queuePosition;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    while (retryCount < MAX_RETRIES) {
      try {
        const currentCount = await prisma.betaUser.count();
        queuePosition = currentCount + 1;

        created = await prisma.betaUser.create({
          data: {
            fullName: escapeHtml(fullName),
            email,
            phone,
            socialMedia,
            profession,
            consent,
            consentVersion,
            consentDate: new Date(),
            queuePosition, // ← Define explicitamente
            lossExperience: escapeHtml(lossExperience),
          },
        });
        break; // Sucesso, sai do loop
      } catch (err) {
        // Se for erro de unicidade no queuePosition, tenta novamente
        if (err.code === 'P2002' && (err.meta?.target?.includes('queuePosition') || err.meta?.target === 'queuePosition' || err.meta?.target === 'beta_users_queuePosition_key')) {
          retryCount++;
          if (retryCount >= MAX_RETRIES) throw err;
          // Pequeno delay aleatório para desempate
          await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));
          continue;
        }
        throw err; // Outros erros (ex: email duplicado) sobem para o catch externo
      }
    }

    const rewards = assignRewards(queuePosition);

    // Atualiza com tier/benefícios
    const newUser = await prisma.betaUser.update({
      where: { id: created.id },
      data: {
        tier: rewards.tier,
        premiumMonths: rewards.premiumMonths,
        lifetimeDiscount: rewards.lifetimeDiscount,
      },
    });

    console.info(`[register] New signup — #${queuePosition} — ${rewards.tier}`);

    // Envia notificação interna (await seguro — nunca lança exceção)
    const emailResult = await sendConfirmationEmail(newUser, queuePosition, rewards);
    if (!emailResult.success) {
      console.warn(`[register] Email skipped: ${emailResult.reason}`);
    }

    return sendSuccess(
      res,
      {
        message: 'Inscrição realizada com sucesso!',
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
      return sendError(res, 'E-mail já registrado.', 'EMAIL_DUPLICATE', 409);
    }

    console.error('[register] Internal error:', {
      code: err.code || 'UNKNOWN',
      name: err.name || 'Error',
    });

    return sendError(
      res,
      'Erro ao processar inscrição. Tente novamente.',
      'INTERNAL_ERROR',
      500
    );
  }
}