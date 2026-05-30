/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    number: 1,
    title: '1. Cadastro Simples',
    description: 'Preencha nosso formulário acima para reservar seu lugar na fila de espera.',
  },
  {
    number: 2,
    title: '2. Onboarding Guiado',
    description: 'Receba no WhatsApp/E-mail o link exclusivo, o tutorial sem atritos e o convite da comunidade.',
  },
  {
    number: 3,
    title: '3. Feedback Real',
    description: 'Teste as tarefas, reporte bugs no canal exclusivo e sugira mudanças no roadmap direto do app.',
  },
];

export default function Timeline() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
        <div className="hidden md:block absolute top-7 left-[15%] right-[15%] h-0.5 bg-slate-200 pointer-events-none" />
        {STEPS.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left group relative">
            <div className="w-14 h-14 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center shadow-md text-transparent bg-clip-text bg-gradient-to-tr from-nexa-blue to-nexa-purple font-display font-black text-xl mb-4 group-hover:scale-105 transition-all z-10">
              <span className="bg-gradient-to-tr from-nexa-blue-dark to-nexa-blue bg-clip-text text-transparent font-extrabold text-lg">
                0{step.number}
              </span>
            </div>
            <div className="bg-white/80 p-5 rounded-2xl border border-slate-100 inline-block w-full">
              <h4 className="font-display font-bold text-base text-slate-800 mb-2">{step.title}</h4>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-nexa-blue/5 border border-nexa-blue/10 text-xs text-nexa-blue font-semibold">
          <CheckCircle2 className="w-4 h-4 text-white fill-current shrink-0" />
          <span>Processo seletivo simples • Sem compromisso de uso diário</span>
        </div>
      </div>
    </div>
  );
}
