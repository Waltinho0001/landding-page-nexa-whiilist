/**
 * src/utils/validation.js
 * Schema de validação Zod para inscrição de beta tester.
 */

import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Campo 'fullName' é obrigatório." })
    .trim()
    .min(3, "Campo 'fullName' deve ter no mínimo 3 caracteres.")
    .max(120, "Campo 'fullName' deve ter no máximo 120 caracteres.")
    .refine(
      (val) => val.trim().split(/\s+/).length >= 2,
      "Por favor, informe também o sobrenome."
    ),

  email: z
    .string({ required_error: "Campo 'email' é obrigatório." })
    .trim()
    .toLowerCase()
    .email("Campo 'email' inválido."),

  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val.replace(/\D/g, '').length >= 10,
      "Telefone inválido — mínimo 10 dígitos."
    ),

  socialMedia: z
    .string()
    .trim()
    .optional(),

  profession: z
    .string()
    .trim()
    .optional(),

  consent: z
    .boolean({ required_error: "Consentimento obrigatório." })
    .refine((val) => val === true, "Você precisa aceitar os termos para se inscrever."),

  consentVersion: z
    .string()
    .default('1.0'),
});

/**
 * Valida o payload de entrada e retorna dados limpos ou um erro formatado.
 * @param {unknown} body
 * @returns {{ success: true, data: object } | { success: false, message: string, details: object }}
 */
export function validateRegisterPayload(body) {
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
