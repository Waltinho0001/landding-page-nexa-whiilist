/**
 * api/admin/export.js
 * GET /api/admin/export — Exportação completa de beta testers para CSV.
 *
 * Retorna arquivo CSV para download com todos os registros.
 * Headers da resposta:
 *   Content-Type: text/csv
 *   Content-Disposition: attachment; filename="nexa-beta-signups.csv"
 */

import { applyCORS, sendError } from '../../src/config/cors.js';
import { withAdminAuth } from './auth.js';
import { prisma } from '../../src/database/prisma.js';
import { generateBetaUsersCSV } from '../../src/utils/csvGenerator.js';

export default async function handler(req, res) {
  // CORS
  if (applyCORS(req, res)) return;

  // Apenas GET
  if (req.method !== 'GET') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  // Autenticação admin
  return withAdminAuth(req, res, async () => {
    try {
      // Busca TODOS os registros (sem paginação)
      const allUsers = await prisma.betaUser.findMany({
        orderBy: { queuePosition: 'asc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          socialMedia: true,
          profession: true,
          queuePosition: true,
          tier: true,
          premiumMonths: true,
          lifetimeDiscount: true,
          createdAt: true,
        },
      });

      console.log(`[admin/export] Exportando ${allUsers.length} registros para CSV.`);

      // Gera CSV
      const csvContent = generateBetaUsersCSV(allUsers);

      // Configura headers para download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="nexa-beta-signups.csv"'
      );
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Envia conteúdo CSV
      res.status(200).send(csvContent);
    } catch (err) {
      console.error('[admin/export] Erro ao exportar CSV:', err.message);

      // Se já enviou headers, não pode enviar JSON — envia texto simples
      if (res.headersSent) {
        res.end();
        return;
      }

      return sendError(
        res,
        'Erro ao gerar exportação CSV.',
        'EXPORT_ERROR',
        500
      );
    }
  });
}