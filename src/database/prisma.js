/**
 * src/database/prisma.js
 * Singleton Prisma Client — seguro para Vercel Serverless (evita estouro de conexões).
 * Persiste em globalThis.__prisma em QUALQUER ambiente para reutilizar em warm functions.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (!globalForPrisma.__prisma) {
  globalForPrisma.__prisma = prisma;
}
