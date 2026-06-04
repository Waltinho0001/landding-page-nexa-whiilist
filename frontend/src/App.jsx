/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ArrowUp, HelpCircle } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Footer from './components/Footer.jsx';
import LeadForm from './components/LeadForm.jsx';
import IdeaValidation from './components/IdeaValidation.jsx';
import Features from './components/Features.jsx';
import Timeline from './components/Timeline.jsx';
import Reviews from './components/Reviews.jsx';
import FAQ from './components/FAQ.jsx';

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

    window.addEventListener('scroll', handleScroll, { passive: true });
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
    <div className="min-h-dvh bg-slate-50 text-slate-800 font-sans tracking-tight bg-dot-pattern overflow-x-hidden">
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Voltar para o topo"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-3 bg-white text-slate-700 hover:text-nexa-blue focus:text-nexa-blue border border-slate-200 shadow-lg rounded-full motion-safe:hover:scale-105 motion-safe:active:scale-95 transition-all z-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-nexa-blue/40"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

      <Navbar onNavigate={scrollToSection} />

      <main className="space-y-16 sm:space-y-20 md:space-y-32 pb-16 md:pb-24">
        <Hero onNavigate={scrollToSection} />

        <section id="porque-nexa" className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6 md:space-y-8 scroll-mt-24">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-nexa-purple">O Dilema Fundamental</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">
              Por que a maioria das ferramentas de produtividade falha?
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-nexa-blue to-nexa-purple mx-auto rounded-full" />
          </div>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            Gasto mental investido em organizar listas de tarefas frequentemente substitui o esforço real necessário para executá-las. Nos tornamos <strong className="text-slate-800">Humsters Digitais</strong>: acumulamos painéis robustos, categorizações extremas e tags, mas a ação imediata continua paralisada.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-4 md:pt-6">
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/50 text-left space-y-2">
              <span className="text-xs font-bold text-nexa-blue uppercase block font-mono">Pilar 01</span>
              <h3 className="font-display font-bold text-base md:text-lg text-slate-800">Simplicidade Operacional</h3>
              <p className="text-nexa-gray-muted text-sm leading-relaxed">
                Interações de poucos cliques. Use e saia instantaneamente. O app trabalha para você, não o contrário.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/50 text-left space-y-2">
              <span className="text-xs font-bold text-nexa-purple uppercase block font-mono">Pilar 02</span>
              <h3 className="font-display font-bold text-base md:text-lg text-slate-800">Foco Absoluto em Ação</h3>
              <p className="text-nexa-gray-muted text-sm leading-relaxed">
                O Modo Foco Agora remove o ruído do dia, eliminando a sobrecarga de decisões ao destacar uma única atividade prioritária.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/50 text-left space-y-2">
              <span className="text-xs font-bold text-nexa-blue uppercase block font-mono">Pilar 03</span>
              <h3 className="font-display font-bold text-base md:text-lg text-slate-800">Design não Punitivo</h3>
              <p className="text-nexa-gray-muted text-sm leading-relaxed">
                Nós premiamos a execução, não a catalogação de listas bonitas. Streaks e métricas flexíveis sem ansiedade psicológica.
              </p>
            </div>
          </div>
        </section>

        <section id="beneficios" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 md:space-y-12 scroll-mt-24">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-nexa-blue">Recompensa Antecipada</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">
              O que você ganha participando do Beta?
            </h2>
            <p className="text-nexa-gray-muted text-sm md:text-base max-w-md mx-auto">
              Ao apoiar as etapas de desenvolvimento iniciais, você é coroado com privilégios de fundação.
            </p>
          </div>
          <Features />
        </section>

        <section id="principal-waitlist-box" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-6 space-y-4 min-w-0">
              <div className="bg-gradient-to-r from-nexa-blue/5 to-transparent p-4 rounded-2xl mb-2 flex items-center gap-3 border border-nexa-blue/10">
                <span className="w-2.5 h-2.5 rounded-full bg-nexa-blue motion-safe:animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-slate-600">
                  Preenchimento simplificado. Sem compromisso financeiro.
                </span>
              </div>
              <LeadForm onSuccess={handleLeadSuccess} savedLead={registeredLead} queuePosition={queuePosition} tier={tier} benefits={benefits} />
            </div>
            <div id="validation-section-container" className="lg:col-span-6 space-y-4 scroll-mt-24 min-w-0">
              <div>
                <span className="bg-nexa-purple/15 text-nexa-purple text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider block w-fit mb-2">
                  🎁 Bônus Exclusivo
                </span>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-800 tracking-tight">
                  Sua opinião molda a Nexa
                </h3>
                <p className="text-nexa-gray-muted text-sm mt-1 mb-4 leading-relaxed">
                  Responda nossa breve pesquisa de validação abaixo e influencie diretamente o desenvolvimento das próximas interações de interface.
                </p>
              </div>
              <IdeaValidation emailInput={(registeredLead && registeredLead.email) || ''} onSurveyComplete={handleSurveyComplete} isCompletedBefore={surveyCompleted} />
            </div>
          </div>
        </section>

        <section id="como-funciona" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 md:space-y-12 scroll-mt-24">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-nexa-purple">Simples e Transparente</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">
              Como funciona o Programa Beta da Nexa?
            </h2>
            <p className="text-nexa-gray-muted text-sm md:text-base max-w-sm mx-auto">
              Estrutura descomplicada pensada para não invadir o seu tempo.
            </p>
          </div>
          <Timeline />
        </section>

        <section id="depoimentos" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 md:space-y-12 scroll-mt-24">
          <div className="text-center space-y-3">
            <span className="text-xs uppercase font-extrabold tracking-widest text-nexa-blue">Nossas Mentes Early Adopters</span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">
              O que dizem os potenciais usuários da Nexa?
            </h2>
            <p className="text-nexa-gray-muted text-sm md:text-base max-w-md mx-auto">
              Expectativas reais de pessoas cansadas de complexidades burocráticas em planners.
            </p>
          </div>
          <Reviews />
        </section>

        <section id="faq-container" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 md:space-y-12 scroll-mt-24">
          <div className="text-center space-y-3">
            <HelpCircle className="w-8 h-8 text-nexa-blue mx-auto mb-1 stroke-[1.5]" />
            <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">
              Dúvidas frequentes sobre o Beta Fechado
            </h2>
            <p className="text-nexa-gray-muted text-sm md:text-base max-w-sm mx-auto">
              Encontre respostas transparentes para as suas principais dúvidas.
            </p>
          </div>
          <FAQ />
        </section>

        <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-800 rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-12 text-center text-white border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-nexa-blue/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-nexa-purple/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-5 md:space-y-6 max-w-2xl mx-auto">
              <span className="text-[10px] sm:text-xs text-nexa-blue uppercase font-black tracking-widest bg-nexa-blue/15 border border-nexa-blue/30 px-3 py-1.5 rounded-full inline-block">
                Sua chamada para o amanhã
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
                Não espere o futuro da produtividade. Ajude a construí-lo.
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Junte-se à fila fechada seletiva, co-desenvolva o Nexa App, destrave sua rotina focando no que realmente importa e garanta sua recompensa Pro vitalícia e ilimitada.
              </p>
              <button
                type="button"
                onClick={() => scrollToSection('principal-waitlist-box')}
                className="inline-flex min-h-[44px] items-center justify-center bg-gradient-to-r from-nexa-blue to-nexa-purple hover:from-nexa-purple hover:to-nexa-blue focus:from-nexa-purple focus:to-nexa-blue text-white text-sm font-bold py-3.5 px-6 sm:px-8 rounded-xl shadow-lg transition-transform motion-safe:hover:scale-105 motion-safe:active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-nexa-blue/30"
              >
                Garantir Meu Lugar na Fila
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
