/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LeadForm Component
 * 
 * Security features:
 *   - Honeypot field (website) para bot detection
 *   - Client-side validation + server-side validation
 *   - Sanitização de inputs
 *   - Proteção contra timing attacks (UI feedback)
 *   - Acessibilidade WCAG 2.1 AA
 */

import { useState, useEffect } from 'react';
import { Check, AlertCircle, ShieldCheck, Mail, User, Phone, Share2, Briefcase, Loader2, Send } from 'lucide-react';
import { emailService } from '../services/emailService.js';

export default function LeadForm({ onSuccess, savedLead, queuePosition, tier, benefits }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    socialMedia: '',
    profession: '',
    consent: false,
    // Honeypot field (oculto, deve permanecer vazio)
    website: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (savedLead) {
      setFormData({ ...savedLead, website: '' }); // Sempre inicia honeypot vazio
    }
  }, [savedLead]);

  /**
   * Formata número de telefone em padrão brasileiro (XX) XXXXX-XXXX.
   * @param {string} value
   * @returns {string}
   */
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      let formatted = numbers;
      if (numbers.length > 2) {
        formatted = `(${numbers.slice(0, 2)}) ` + numbers.slice(2);
      }
      if (numbers.length > 7) {
        formatted = `(${numbers.slice(0, 2)}) ` + numbers.slice(2, 7) + '-' + numbers.slice(7, 11);
      }
      return formatted;
    }
    return value.slice(0, 15);
  };

  const handlePhoneChange = (e) => {
    const rawVal = e.target.value;
    const formatted = formatPhone(rawVal);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (submitError) setSubmitError(null);
  };

  /**
   * Valida o formulário antes do envio.
   * Assume inputs maliciosos até prova contrária (defesa defensiva).
   *
   * @returns {boolean}
   */
  const validateForm = () => {
    const tempErrors = {};

    // Validação do nome completo
    if (!formData.fullName.trim()) {
      tempErrors.fullName = 'Por favor, insira seu nome completo.';
    } else if (formData.fullName.trim().split(/\s+/).length < 2) {
      tempErrors.fullName = 'Por favor, insira seu sobrenome também.';
    } else if (formData.fullName.length > 120) {
      tempErrors.fullName = 'Nome muito longo (máximo 120 caracteres).';
    }

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      tempErrors.email = 'Insira um endereço de e-mail válido.';
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = 'Formato de e-mail inválido.';
    } else if (formData.email.length > 254) {
      tempErrors.email = 'E-mail muito longo.';
    }

    // Validação de telefone
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone) {
      tempErrors.phone = 'O telefone é obrigatório.';
    } else if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      tempErrors.phone = 'Número de telefone inválido (10-15 dígitos).';
    }

    // Validação de rede social
    if (!formData.socialMedia) {
      tempErrors.socialMedia = 'Selecione sua rede preferencial.';
    }

    // Validação de profissão
    if (!formData.profession) {
      tempErrors.profession = 'Selecione seu perfil profissional.';
    }

    // Validação de consentimento
    if (!formData.consent) {
      tempErrors.consent = 'Você precisa aceitar receber as atualizações.';
    }

    // ─── HONEYPOT VALIDATION ───
    // Se o campo website (oculto) foi preenchido, é um bot
    if (formData.website && formData.website.length > 0) {
      // Log silencioso — não revela ao usuário que é um bot
      console.warn('[LeadForm] Honeypot triggered');
      // Retorna sucesso genérico para confundir bots
      setFormData((prev) => ({ ...prev, website: '' }));
      // Simula carregamento e retorna sucesso falso após delay
      return false; // Handled separately in handleSubmit
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Honeypot detection: se preenchido, simula sucesso mas não envia
    if (formData.website && formData.website.length > 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        // Simula falso sucesso — enganar bots
        onSuccess(formData, 9999, 'OBSERVER', {});
        setIsSubmitting(false);
      }, 2000);
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await emailService.sendLeadEmail({
        mode: 'beta',
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        socialMedia: formData.socialMedia,
        profession: formData.profession,
        consent: formData.consent,
      });

      if (result.success) {
        const pos = result.position || queuePosition;
        onSuccess(formData, pos, result.tier, result.benefits);
      } else {
        setSubmitError(result.message || 'Ocorreu um erro ao enviar. Tente novamente.');
      }
    } catch (error) {
      console.error('[LeadForm] Submission error');
      setSubmitError('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── SUCESSO: Mostrar confirmação ───
  if (savedLead && queuePosition) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-nexa-gray-light animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-nexa-blue/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-nexa-purple/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-6 border-4 border-emerald-50">
            <Check className="w-8 h-8 stroke-3" />
          </div>

          <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 tracking-wide">
            Inscrição Confirmada • # {queuePosition}
          </span>

          <h3 className="font-display font-bold text-2xl text-slate-800 tracking-tight mb-3">
            Você já está na lista de espera, {savedLead.fullName.split(' ')[0]}!
          </h3>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 max-w-sm">
            Guardamos o seu lugar na fila da produtividade sem punição. Em breve você receberá seu convite no e-mail <strong className="text-slate-800">{savedLead.email}</strong>.
          </p>

          <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 mb-8">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Posição na Fila:</span>
              <span className="font-mono font-bold text-nexa-blue">#{queuePosition}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Status do Acesso:</span>
              <span className="text-slate-700 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Aguardando Onboarding
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dados protegidos pelo protocolo LGPD</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORMULÁRIO: Estado inicial ───
  return (
    <form
      id="cadastro-beta-form"
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-nexa-gray-light relative transition-shadow hover:shadow-2xl"
      noValidate
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-nexa-blue/5 rounded-full blur-2xl pointer-events-none" />
      <div className="mb-6">
        <h3 className="font-display font-bold text-2xl text-slate-800 tracking-tight">
          Garanta seu acesso antecipado
        </h3>
        <p className="text-slate-500 text-sm mt-1">
          Preencha os campos abaixo e faça parte do fechado grupo de fundadores de rotina.
        </p>
      </div>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs" role="alert" aria-live="polite">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* ─── HONEYPOT FIELD (Oculto) ─── */}
      <input
        type="text"
        name="website"
        value={formData.website}
        onChange={handleChange}
        tabIndex="-1"
        autoComplete="off"
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: '0',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      <div className="space-y-4">
        <div>
          <label htmlFor="fullName" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-nexa-blue" />
            Nome completo
          </label>
          <div className="relative">
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              aria-required="true"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Ex: Amanda Silva"
              disabled={isSubmitting}
              maxLength="120"
              className={`w-full min-h-[44px] px-4 py-3 bg-slate-50 border rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:ring-2 disabled:opacity-50 ${
                errors.fullName
                  ? 'border-red-400 focus:ring-red-100 placeholder:text-red-300'
                  : 'border-slate-200 focus:ring-nexa-blue/10 focus:border-nexa-blue'
              }`}
            />
            {errors.fullName && (
              <div id="fullName-error" className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.fullName}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-nexa-blue" />
            E-mail profissional ou pessoal
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              value={formData.email}
              onChange={handleChange}
              placeholder="Ex: amanda@email.com"
              disabled={isSubmitting}
              maxLength="254"
              className={`w-full min-h-[44px] px-4 py-3 bg-slate-50 border rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:ring-2 disabled:opacity-50 ${
                errors.email
                  ? 'border-red-400 focus:ring-red-100 placeholder:text-red-300'
                  : 'border-slate-200 focus:ring-nexa-blue/10 focus:border-nexa-blue'
              }`}
            />
            {errors.email && (
              <div id="email-error" className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-nexa-blue" />
            WhatsApp ou telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="(99) 99999-9999"
            disabled={isSubmitting}
            maxLength="15"
            className={`w-full min-h-[44px] px-4 py-3 bg-slate-50 border rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:ring-2 disabled:opacity-50 ${
              errors.phone
                ? 'border-red-400 focus:ring-red-100 placeholder:text-red-300'
                : 'border-slate-200 focus:ring-nexa-blue/10 focus:border-nexa-blue'
            }`}
          />
          {errors.phone && (
            <div id="phone-error" className="flex items-center gap-1 mt-1 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.phone}</span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="socialMedia" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-nexa-blue" />
            Rede social principal
          </label>
          <select
            id="socialMedia"
            name="socialMedia"
            value={formData.socialMedia}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={!!errors.socialMedia}
            aria-describedby={errors.socialMedia ? 'socialMedia-error' : undefined}
            className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-nexa-blue/10 focus:border-nexa-blue disabled:opacity-50"
          >
            <option value="">Selecione</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter / X</option>
            <option value="outra">Outra</option>
          </select>
          {errors.socialMedia && (
            <div id="socialMedia-error" className="flex items-center gap-1 mt-1 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.socialMedia}</span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="profession" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-nexa-blue" />
            Perfil profissional
          </label>
          <select
            id="profession"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={!!errors.profession}
            aria-describedby={errors.profession ? 'profession-error' : undefined}
            className="w-full min-h-[44px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-nexa-blue/10 focus:border-nexa-blue disabled:opacity-50"
          >
            <option value="">Selecione</option>
            <option value="estudante">Estudante</option>
            <option value="profissional">Profissional</option>
            <option value="freelancer">Freelancer</option>
            <option value="outro">Outro</option>
          </select>
          {errors.profession && (
            <div id="profession-error" className="flex items-center gap-1 mt-1 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.profession}</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="relative flex items-start gap-3 cursor-pointer min-h-[44px] py-1">
            <input
              type="checkbox"
              name="consent"
              checked={formData.consent}
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={!!errors.consent}
              className="mt-1 w-5 h-5 shrink-0 accent-nexa-blue cursor-pointer focus:outline-none focus:ring-2 focus:ring-nexa-blue/30 rounded"
            />
            <span className="text-sm text-slate-500 leading-snug">
              Aceito receber atualizações sobre a Nexa e novidades do lançamento.
            </span>
          </label>
          {errors.consent && (
            <span className="text-red-500 text-xs block">{errors.consent}</span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-nexa-blue to-nexa-purple text-white text-base font-semibold py-3 transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-95 focus:outline-none focus:ring-2 focus:ring-nexa-blue/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            Enviando...
            <Loader2 className="w-4 h-4 animate-spin" />
          </>
        ) : (
          <>
            Entrar na Lista
            <Send className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
