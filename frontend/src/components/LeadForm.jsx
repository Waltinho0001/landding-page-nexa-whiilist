/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (savedLead) {
      setFormData(savedLead);
    }
  }, [savedLead]);

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

  const validateForm = () => {
    const tempErrors = {};
    if (!formData.fullName.trim()) {
      tempErrors.fullName = 'Por favor, insira seu nome completo.';
    } else if (formData.fullName.trim().split(' ').length < 2) {
      tempErrors.fullName = 'Por favor, insira seu sobrenome também.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      tempErrors.email = 'Insira um endereço de e-mail válido.';
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = 'Formato de e-mail inválido.';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!formData.phone) {
      tempErrors.phone = 'O telefone é obrigatório.';
    } else if (cleanPhone.length < 10) {
      tempErrors.phone = 'Número de telefone muito curto (mínimo 10 dígitos).';
    }

    if (!formData.socialMedia) {
      tempErrors.socialMedia = 'Selecione sua rede preferencial.';
    }
    if (!formData.profession) {
      tempErrors.profession = 'Selecione seu perfil profissional.';
    }
    if (!formData.consent) {
      tempErrors.consent = 'Você precisa aceitar receber as atualizações.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      console.error('[LeadForm] Erro no envio:', error);
      setSubmitError('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Você já está na lista de espera, {formData.fullName.split(' ')[0]}!
          </h3>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 max-w-sm">
            Guardamos o seu lugar na fila da produtividade sem punição. Em breve você receberá seu convite no e-mail <strong className="text-slate-800">{formData.email}</strong>.
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
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:bg-white focus:ring-2 disabled:opacity-50 ${
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
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:bg-white focus:ring-2 disabled:opacity-50 ${
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
            type="text"
            required
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="(99) 99999-9999"
            disabled={isSubmitting}
            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all focus:outline-none focus:bg-white focus:ring-2 disabled:opacity-50 ${
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
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nexa-blue/10 focus:border-nexa-blue"
          >
            <option value="">Selecione</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
            <option value="outra">Outra</option>
          </select>
          {errors.socialMedia && (
            <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
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
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-nexa-blue/10 focus:border-nexa-blue"
          >
            <option value="">Selecione</option>
            <option value="estudante">Estudante</option>
            <option value="profissional">Profissional</option>
            <option value="freelancer">Freelancer</option>
            <option value="outro">Outro</option>
          </select>
          {errors.profession && (
            <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.profession}</span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3">
          <label className="relative flex items-start gap-3">
            <input
              type="checkbox"
              name="consent"
              checked={formData.consent}
              onChange={handleChange}
              disabled={isSubmitting}
              className="mt-1 accent-nexa-blue"
            />
            <span className="text-xs text-slate-500 leading-snug">
              Aceito receber atualizações sobre a Nexa e novidades do lançamento.
            </span>
          </label>
          {errors.consent && <span className="text-red-500 text-xs mt-1">{errors.consent}</span>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-nexa-blue to-nexa-purple text-white font-semibold py-3 transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
