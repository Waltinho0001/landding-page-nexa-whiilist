/**
 * src/utils/validation.js
 * Schema de validação Zod para inscrição de beta tester.
 * Inclui sanitização, rate limiting & proteção contra ataques comuns.
 */

import { z } from 'zod';
import { createHash } from 'crypto';

/**
 * Sanitiza strings: remove caracteres perigosos, controla espaços em branco.
 * Previne XSS, injeção e fuzzing.
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeString(value) {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .slice(0, 500) // Limite hard para payloads
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '') // Remove controle chars
    .replace(/\s+/g, ' ') // Normaliza espaços
    .normalize('NFD') // Decomposição Unicode
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacríticos ambíguos
}

/**
 * Escapa HTML para uso seguro em templates e JSON.
 *
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
 * Extrai domínio de email de forma segura.
 *
 * @param {string} email
 * @returns {string}
 */
export function getEmailDomain(email) {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}

/**
 * Valida formato de email com regex segura.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;

  // RFC 5322 simplified
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Gera hash de IP para rate limiting (sem armazenar IP inteiro).
 *
 * @param {string} ipAddress
 * @returns {string}
 */
export function hashIpAddress(ipAddress) {
  if (!ipAddress || typeof ipAddress !== 'string') return '';
  return createHash('sha256').update(ipAddress).digest('hex');
}

// ─────── SCHEMAS ZODI ────────

/**
 * Schema completo de validação com regras estritas.
 */
export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Campo 'fullName' é obrigatório." })
    .min(1)
    .transform((val) => sanitizeString(val))
    .refine(
      (val) => val.length >= 3,
      "Campo 'fullName' deve ter no mínimo 3 caracteres."
    )
    .refine(
      (val) => val.length <= 120,
      "Campo 'fullName' deve ter no máximo 120 caracteres."
    )
    .refine(
      (val) => val.split(/\s+/).length >= 2,
      "Por favor, informe também o sobrenome."
    ),

  email: z
    .string({ required_error: "Campo 'email' é obrigatório." })
    .trim()
    .min(1)
    .email("Campo 'email' inválido.")
    .transform((val) => sanitizeString(val).toLowerCase())
    .refine(
      (val) => val.length <= 254,
      "E-mail muito longo."
    )
    .refine(
      (val) => {
        const domain = getEmailDomain(val);
        // Rejeita domínios disposáveis conhecidos (MVP list)
        const disposableDomains = [
          'tempmail.com',
          'guerrillamail.com',
          '10minutemail.com',
          'mailinator.com',
          'test.com',
        ];
        return !disposableDomains.includes(domain);
      },
      "E-mail de domínio temporário não permitido."
    ),

  phone: z
    .string()
    .transform((val) => sanitizeString(val).replace(/\D/g, ''))
    .optional()
    .refine(
      (val) => !val || (val.length >= 10 && val.length <= 15),
      "Telefone inválido — mínimo 10 dígitos, máximo 15."
    ),

  socialMedia: z
    .string()
    .transform((val) => sanitizeString(val))
    .optional()
    .refine(
      (val) => !val || val.length <= 100,
      "Rede social: máximo 100 caracteres."
    ),

  profession: z
    .string()
    .transform((val) => sanitizeString(val))
    .optional()
    .refine(
      (val) => !val || val.length <= 100,
      "Profissão: máximo 100 caracteres."
    ),

  consent: z
    .boolean({ required_error: "Consentimento obrigatório." })
    .refine((val) => val === true, "Você precisa aceitar os termos para se inscrever."),

  consentVersion: z
    .string()
    .default(process.env.CONSENT_VERSION || '1.0'),

  // Honeypot: campo oculto que bots preenchem
  website: z
    .string()
    .optional()
    .refine((val) => !val, "Validação falhou."), // Deve estar vazio
});

/**
 * Valida o payload de entrada e retorna dados limpos ou erro formatado.
 * Garante segurança defensiva: assume inputs maliciosos até prova contrária.
 *
 * @param {unknown} body
 * @returns {{ success: true, data: object } | { success: false, message: string, details: object }}
 */
export function validateRegisterPayload(body) {
  // Rejeita se não for objeto
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
