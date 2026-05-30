/**
 * src/services/queueService.js
 * Calcula a próxima posição disponível na fila de beta testers.
 */

import { prisma } from '../database/prisma.js';

/**
 * Retorna a próxima posição na fila (total de usuários + 1).
 * @returns {Promise<number>}
 */
export async function getNextPosition() {
  const count = await prisma.betaUser.count();
  return count + 1;
}

/**
 * Retorna estatísticas gerais da fila.
 * @returns {Promise<{ total: number, founders: number, elite: number }>}
 */
export async function getQueueStats() {
  const [total, founders, elite] = await Promise.all([
    prisma.betaUser.count(),
    prisma.betaUser.count({ where: { tier: 'FOUNDER' } }),
    prisma.betaUser.count({ where: { tier: 'ELITE' } }),
  ]);

  return { total, founders, elite };
}
