/**
 * api/user/unsubscribe.js — POST /api/user/unsubscribe
 * LGPD: direito ao esquecimento via anonimização de PII.
 */

import { applyCORS, sendSuccess, sendError } from '../../src/config/cors.js';
import { validateUnsubscribePayload } from '../../src/utils/validation.js';
import { prisma } from '../../src/database/prisma.js';

const GENERIC_SUCCESS = {
  message:
    'Solicitação processada. Se o e-mail estiver cadastrado, os dados pessoais foram anonimizados.',
};

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  const validation = validateUnsubscribePayload(req.body);
  if (!validation.success) {
    return sendError(res, validation.message, 'INVALID_PAYLOAD', 400);
  }

  const { email } = validation.data;

  try {
    const user = await prisma.betaUser.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      const anonymizedEmail = `removed-${user.id}@anonymized.nexa`;

      await prisma.betaUser.update({
        where: { id: user.id },
        data: {
          fullName: 'Usuário Removido',
          email: anonymizedEmail,
          phone: null,
          socialMedia: null,
          profession: null,
          consent: false,
          consentDate: new Date(),
        },
      });

      console.info('[unsubscribe] User anonymized');
    } else {
      console.info('[unsubscribe] Request processed — no match');
    }

    return sendSuccess(res, GENERIC_SUCCESS);
  } catch (err) {
    if (err.code === 'P2002') {
      return sendSuccess(res, GENERIC_SUCCESS);
    }

    console.error('[unsubscribe] Internal error');
    return sendError(
      res,
      'Erro ao processar solicitação. Tente novamente.',
      'INTERNAL_ERROR',
      500
    );
  }
}
