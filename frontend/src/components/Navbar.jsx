/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

function NexaLogo({ className = 'w-8 h-8' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <div className="absolute -inset-1 bg-gradient-to-tr from-nexa-blue to-nexa-purple rounded-full blur-xs opacity-60 motion-safe:animate-pulse" />
        <div className="relative w-8 h-8 bg-nexa-whitesmoke rounded-full flex items-center justify-center shadow-xs border border-slate-100">
          <svg viewBox="0 0 100 100" className="w-5 h-5" aria-hidden="true">
            <defs>
              <linearGradient id="logo-grad-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0582da" />
                <stop offset="50%" stopColor="#197cf7" />
                <stop offset="100%" stopColor="#8958f3" />
              </linearGradient>
            </defs>
            <path
              d="M25 80 V20 L75 80 V20"
              fill="none"
              stroke="url(#logo-grad-nav)"
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

const NAV_LINKS = [
  { id: 'beneficios', label: 'Benefícios' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'faq-container', label: 'Dúvidas' },
];

export default function Navbar({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = (id) => {
    setMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/50 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-[4.5rem] flex items-center justify-between">
        <nav aria-label="Navegação de topo" className="flex items-center justify-between w-full">
          <a
            href="#"
            className="min-h-[44px] inline-flex items-center focus:outline-none focus:ring-2 focus:ring-nexa-blue/30 rounded-lg px-1"
          >
            <NexaLogo />
          </a>

          <div className="hidden sm:flex items-center gap-4 md:gap-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link.id)}
                className="min-h-[44px] inline-flex items-center px-2 text-xs font-semibold text-slate-500 hover:text-slate-800 focus:text-slate-800 focus:outline-none focus:ring-2 focus:ring-nexa-blue/30 rounded-lg transition-colors cursor-pointer"
              >
                {link.label}
              </button>
            ))}
            <button
              id="btn-nav-waitlist"
              type="button"
              onClick={() => handleNavClick('principal-waitlist-box')}
              className="min-h-[44px] inline-flex items-center bg-slate-900 hover:bg-slate-800 focus:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-transform motion-safe:hover:scale-105 motion-safe:active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/40"
            >
              Entrar na Lista
            </button>
          </div>

          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavClick('principal-waitlist-box')}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-slate-900 text-white text-xs font-bold px-3 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900/40 cursor-pointer"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-nexa-blue/30 cursor-pointer"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-sm z-30 sm:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-nav-menu"
            className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-lg sm:hidden animate-fade-in"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className="w-full min-h-[44px] flex items-center px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nexa-blue/30 rounded-xl transition-colors cursor-pointer text-left"
                >
                  {link.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleNavClick('principal-waitlist-box')}
                className="w-full min-h-[44px] flex items-center justify-center mt-2 bg-gradient-to-r from-nexa-blue-dark to-nexa-blue text-white text-sm font-bold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-nexa-blue/40 cursor-pointer"
              >
                Garantir Acesso Antecipado
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
