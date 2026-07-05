/**
 * src/utils/validation.js
 * Schemas Zod, sanitização e helpers de segurança.
 * Referência: SECURITY_AUDIT_CHECKLIST.md — validação server-side, honeypot, XSS.
 */

import { z } from 'zod';
import { createHash } from 'crypto';

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'mailinator.com',
  'yopmail.com',
  'throwaway.email',
  'test.com',
]);

/**
 * @param {string} value
 * @returns {string}
 */
export function sanitizeString(value) {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .slice(0, 500)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * @param {string} text
 * @returns {string}
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * @param {string} email
 * @returns {string}
 */
export function getEmailDomain(email) {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}

/**
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @param {string} email
 * @returns {boolean}
 */
export function isDisposableEmail(email) {
  const domain = getEmailDomain(email);
  return domain.length > 0 && DISPOSABLE_DOMAINS.has(domain);
}

/**
 * @param {string} ipAddress
 * @returns {string}
 */
export function hashIpAddress(ipAddress) {
  if (!ipAddress || typeof ipAddress !== 'string') return '';
  return createHash('sha256').update(ipAddress).digest('hex');
}

/**
 * Honeypot: campo website deve estar vazio.
 * @param {unknown} body
 * @returns {boolean}
 */
export function isHoneypotTriggered(body) {
  if (!body || typeof body !== 'object') return false;
  const website = body.website;
  return typeof website === 'string' && website.trim().length > 0;
}

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Campo 'fullName' é obrigatório." })
    .min(1)
    .transform((val) => sanitizeString(val))
    .refine((val) => val.length >= 3, "Campo 'fullName' deve ter no mínimo 3 caracteres.")
    .refine((val) => val.length <= 120, "Campo 'fullName' deve ter no máximo 120 caracteres.")
    .refine((val) => val.split(/\s+/).length >= 2, 'Por favor, informe também o sobrenome.'),

  email: z
    .string({ required_error: "Campo 'email' é obrigatório." })
    .trim()
    .min(1)
    .email("Campo 'email' inválido.")
    .transform((val) => sanitizeString(val).toLowerCase())
    .refine((val) => val.length <= 254, 'E-mail muito longo.')
    .refine((val) => !isDisposableEmail(val), 'E-mail de domínio temporário não permitido.'),

  phone: z
    .string({ required_error: 'Telefone é obrigatório.' })
    .transform((val) => sanitizeString(val).replace(/\D/g, ''))
    .refine((val) => val.length >= 10 && val.length <= 15, 'Telefone inválido — mínimo 10 dígitos, máximo 15.'),

  socialMedia: z
    .string({ required_error: 'Rede social é obrigatória.' })
    .transform((val) => sanitizeString(val))
    .refine((val) => val.length >= 1 && val.length <= 100, 'Rede social inválida.'),

  profession: z
    .string({ required_error: 'Profissão é obrigatória.' })
    .transform((val) => sanitizeString(val))
    .refine((val) => val.length >= 1 && val.length <= 100, 'Profissão inválida.'),

  consent: z
    .boolean({ required_error: 'Consentimento obrigatório.' })
    .refine((val) => val === true, 'Você precisa aceitar os termos para se inscrever.'),

  consentVersion: z.string().default(process.env.CONSENT_VERSION || '1.0'),

  lossExperience: z
    .string({ required_error: 'Sua resposta é obrigatória.' })
    .transform((val) => sanitizeString(val))
    .refine((val) => val.length >= 15, 'Sua resposta é muito curta. Por favor, detalhe mais para nos ajudar a entender sua dor e se você tem o perfil do Beta.')
    .refine((val) => val.length <= 2000, 'Sua resposta é muito longa.'),
});

export const statusQuerySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1)
    .transform((val) => sanitizeString(val).toLowerCase())
    .refine(validateEmailFormat, 'E-mail inválido.'),
});

export const unsubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1)
    .transform((val) => sanitizeString(val).toLowerCase())
    .refine(validateEmailFormat, 'E-mail inválido.'),
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Confirmação de exclusão é obrigatória (confirm: true).' }),
  }),
});

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tier: z.enum(['FOUNDER', 'ELITE', 'OBSERVER']).optional(),
});

/**
 * @param {unknown} body
 */
export function validateRegisterPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      success: false,
      message: 'Payload inválido.',
      details: { geral: 'Dados não reconhecidos.' },
    };
  }

  const result = registerSchema.safeParse(body);

  if (!result.success) {
    const details = {};
    result.error.errors.forEach((err) => {
      const field = err.path[0] ?? 'geral';
      details[field] = err.message;
    });
    const firstMessage = result.error.errors[0]?.message ?? 'Dados inválidos.';
    return { success: false, message: firstMessage, details };
  }

  return { success: true, data: result.data };
}

/**
 * @param {unknown} query
 */
export function validateStatusQuery(query) {
  const result = statusQuerySchema.safeParse(query);
  if (!result.success) {
    return { success: false, message: 'E-mail inválido.' };
  }
  return { success: true, data: result.data };
}

/**
 * @param {unknown} body
 */
export function validateUnsubscribePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { success: false, message: 'Payload inválido.' };
  }
  const result = unsubscribeSchema.safeParse(body);
  if (!result.success) {
    return { success: false, message: result.error.errors[0]?.message ?? 'Dados inválidos.' };
  }
  return { success: true, data: result.data };
}

/**
 * @param {unknown} query
 */
export function validateAdminListQuery(query) {
  const result = adminListQuerySchema.safeParse(query ?? {});
  if (!result.success) {
    return { success: false, message: 'Parâmetros de listagem inválidos.' };
  }
  return { success: true, data: result.data };
}
