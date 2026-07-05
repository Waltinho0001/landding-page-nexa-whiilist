/**
 * src/services/emailService.js
 * Envio via Resend com escapeHtml em todos os inputs do usuário.
 * Referência: SECURITY_AUDIT_CHECKLIST.md — XSS em templates de e-mail.
 *
 * SANDBOX MODE: No plano Free do Resend, e-mails só podem ser enviados
 * para endereços verificados em Settings → Verified Emails.
 * Por isso, esta versão envia APENAS para CORPORATE_EMAIL (notificação
 * interna do founder), usando o domínio sandbox oficial (onboarding@resend.dev).
 */

import { Resend } from 'resend';
import { escapeHtml } from '../utils/validation.js';

// ─── Resend Client Singleton ────────────────────────────────────────────────

let resendClient = null;

/**
 * Retorna o Resend client singleton.
 * @returns {{ client: Resend | null, error: string | null }}
 */
function getResendClient() {
  if (resendClient) {
    return { client: resendClient, error: null };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { client: null, error: 'RESEND_API_KEY não configurada' };
  }

  resendClient = new Resend(apiKey);
  return { client: resendClient, error: null };
}

// ─── Helpers de Formatação ──────────────────────────────────────────────────

function getBRTTimestamp() {
  return new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTierColor(tier) {
  const colors = { ELITE: '#f59e0b', FOUNDER: '#8958f3', OBSERVER: '#197cf7' };
  return colors[tier] ?? colors.OBSERVER;
}

function getTierEmoji(tier) {
  const emojis = { ELITE: '⚡', FOUNDER: '🚀', OBSERVER: '🌟' };
  return emojis[tier] ?? emojis.OBSERVER;
}

function buildDataRow(label, value) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:10px 20px;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">${escapeHtml(label)}</span>
        <div style="font-size:14px;color:#1e293b;margin-top:3px;font-weight:500;">${escapeHtml(value)}</div>
      </td>
    </tr>`;
}

function buildPerkRow(perk) {
  return `
    <tr>
      <td style="padding:5px 20px;">
        <span style="font-size:13px;color:#334155;line-height:1.6;">✅ ${escapeHtml(perk)}</span>
      </td>
    </tr>`;
}

// ─── Templates de E-mail ────────────────────────────────────────────────────

function buildConfirmationEmail(user, position, rewards) {
  const timestamp = getBRTTimestamp();
  const tierColor = getTierColor(rewards.tier);
  const tierEmoji = getTierEmoji(rewards.tier);
  const discountPercent = Math.round(rewards.lifetimeDiscount * 100);
  const perksHtml = rewards.perks.map(buildPerkRow).join('');
  const firstName = escapeHtml(user.fullName).split(' ')[0] ?? 'Usuário';
  const tierLabel = escapeHtml(rewards.label);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Bem-vindo ao Beta da Nexa!</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
        <tr>
          <td style="background:linear-gradient(135deg,#0582da,#197cf7,#8958f3);padding:32px;">
            <div style="font-size:26px;font-weight:900;color:#ffffff;">NEXA</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.70);margin-top:4px;">MÍNIMO DE CLIQUES • MÁXIMO DE RESULTADO</div>
            <div style="margin-top:12px;display:inline-block;background:rgba(255,255,255,0.15);border-radius:20px;padding:6px 16px;">
              <span style="font-size:12px;font-weight:700;color:#ffffff;">${tierEmoji} ${tierLabel}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 0;">
            <h1 style="margin:0;font-size:22px;color:#0f172a;">Você está na lista, ${firstName}!</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#64748b;">Sua inscrição no Beta Fechado da Nexa foi confirmada.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;">
            <table width="100%" style="background:#f0f9ff;border:2px solid ${tierColor}30;border-radius:14px;">
              <tr><td style="padding:20px;text-align:center;">
                <div style="font-size:11px;font-weight:700;color:#64748b;">SUA POSIÇÃO NA FILA</div>
                <div style="font-size:48px;font-weight:900;color:${tierColor};">#${position}</div>
                <div style="font-size:11px;font-weight:700;color:${tierColor};">${tierEmoji} Tier ${escapeHtml(rewards.tier)}</div>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 8px;">
            <table width="100%" style="border:1px solid #e2e8f0;border-radius:12px;">
              ${buildDataRow('Nome', user.fullName)}
              ${buildDataRow('E-mail', user.email)}
              ${user.phone ? buildDataRow('Telefone', user.phone) : ''}
              ${user.profession ? buildDataRow('Perfil', user.profession) : ''}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;">
            <table width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
              <tr><td style="padding:12px 20px;">
                <div style="font-size:20px;font-weight:800;color:${tierColor};">${discountPercent}% OFF vitalício</div>
                <div style="font-size:20px;font-weight:800;color:${tierColor};margin-top:8px;">${rewards.premiumMonths} meses premium</div>
              </td></tr>
              ${perksHtml}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">Inscrito em: ${escapeHtml(timestamp)} (BRT) • LGPD &amp; GDPR</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildInternalNotificationEmail(user, position, rewards) {
  const timestamp = getBRTTimestamp();
  const tierColor = getTierColor(rewards.tier);
  const tierEmoji = getTierEmoji(rewards.tier);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Novo Beta Tester</title></head>
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" style="max-width:540px;margin:0 auto;background:#fff;border-radius:16px;">
    <tr><td style="background:linear-gradient(135deg,#0582da,#8958f3);padding:20px;color:#fff;font-weight:800;">NEXA — ${tierEmoji} ${escapeHtml(rewards.tier)} #${position}</td></tr>
    <tr><td style="padding:20px;">
      <table width="100%" style="border:1px solid #e2e8f0;border-radius:10px;">
        ${buildDataRow('Nome', user.fullName)}
        ${buildDataRow('E-mail', user.email)}
        ${user.phone ? buildDataRow('Telefone', user.phone) : ''}
        ${user.socialMedia ? buildDataRow('Rede Social', user.socialMedia) : ''}
        ${user.profession ? buildDataRow('Perfil', user.profession) : ''}
        ${user.lossExperience ? buildDataRow('Prejuízo (Filtro)', user.lossExperience) : ''}
      </table>
      <p style="font-size:11px;color:#94a3b8;margin-top:12px;">${escapeHtml(timestamp)} (BRT)</p>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Função Principal ───────────────────────────────────────────────────────

/**
 * Envia notificação interna ao founder sobre novo registro.
 *
 * MODO SANDBOX (Resend Free):
 * - Remetente: onboarding@resend.dev (domínio sandbox oficial do Resend)
 * - Destinatário: APENAS process.env.CORPORATE_EMAIL (deve estar verificado
 *   em https://resend.com/settings/emails)
 * - NÃO envia para user.email (destinatário não verificado = rejeitado pelo Resend)
 *
 * Quando o projeto migrar para domínio verificado (ex: mail.nexa.app):
 * - Alterar `from` para o domínio próprio
 * - Adicionar envio para user.email (buildConfirmationEmail)
 *
 * @param {object} user       — Registro do banco (fullName, email, phone, etc.)
 * @param {number} position   — Posição na fila
 * @param {object} rewards    — Tier/benefícios calculados
 * @returns {Promise<{ success: boolean, reason: string, messageId?: string }>}
 */
export async function sendConfirmationEmail(user, position, rewards) {
  const corporateEmail = process.env.CORPORATE_EMAIL;

  // ── Validação 1: CORPORATE_EMAIL deve existir ─────────────────────────
  if (!corporateEmail) {
    console.warn('[emailService] CORPORATE_EMAIL não configurada — e-mail ignorado');
    return {
      success: false,
      reason: 'CORPORATE_EMAIL não configurada',
    };
  }

  // ── Validação 2: Resend client deve inicializar ───────────────────────
  const { client: resend, error: clientError } = getResendClient();
  if (!resend) {
    console.error(`[emailService] Config error: ${clientError}`);
    return {
      success: false,
      reason: clientError,
    };
  }

  // ── Montar e enviar notificação interna ────────────────────────────────
  const tierEmoji = getTierEmoji(rewards.tier);

  try {
    const result = await resend.emails.send({
      from: 'Nexa Beta <onboarding@resend.dev>',
      to: [corporateEmail],
      subject: `${tierEmoji} [Nexa] Novo ${rewards.tier} — #${position} — ${escapeHtml(user.fullName)}`,
      html: buildInternalNotificationEmail(user, position, rewards),
    });

    // Resend v3+ retorna { data, error }
    if (result.error) {
      console.error('[emailService] Resend API rejected:', {
        statusCode: result.error.statusCode ?? 'N/A',
        name: result.error.name ?? 'UnknownError',
        message: result.error.message ?? 'Sem detalhes',
      });
      return {
        success: false,
        reason: `Resend API error: ${result.error.name ?? 'unknown'}`,
      };
    }

    const messageId = result.data?.id ?? 'unknown';
    console.info(`[emailService] Internal notification sent — messageId: ${messageId}`);

    return {
      success: true,
      reason: 'Internal notification dispatched',
      messageId,
    };
  } catch (err) {
    // Erros de rede, timeout, SDK crash — nunca deve quebrar o registro
    console.error('[emailService] Unexpected exception:', {
      name: err.name ?? 'Error',
      message: err.message ?? 'Sem detalhes',
      // NÃO logar stack completo nem env vars em produção
    });

    return {
      success: false,
      reason: `Exception: ${err.message ?? 'unknown'}`,
    };
  }
}
