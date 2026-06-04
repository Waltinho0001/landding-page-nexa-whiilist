/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Zap, Brain, Crown, Users, MessageSquare } from 'lucide-react';

const BENEFITS = [
  {
    id: 'benefit-1',
    title: 'Acesso Antecipado',
    description: 'Use a Nexa antes do lançamento oficial. Experimente um fluxo de produtividade focado na ação sem punições.',
    iconName: 'Zap',
  },
  {
    id: 'benefit-2',
    title: 'Voz Ativa Co-criadora',
    description: 'Suas avaliações, relatos e sugestões influenciam diretamente o roadmap de funções. Crie o aplicativo do seu jeito.',
    iconName: 'Brain',
  },
  {
    id: 'benefit-3',
    title: '12 Meses Premium + Desconto Vitalício',
    description: 'Use a Nexa Premium gratuitamente por 1 ano completo. Após isso, mantenha 50% de desconto vitalício (R$ 4,95/mês). Sua contribuição é reconhecida para sempre.',
    iconName: 'Crown',
    badge: 'Mais Popular',
  },
  {
    id: 'benefit-4',
    title: 'Comunidade Exclusiva',
    description: 'Conecte-se e troque insights de rotinas eficientes com outros early adopters e entusiastas de performance limpa.',
    iconName: 'Users',
  },
];

export default function Features() {
  const renderIcon = (name) => {
    switch (name) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-nexa-blue stroke-[2.5]" aria-hidden="true" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-nexa-purple stroke-[2.5]" aria-hidden="true" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-nexa-blue stroke-[2.5]" aria-hidden="true" />;
      case 'Users':
        return <Users className="w-5 h-5 text-nexa-purple stroke-[2.5]" aria-hidden="true" />;
      default:
        return <MessageSquare className="w-5 h-5 text-slate-500" aria-hidden="true" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
      {BENEFITS.map((benefit) => (
        <article
          id={benefit.id}
          key={benefit.id}
          aria-labelledby={`benefit-title-${benefit.id}`}
          className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/60 shadow-xs md:hover:shadow-xl transition-all duration-300 md:motion-safe:hover:-translate-y-1 group focus-within:ring-2 focus-within:ring-nexa-blue/20"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform">
            {renderIcon(benefit.iconName)}
          </div>

          {benefit.badge && (
            <div className="mb-4 flex justify-center">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-nexa-blue/10 to-nexa-purple/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-nexa-blue">
                {benefit.badge}
              </span>
            </div>
          )}

          <h3
            id={`benefit-title-${benefit.id}`}
            className="font-display font-bold text-lg md:text-xl text-slate-800 tracking-tight mb-2 text-center sm:text-left"
          >
            {benefit.title}
          </h3>

          <p className="text-sm md:text-base leading-relaxed text-nexa-gray-muted text-center sm:text-left">
            {benefit.description}
          </p>
        </article>
      ))}
    </div>
  );
}
