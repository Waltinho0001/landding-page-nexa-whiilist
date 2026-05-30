/**
 * src/services/rewardsService.js
 * Lógica de atribuição de tiers e benefícios baseada na posição na fila.
 *
 * Tiers:
 *   ELITE    → posições 1–10   | 12 meses premium | 50% desconto vitalício
 *   FOUNDER  → posições 11–100 |  6 meses premium | 40% desconto vitalício
 *   OBSERVER → posições 101+   |  6 meses premium | 30% desconto vitalício
 */

const TIER_BENEFITS = {
  ELITE: {
    tier: 'ELITE',
    premiumMonths: 12,
    lifetimeDiscount: 0.50,
    label: '⚡ Elite Founder',
    perks: [
      '12 meses de acesso premium gratuito',
      '50% de desconto vitalício no plano Pro',
      'Acesso às features em alpha antes de todos',
      'Canal direto com a equipe de produto',
      'Badge exclusivo de Elite Founder',
    ],
  },
  FOUNDER: {
    tier: 'FOUNDER',
    premiumMonths: 6,
    lifetimeDiscount: 0.40,
    label: '🚀 Founder',
    perks: [
      '6 meses de acesso premium gratuito',
      '40% de desconto vitalício no plano Pro',
      'Acesso antecipado ao beta fechado',
      'Influência direta no roadmap de produto',
      'Badge exclusivo de Founder',
    ],
  },
  OBSERVER: {
    tier: 'OBSERVER',
    premiumMonths: 6,
    lifetimeDiscount: 0.30,
    label: '🌟 Observer',
    perks: [
      '6 meses de acesso premium gratuito',
      '30% de desconto vitalício no plano Pro',
      'Acesso antecipado ao beta fechado',
      'Newsletter exclusiva de produto',
    ],
  },
};

/**
 * Atribui tier e benefícios com base na posição na fila.
 * @param {number} queuePosition
 * @returns {{ tier: string, premiumMonths: number, lifetimeDiscount: number, label: string, perks: string[] }}
 */
export function assignRewards(queuePosition) {
  if (queuePosition <= 10) {
    return { ...TIER_BENEFITS.ELITE };
  }

  if (queuePosition <= 100) {
    return { ...TIER_BENEFITS.FOUNDER };
  }

  return { ...TIER_BENEFITS.OBSERVER };
}

/**
 * Retorna o objeto de benefícios completo para um tier já atribuído.
 * Útil para consultas de status sem recalcular posição.
 * @param {string} tier
 * @returns {{ label: string, perks: string[] }}
 */
export function getBenefitsByTier(tier) {
  return TIER_BENEFITS[tier] ?? TIER_BENEFITS.OBSERVER;
}
