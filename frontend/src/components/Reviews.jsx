/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quote, Flame, Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    id: 'testimonial-1',
    role: 'Estudante de Engenharia, 21 anos',
    quote: 'Finalmente um aplicativo que foca em me ajudar a executar, e não apenas organizar! Cansei de passar horas configurando bancos de dados gigantescos no Notion que acabam vazios.',
    author: 'Matheus Ramos',
    tag: 'Estudante',
  },
  {
    id: 'testimonial-2',
    role: 'Designer Freelancer, 26 anos',
    quote: 'Como freelancer, preciso de algo extremamente limpo e rápido para ontem. A Nexa remove toda a fricção de entrada e prioriza realmente a minha próxima ação. Parece perfeito para o meu dia a dia.',
    author: 'Beatriz M.',
    tag: 'Freelancer',
  },
  {
    id: 'testimonial-3',
    role: 'Profissional Júnior, TDAH Diagnosticado',
    quote: 'Meu maior obstáculo é a paralisia por análise quando encaro listas longas. O "Modo Foco Agora" da Nexa é um salva-vidas cognitivo que me ajuda a progredir de verdade sem punições.',
    author: 'Lucas Ferreira',
    tag: 'TDAH Foco',
  },
];

export default function Reviews() {
  return (
    <div className="space-y-10 md:space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-xs relative flex flex-col justify-between"
          >
            <Quote className="absolute right-5 top-5 w-8 h-8 text-slate-100 fill-current shrink-0" />
            <div className="relative z-10">
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit mb-4">
                {t.tag}
              </span>
              <div className="flex gap-0.5 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
                ))}
              </div>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed italic mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>
            <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-nexa-blue/20 to-nexa-purple/20 flex items-center justify-center font-display font-bold text-xs text-nexa-blue-dark">
                {t.author.charAt(0)}
              </div>
              <div>
                <h5 className="font-sans font-bold text-xs md:text-sm text-slate-800 leading-none">
                  {t.author}
                </h5>
                <span className="text-[10px] text-slate-400 font-semibold leading-none mt-1 block">
                  {t.role}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="max-w-xl mx-auto bg-gradient-to-br from-nexa-blue-dark to-nexa-blue rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-nexa-purple/20 rounded-full blur-xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 relative z-10">
          <div>
            <span className="text-3xl sm:text-4xl font-mono font-extrabold tracking-tight block text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-100">
              500+
            </span>
            <span className="text-[10px] sm:text-xs text-blue-100 uppercase font-black tracking-widest mt-0.5 block">
              Inscrições Ativas
            </span>
          </div>
          <div className="hidden sm:block w-px h-10 bg-white/20" />
          <div className="text-center sm:text-left">
            <h4 className="font-display font-semibold text-sm sm:text-base text-white">
              Vagas de Fundador sendo preenchidas!
            </h4>
            <p className="text-xs text-blue-100 leading-relaxed mt-1 max-w-xs">
              Alcançamos a meta na primeira semana de divulgação institucional pré-MVP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
