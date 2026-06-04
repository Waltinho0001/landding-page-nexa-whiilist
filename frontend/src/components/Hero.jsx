/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowRight, ArrowUpRight, Users, Clock } from 'lucide-react';
import NexaMockup from './NexaMockup.jsx';

export default function Hero({ onNavigate }) {
  return (
    <section aria-labelledby="hero-title" className="relative px-4 sm:px-6 lg:px-8 pt-8 md:pt-16 max-w-7xl mx-auto overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow -top-10 pointer-events-none" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-8 items-center relative z-10">
        <div className="lg:col-span-7 space-y-5 md:space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-nexa-purple/10 to-nexa-blue/10 border border-nexa-blue/20 text-xs text-nexa-blue font-bold tracking-wide w-fit max-w-full mx-auto lg:mx-0 motion-safe:animate-pulse">
            <span className="w-2 h-2 rounded-full bg-nexa-blue shrink-0" />
            <span className="truncate">Beta Fechado • Vagas Limitadas</span>
          </div>

          <h1
            id="hero-title"
            className="font-display font-extrabold text-[clamp(1.75rem,5vw,3.75rem)] text-slate-900 tracking-tight leading-tight"
          >
            Seja um dos primeiros a transformar{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexa-blue-dark to-nexa-purple">
              intenção em ação
            </span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Cadastre-se para acesso antecipado à Nexa e ajude a construir o futuro do produto que vai destravar a rotina de jovens mentes realizadoras.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 md:pt-4 text-xs sm:text-sm font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400 stroke-[2.5] shrink-0" />
              <span>
                <strong className="text-slate-800">500+ pessoas</strong> já se inscreveram
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400 stroke-[2.5] shrink-0" />
              <span>
                Apenas <strong className="text-slate-800">100 vagas</strong> restantes neste ciclo
              </span>
            </div>
          </div>

          <div className="pt-2 md:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
            <button
              type="button"
              onClick={() => onNavigate('principal-waitlist-box')}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center bg-gradient-to-r from-nexa-blue-dark to-nexa-blue hover:from-nexa-blue hover:to-nexa-purple focus:from-nexa-blue focus:to-nexa-purple text-white text-sm font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all motion-safe:transform motion-safe:hover:-translate-y-0.5 gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-nexa-blue/30"
            >
              Garantir Acesso Antecipado
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSd5wr-Gme_Jxih9MGAbh_HycSKYID_0cfDXA1JJVXI08hl52w/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center bg-white hover:bg-slate-50 focus:bg-slate-50 text-slate-700 text-sm font-semibold py-3.5 px-4 sm:px-6 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-slate-300 transition-all motion-safe:transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <span className="text-center">Questionário Secundário</span>
              <ArrowUpRight className="w-4 h-4 ml-1.5 text-slate-500 opacity-80 transition-colors group-hover:text-slate-800 group-focus:text-slate-800 shrink-0" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center w-full min-w-0">
          <NexaMockup />
        </div>
      </div>
    </section>
  );
}
