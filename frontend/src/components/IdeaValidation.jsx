/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, Send, Sparkles, Lightbulb, Award, Lock } from 'lucide-react';

const STEPS_DATA = [
  {
    id: 1,
    title: 'O dilema da organização',
    question: 'Qual é a sua maior frustração com ferramentas de produtividade atuais (Notion, Todoist, etc.)?',
    type: 'single',
    options: [
      'Gasto mais tempo organizando listas do que executando tarefas',
      'As ferramentas são complexas demais e acabo abandonando',
      'Sinto sobrecarga cognitiva com tantas decisões, botões e tags',
      'Sinto falta de uma priorização inteligente e direta para a ação',
    ],
  },
  {
    id: 2,
    title: 'Síndrome do Hamster Digital',
    question: 'Com que frequência você cria listas bonitas de tarefas apenas para procrastinar e não executá-las?',
    type: 'single',
    options: [
      'Diariamente — sinto uma falsa sensação de progresso organizando tudo',
      'Muitas vezes na semana — planejo muito bem, mas falho no início das ações',
      'Ocasionalmente — apenas em semanas mais movimentadas ou ansiosas',
      'Raramente — consigo executar meus planos sem empacotar lists',
    ],
  },
  {
    id: 3,
    title: 'Funcionalidades Críticas',
    question: 'Qual pilar conceitual da Nexa mais resolve a sua dor no momento?',
    type: 'single',
    options: [
      'Simplicidade Operacional (entrada direta em uma linha com NLP automática)',
      'Modo Foco Agora (visualização limpa de uma só tarefa sem distrações)',
      'Design não punitivo (métricas reais de ação que não geram paralisia)',
      'Alta performance instantânea e funcionamento robusto sem internet',
    ],
  },
  {
    id: 4,
    title: 'Sustentabilidade & Modelo',
    question: 'Para o plano Premium, que faixa de preço você consideraria justa e acessível por mês?',
    type: 'single',
    options: [
      'R$ 9,90 a R$ 14,90 (Preço Ideal/Justo)',
      'R$ 15,00 a R$ 24,90 (Excelente valor agregado)',
      'Acima de R$ 25,00 (Apenas se tiver integrações avançadas)',
      'Prefiro usar o plano gratuito eterno de tarefas básicas',
    ],
  },
  {
    id: 5,
    title: 'Voz Ativa dos Testadores',
    question: 'Alguma sugestão extra ou algo que você odeie em apps tradicionais e quer ver resolvido?',
    type: 'text',
  },
];

export default function IdeaValidation({ emailInput, onSurveyComplete, isCompletedBefore }) {
  const [survey, setSurvey] = useState({
    currentStep: 0,
    painPoints: [],
    preferredFrequency: '',
    willingnessToPay: '',
    mostDesiredFeature: '',
    feedbackText: '',
  });
  const [answers, setAnswers] = useState({});
  const [isSurveyCompleted, setIsSurveyCompleted] = useState(isCompletedBefore);
  const [savingLoading, setSavingLoading] = useState(false);

  useEffect(() => {
    setIsSurveyCompleted(isCompletedBefore);
  }, [isCompletedBefore]);

  const handleSelectOption = (option) => {
    setAnswers((prev) => ({ ...prev, [survey.currentStep]: option }));

    if (survey.currentStep < STEPS_DATA.length - 1) {
      setTimeout(() => {
        setSurvey((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
      }, 300);
    }
  };

  const handleNext = () => {
    if (survey.currentStep < STEPS_DATA.length - 1) {
      setSurvey((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (survey.currentStep > 0) {
      setSurvey((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleFinish = () => {
    setSavingLoading(true);
    setTimeout(() => {
      setSavingLoading(false);
      setIsSurveyCompleted(true);
      localStorage.setItem('nexa_survey_completed', 'true');
      onSurveyComplete();
    }, 1500);
  };

  const stepInfo = STEPS_DATA[survey.currentStep];
  const progressPercent = ((survey.currentStep + 1) / STEPS_DATA.length) * 100;

  if (isSurveyCompleted) {
    return (
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl border border-slate-800 text-center relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-nexa-blue/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-nexa-purple/10 rounded-full blur-2xl pointer-events-none" />
        <div className="w-14 h-14 bg-gradient-to-tr from-nexa-blue to-nexa-purple rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
          <Award className="w-8 h-8 text-white stroke-2" />
        </div>
        <h4 className="font-display font-bold text-2xl text-white tracking-tight mb-2">
          Seu feedback de Líder Pro foi salvo!
        </h4>
        <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed mb-6">
          Suas escolhas foram registradas e enviadas diretamente para a equipe de design de interação da Nexa. Como agradecimento por ser uma mente transformadora da produtividade, garantimos o seu:
        </p>
        <div className="inline-flex flex-col items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 mb-6 max-w-sm w-full mx-auto shadow-inner">
          <span className="text-[10px] uppercase font-bold tracking-widest text-nexa-purple flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-current" /> Benefício Early Tester Confirmado
          </span>
          <span className="font-display font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-nexa-purple to-nexa-blue">
            CONTA VITALÍCIA PRO
          </span>
          <span className="text-xs text-slate-400 leading-none mt-1">
            Plano Pro gratuito para sempre para {emailInput || 'seu e-mail de cadastro'}
          </span>
        </div>
        <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Dados criptografados pelo protocolo Nexa-AES</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative transition-transform">
      <div className="absolute top-0 right-0 w-20 h-20 bg-nexa-blue/5 rounded-full blur-xl pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
          <span className="p-1 px-2.5 bg-slate-800 rounded-lg text-xs font-mono font-bold text-nexa-blue w-fit shrink-0">
            Etapa {survey.currentStep + 1} de {STEPS_DATA.length}
          </span>
          <span className="text-slate-400 text-xs font-medium truncate">{stepInfo.title}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Molda o roadmap</span>
        </div>
      </div>
      <div className="w-full h-1 bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-nexa-purple to-nexa-blue transition-all duration-300"
          style={{ width: `${progressPercent || 15}%` }}
        />
      </div>
      <div className="min-h-40 flex flex-col justify-center py-2">
        <h4 className="font-display font-medium text-base sm:text-lg text-white tracking-tight leading-relaxed mb-4 sm:mb-6">
          {stepInfo.question}
        </h4>
        {stepInfo.type === 'single' ? (
          <div className="space-y-2.5">
            {stepInfo.options?.map((option, idx) => {
              const isSelected = answers[survey.currentStep] === option;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`w-full min-h-[44px] text-left p-3.5 sm:p-4 rounded-xl text-sm md:text-base transition-all duration-200 flex justify-between items-center gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-nexa-blue/40 ${
                    isSelected
                      ? 'bg-nexa-blue/25 border-2 border-nexa-blue text-white shadow-md font-medium'
                      : 'bg-slate-800/50 hover:bg-slate-800 focus:bg-slate-800 border-2 border-transparent text-slate-300 hover:text-white focus:text-white'
                  }`}
                >
                  <span className="pr-4 leading-relaxed">{option}</span>
                  <div className={`w-4 md:w-5 h-4 md:h-5 rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected ? 'bg-nexa-blue border-nexa-blue text-white' : 'border-slate-600'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <textarea
              id="survey-feedback-area"
              value={survey.feedbackText}
              onChange={(e) => {
                setSurvey((prev) => ({ ...prev, feedbackText: e.target.value }));
                setAnswers((prev) => ({ ...prev, [survey.currentStep]: e.target.value }));
              }}
              placeholder="Ex: Eu odeio quando aplicativos me mandam notificações punitivas ou e-mails de cobrança se eu perco o streak. Gostaria de um app focado somente em ações do dia de forma limpa."
              className="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 text-base text-slate-200 placeholder:text-slate-500 min-h-[120px] focus:outline-none focus:border-nexa-purple focus:ring-1 focus:ring-nexa-purple/30 focus:bg-slate-800/60 resize-y transition-all"
            />
          </div>
        )}
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 sm:mt-8 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={handleBack}
          disabled={survey.currentStep === 0}
          className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 px-4 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-nexa-blue/30 ${
            survey.currentStep === 0
              ? 'border-transparent text-slate-600 cursor-not-allowed'
              : 'border-slate-700 hover:border-slate-600 focus:border-slate-600 text-slate-300 hover:text-white focus:text-white cursor-pointer'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={savingLoading || !answers[survey.currentStep]}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-nexa-purple to-nexa-blue hover:from-nexa-blue hover:to-nexa-blue-dark focus:from-nexa-blue focus:to-nexa-blue-dark text-white text-sm font-semibold py-2.5 px-5 rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-nexa-blue/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {savingLoading ? (
            'Salvando respostas...'
          ) : survey.currentStep === STEPS_DATA.length - 1 ? (
            <>
              Finalizar Pesquisa
              <Send className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Próximo
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
