/**
 * src/database/prisma.js
 * Singleton do Prisma Client — seguro para Vercel Serverless.
 *
 * Security:
 *   - Reutiliza conexão em dev (evita estouro em hot reloads)
 *   - Log seguro em produção (sem query details)
 *   - Graceful error handling
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

/**
 * Inicializa Prisma com configurações seguras.
 * Em desenvolvimento: loga queries completas (DEBUG)
 * Em produção: loga apenas erros críticos
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error'] // Debug mode: query details
        : ['error'], // Production: apenas erros
    errorFormat: 'pretty', // Formata erros de forma legível para logs
  });

// Mantém referência global em desenvolvimento (hot reloads)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown: desconecta do banco quando o processo encerra.
 * Importante para serverless e CI/CD.
 */
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Tratamento de erro não capturado
process.on('uncaughtException', async (err) => {
  console.error('[prisma] Uncaught exception:', err.code ?? 'unknown');
  await prisma.$disconnect();
  process.exit(1);
});
