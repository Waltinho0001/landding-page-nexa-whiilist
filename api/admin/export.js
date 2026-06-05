/**
 * api/admin/export.js — GET /api/admin/export (CSV)
 */

import { applyCORS, sendError } from '../../src/config/cors.js';
import { withAdminAuth } from './auth.js';
import { prisma } from '../../src/database/prisma.js';
import { generateBetaUsersCSV } from '../../src/utils/csvGenerator.js';

export default async function handler(req, res) {
  if (applyCORS(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 'Método não permitido.', 'METHOD_NOT_ALLOWED', 405);
  }

  return withAdminAuth(req, res, async () => {
    try {
      const allUsers = await prisma.betaUser.findMany({
        orderBy: { queuePosition: 'asc' },
        select: {
          queuePosition: true,
          fullName: true,
          email: true,
          phone: true,
          socialMedia: true,
          profession: true,
          tier: true,
          premiumMonths: true,
          lifetimeDiscount: true,
          createdAt: true,
        },
      });

      console.info(`[admin/export] Exporting ${allUsers.length} rows`);

      const csvContent = generateBetaUsersCSV(allUsers);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="nexa-beta-signups.csv"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      return res.status(200).send(csvContent);
    } catch (err) {
      console.error('[admin/export] Error');
      if (res.headersSent) {
        res.end();
        return;
      }
      return sendError(res, 'Erro ao gerar exportação CSV.', 'EXPORT_ERROR', 500);
    }
  });
}
