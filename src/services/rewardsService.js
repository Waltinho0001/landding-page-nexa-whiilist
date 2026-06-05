/**
 * src/services/rewardsService.js
 * Atribuição de tiers e benefícios por posição na fila.
 *
 * ELITE    → 1–10   | 12 meses | 50% vitalício
 * FOUNDER  → 11–100 |  6 meses | 40% vitalício
 * OBSERVER → 101+    |  6 meses | 30% vitalício
 */

const TIER_BENEFITS = {
  ELITE: {
    tier: 'ELITE',
    premiumMonths: 12,
    lifetimeDiscount: 0.5,
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
    lifetimeDiscount: 0.4,
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
    lifetimeDiscount: 0.3,
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
 * @param {number} queuePosition
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
 * @param {string} tier
 */
export function getBenefitsByTier(tier) {
  return TIER_BENEFITS[tier] ?? TIER_BENEFITS.OBSERVER;
}
