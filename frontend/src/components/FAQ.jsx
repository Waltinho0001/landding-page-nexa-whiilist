/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Quem pode participar do beta?',
    answer: 'Qualquer pessoa entre 16-35 anos buscando simplificar sua rotina e reduzir a ansiedade gerada por gerenciadores complexos de listas. Estudantes, profissionais júnior e pessoas com TDAH que cansam de organizar mais do que agir são nosso público prioritário.',
  },
  {
    id: 'faq-2',
    question: 'Por quanto tempo dura o programa beta?',
    answer: 'A fase de beta fechada terá duração de aproximadamente 4 a 6 semanas. Durante esse estágio, enviaremos atualizações frequentes e canais de diálogo direto.',
  },
  {
    id: 'faq-3',
    question: 'Meus dados serão compartilhados externamente?',
    answer: 'Não. Nós levamos a privacidade extremamente a sério. Seus dados cadastrais e as tarefas criadas não serão compartilhados, nem vendidos para nenhum parceiro externo de anúncios. Estamos em total conformidade com a LGPD e GDPR.',
  },
  {
    id: 'faq-4',
    question: 'Posso sair do programa beta quando quiser?',
    answer: 'Com certeza. O programa é 100% voluntário e sem compromisso de uso diário rigoroso. Você pode deixar o grupo de feedbacks e fechar sua conta a qualquer momento direto no painel de configurações.',
  },
  {
    id: 'faq-5',
    question: 'Quando será o lançamento oficial do app?',
    answer: 'O lançamento oficial na App Store e Google Play está agendado para o próximo semestre. Inscrevendo-se hoje, você já garante sua vaga assegurada e a bonificação Pro vitalícia no lançamento.',
  },
];

export default function FAQ() {
  const [openId, setOpenId] = useState('faq-1');

  const toggleOpen = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {FAQ_ITEMS.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden transition-all duration-300"
          >
            <button
              id={`faq-btn-${item.id}`}
              type="button"
              onClick={() => toggleOpen(item.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${item.id}`}
              className="w-full min-h-[44px] flex justify-between items-center px-4 sm:px-6 py-4 sm:py-5 text-left font-sans font-bold text-slate-800 hover:text-nexa-blue focus:text-nexa-blue transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nexa-blue/30 focus:bg-slate-50 cursor-pointer gap-4"
            >
              <span className="text-sm md:text-base">{item.question}</span>
              <div className="shrink-0 min-w-[44px] min-h-[44px] rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                {isOpen ? <Minus className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
              </div>
            </button>
            <div
              id={`faq-panel-${item.id}`}
              aria-labelledby={`faq-btn-${item.id}`}
              className={`transition-all duration-300 ease-in-out px-4 sm:px-6 ${
                isOpen ? 'max-h-96 pb-5 opacity-100 border-t border-slate-100 pt-4' : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
