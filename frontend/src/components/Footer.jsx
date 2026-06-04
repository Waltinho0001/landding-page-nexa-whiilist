/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck } from 'lucide-react';

function NexaLogo({ className = 'w-8 h-8' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <div className="absolute -inset-1 bg-gradient-to-tr from-nexa-blue to-nexa-purple rounded-full blur-xs opacity-60 motion-safe:animate-pulse" />
        <div className="relative w-8 h-8 bg-nexa-whitesmoke rounded-full flex items-center justify-center shadow-xs border border-slate-100">
          <svg viewBox="0 0 100 100" className="w-5 h-5" aria-hidden="true">
            <defs>
              <linearGradient id="logo-grad-footer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0582da" />
                <stop offset="50%" stopColor="#197cf7" />
                <stop offset="100%" stopColor="#8958f3" />
              </linearGradient>
            </defs>
            <path
              d="M25 80 V20 L75 80 V20"
              fill="none"
              stroke="url(#logo-grad-footer)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <span className="font-display font-extrabold text-lg text-slate-800 tracking-tight leading-none">NEXA</span>
    </div>
  );
}

const FOOTER_LINKS = [
  { href: '#porque-nexa', label: 'Sobre' },
  { href: '#beneficios', label: 'Privacidade' },
  { href: '#faq-container', label: 'Contato' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-10 md:py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-center">
        <div className="space-y-2 text-center md:text-left">
          <NexaLogo />
          <p className="text-slate-400 text-[11px] sm:text-xs font-semibold tracking-wide">
            MÍNIMO DE CLIQUES • MÁXIMO DE RESULTADO
          </p>
        </div>

        <nav aria-label="Links do rodapé" className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-x-8 sm:gap-y-3 justify-center">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="min-h-[44px] inline-flex items-center justify-center sm:justify-start text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 focus:text-slate-800 focus:outline-none focus:ring-2 focus:ring-nexa-blue/30 rounded-lg px-2 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="text-center md:text-right space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] bg-slate-50 border border-slate-200/50 rounded text-[10px] sm:text-xs text-slate-400 font-semibold tracking-tight">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5] shrink-0" />
            <span>Selo de Conformidade LGPD &amp; GDPR</span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
            &copy; {new Date().getFullYear()} Nexa App Inc. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
