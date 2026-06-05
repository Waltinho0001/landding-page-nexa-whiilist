/**
 * src/services/queueService.js
 * Cálculo de posição na fila de beta testers.
 */

import { prisma } from '../database/prisma.js';

/**
 * @returns {Promise<number>}
 */
export async function getNextPosition() {
  const count = await prisma.betaUser.count();
  return count + 1;
}
