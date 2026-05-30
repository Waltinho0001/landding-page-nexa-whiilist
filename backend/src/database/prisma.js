/**
 * src/database/prisma.js
 * Singleton do Prisma Client — seguro para Vercel Serverless.
 * Evita estouro de conexões em hot-reloads de desenvolvimento.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
