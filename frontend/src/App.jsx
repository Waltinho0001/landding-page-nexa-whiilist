/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Check, ShieldCheck, ArrowUp, ArrowRight, ArrowUpRight, Users, Clock, HelpCircle } from 'lucide-react';
import LeadForm from './components/LeadForm.jsx';
import NexaMockup from './components/NexaMockup.jsx';
import IdeaValidation from './components/IdeaValidation.jsx';
import Features from './components/Features.jsx';
import Timeline from './components/Timeline.jsx';
import Reviews from './components/Reviews.jsx';
import FAQ from './components/FAQ.jsx';

function NexaLogo({ className = 'w-8 h-8' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
          <div className="absolute -inset-1 bg-gradient-to-tr from-nexa-blue to-nexa-purple rounded-full blur-xs opacity-60 animate-pulse" />
        <div className="relative w-8 h-8 bg-nexa-whitesmoke rounded-full flex items-center justify-center shadow-xs border border-slate-100">
          <svg viewBox="0 0 100 100" className="w-5 h-5">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0582da" />
                <stop offset="50%" stopColor="#197cf7" />
                <stop offset="100%" stopColor="#8958f3" />
              </linearGradient>
            </defs>
            <path
              d="M25 80 V20 L75 80 V20"
              fill="none"
              stroke="url(#logo-grad)"
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

export default function App() {
  const [registeredLead, setRegisteredLead] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [tier, setTier] = useState(null);
  const [benefits, setBenefits] = useState(null);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    try {
      const savedLeadString = localStorage.getItem('nexa_lead');
      const savedPosition = localStorage.getItem('nexa_queue_pos');
      const savedSurvey = localStorage.getItem('nexa_survey_completed');

      if (savedLeadString) {
        setRegisteredLead(JSON.parse(savedLeadString));
      }
      if (savedPosition) {
        setQueuePosition(parseInt(savedPosition, 10));
      }
      const savedTier = localStorage.getItem('nexa_tier');
      const savedBenefits = localStorage.getItem('nexa_benefits');
      if (savedTier) setTier(savedTier);
      if (savedBenefits) setBenefits(JSON.parse(savedBenefits));
      if (savedSurvey === 'true') {
        setSurveyCompleted(true);
      }
    } catch (e) {
      console.warn('Storage reading fallback activated', e);
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLeadSuccess = (lead, position, newTier, newBenefits) => {
    setRegisteredLead(lead);
    setQueuePosition(position);
    if (newTier) setTier(newTier);
    if (newBenefits) setBenefits(newBenefits);
    try {
      localStorage.setItem('nexa_lead', JSON.stringify(lead));
      localStorage.setItem('nexa_queue_pos', position.toString());
      if (newTier) localStorage.setItem('nexa_tier', newTier);
      if (newBenefits) localStorage.setItem('nexa_benefits', JSON.stringify(newBenefits));
    } catch (e) {
      console.warn('Storage writing failed', e);
    }

    const target = document.getElementById('validation-section-container');
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  };

  const handleSurveyComplete = () => {
    setSurveyCompleted(true);
  };

  const scrollToSection = (id) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans tracking-tight bg-dot-pattern">
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Voltar para o topo"
          className="fixed bottom-6 right-6 p-3 bg-white text-slate-700 hover:text-nexa-blue border border-slate-200 shadow-lg rounded-full hover:scale-105 active:scale-95 transition-all z-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-nexa-blue/40"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/50 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between">
          <nav aria-label="Navegação de topo" className="flex items-center justify-between w-full">
            <a href="#" className="focus:outline-none focus:ring-2 focus:ring-nexa-blue/30 rounded-lg p-1">
              <NexaLogo />
            </a>
            <div className="flex items-center gap-6">
              <button
                onClick={() => scrollToSection('beneficios')}
                className="hidden sm:inline-block text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection('como-funciona')}
                className="hidden sm:inline-block text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Como funciona
              </button>
              <button
                onClick={() => scrollToSection('faq-container')}
                className="hidden sm:inline-block text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Dúvidas
              </button>
              <button
                id="btn-nav-waitlist"
                onClick={() => scrollToSection('principal-waitlist-box')}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/40"
              >
                Entrar na Lista
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="space-y-20 md:space-y-32 pb-24">
        <section aria-labelledby="hero-title" className="relative px-4 sm:px-6 lg:px-8 pt-10 md:pt-16 max-w-7xl mx-auto">
          <div className="absolute inset-0 bg-hero-glow -top-10 pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-nexa-purple/10 to-nexa-blue/10 border border-nexa-blue/20 text-xs text-nexa-blue font-bold tracking-wide w-fit mx-auto lg:mx-0 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-nexa-blue" />
                <span>Beta Fechado • Vagas Limitadas</span>
              </div>
              <h1 id="hero-title" className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-tight">
                Seja um dos primeiros a transformar <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexa-blue-dark to-nexa-purple">intenção em ação</span>
              </h1>
              <p className="text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Cadastre-se para acesso antecipado à Nexa e ajude a construir o futuro do produto que vai destravar a rotina de jovens mentes realizadoras.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400 stroke-[2.5]" />
                  <span><strong className="text-slate-800">500+ pessoas</strong> já se inscreveram</span>
                </div>
                <span className="hidden sm:inline text-slate-300">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400 stroke-[2.5]" />
                  <span>Apenas <strong className="text-slate-800">100 vagas</strong> restantes neste ciclo</span>
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={() => scrollToSection('principal-waitlist-box')}
                  className="w-full sm:w-auto bg-gradient-to-r from-nexa-blue-dark to-nexa-blue hover:from-nexa-blue hover:to-nexa-purple text-white text-sm font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-nexa-blue/30"
                >
                  Garantir Acesso Antecipado
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSd5wr-Gme_Jxih9MGAbh_HycSKYID_0cfDXA1JJVXI08hl52w/viewform?usp=dialog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-3.5 px-6 rounded-xl border border-slate-200 hover:border-slate-300 transition-all transform hover:-translate-y-0.5 active:scale-95 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  Responder Questionário Secundário
                  <ArrowUpRight className="w-4 h-4 ml-1.5 text-slate-500 opacity-80 transition-colors group-hover:text-slate-800" />
                </a>
              </div>
            </div>
            <div className="lg:col-span-5 flex justify-center">
              <NexaMockup />
            </div>
          </div>
        </section>

        <section id="porque-nexa" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-8">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-nexa-purple">O Dilema Fundamental</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight">
              Por que a maioria das ferramentas de produtividade falha?
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-nexa-blue to-nexa-purple mx-auto rounded-full" />
          </div>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            Gasto mental investido em organizar listas de tarefas frequentemente substitui o esforço real necessário para executá-las. Nos tornamos <strong className="text-slate-800">Humsters Digitais</strong>: acumulamos painéis robustos, categorizações extremas e tags, mas a ação imediata continua paralisada.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/50 text-left space-y-2">
              <span className="text-xs font-bold text-nexa-blue uppercase block font-mono">Pilar 01</span>
              <h3 className="font-display font-bold text-base text-slate-800">Simplicidade Operacional</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Interações de poucos cliques. Use e saia instantaneamente. O app trabalha para você, não o contrário.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/50 text-left space-y-2">
              <span className="text-xs font-bold text-nexa-purple uppercase block font-mono">Pilar 02</span>
              <h3 className="font-display font-bold text-base text-slate-800">Foco Absoluto em Ação</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                O Modo Foco Agora remove o ruído do dia, eliminando a sobrecarga de decisões ao destacar uma única atividade prioritária.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-200/50 text-left space-y-2">
              <span className="text-xs font-bold text-nexa-blue uppercase block font-mono">Pilar 03</span>
              <h3 className="font-display font-bold text-base text-slate-800">Design não Punitivo</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Nós premiamos a execução, não a catalogação de listas bonitas. Streaks e métricas flexíveis sem ansiedade psicológica.
              </p>
            </div>
          </div>
        </section>

        <section id="beneficios" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 scroll-mt-24">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-nexa-blue">Recompensa Antecipada</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight">
              O que você ganha participando do Beta?
            </h2>
            <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto">
              Ao apoiar as etapas de desenvolvimento iniciais, você é coroado com privilégios de fundação.
            </p>
          </div>
          <Features />
        </section>

        <section id="principal-waitlist-box" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-gradient-to-r from-nexa-blue/5 to-transparent p-4 rounded-2xl mb-2 flex items-center gap-3 border border-nexa-blue/10">
                <span className="w-2.5 h-2.5 rounded-full bg-nexa-blue animate-pulse" />
                <span className="text-xs font-semibold text-slate-600">
                  Preenchimento simplificado. Sem compromisso financeiro.
                </span>
              </div>
              <LeadForm onSuccess={handleLeadSuccess} savedLead={registeredLead} queuePosition={queuePosition} tier={tier} benefits={benefits} />
            </div>
            <div id="validation-section-container" className="lg:col-span-6 space-y-4 scroll-mt-24">
              <div>
                <span className="bg-nexa-purple/15 text-nexa-purple text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider block w-fit mb-2">
                  🎁 Bônus Exclusivo
                </span>
                <h3 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
                  Sua opinião molda a Nexa
                </h3>
                <p className="text-slate-500 text-sm mt-1 mb-4 leading-relaxed">
                  Responda nossa breve pesquisa de validação rápida ao lado e influencie diretamente o desenvolvimento das próximas interações de interface.
                </p>
              </div>
              <IdeaValidation emailInput={(registeredLead && registeredLead.email) || ''} onSurveyComplete={handleSurveyComplete} isCompletedBefore={surveyCompleted} />
            </div>
          </div>
        </section>

        <section id="como-funciona" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 scroll-mt-24">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-nexa-purple">Simples e Transparente</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight">
              Como funciona o Programa Beta da Nexa?
            </h2>
            <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto">
              Estrutura descomplicada pensada para não invadir o seu tempo.
            </p>
          </div>
          <Timeline />
        </section>

        <section id="depoimentos" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-nexa-blue">Nossas Mentes Early Adopters</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight">
              O que dizem os potenciais usuários da Nexa?
            </h2>
            <p className="text-slate-500 text-xs md:text-sm max-w-md mx-auto">
              Expectativas reais de pessoas cansadas de complexidades burocráticas em planners.
            </p>
          </div>
          <Reviews />
        </section>

        <section id="faq-container" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 scroll-mt-24">
          <div className="text-center space-y-3">
            <HelpCircle className="w-8 h-8 text-nexa-blue mx-auto mb-1 stroke-[1.5]" />
            <h2 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight">
              Dúvidas frequentes sobre o Beta Fechado
            </h2>
            <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto">
              Encontre respostas transparentes para as suas principais dúvidas.
            </p>
          </div>
          <FAQ />
        </section>

        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-center text-white border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-nexa-blue/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-nexa-purple/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <span className="text-[10px] sm:text-xs text-nexa-blue uppercase font-black tracking-widest bg-nexa-blue/15 border border-nexa-blue/30 px-3 py-1.5 rounded-full inline-block">
                Sua chamada para o amanhã
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                Não espere o futuro da produtividade. Ajude a construí-lo.
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Junte-se à fila fechada seletiva, co-desenvolva o Nexa App, destrave sua rotina focando no que realmente importa e garanta sua recompensa Pro vitalícia e ilimitada.
              </p>
              <button
                onClick={() => scrollToSection('principal-waitlist-box')}
                className="inline-flex bg-gradient-to-r from-nexa-blue to-nexa-purple hover:from-nexa-purple hover:to-nexa-blue text-white text-sm font-bold py-3.5 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-nexa-blue/30">
                Garantir Meu Lugar na Fila
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <NexaLogo />
            <p className="text-slate-400 text-[11px] font-semibold tracking-wide">MÍNIMO DE CLIQUES • MÁXIMO DE RESULTADO</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center text-xs font-semibold text-slate-500 hover:text-slate-800">
            <a href="#porque-nexa" className="hover:text-slate-800 transition-colors">Sobre</a>
            <a href="#beneficios" className="hover:text-slate-800 transition-colors">Privacidade</a>
            <a href="#faq-container" className="hover:text-slate-800 transition-colors">Contato</a>
          </div>
          <div className="text-center md:text-right space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/50 rounded text-[10px] text-slate-400 font-semibold tracking-tight">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
              <span>Selo de Conformidade LGPD & GDPR</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">&copy; {new Date().getFullYear()} Nexa App Inc. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
