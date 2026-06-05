/**
 * src/services/emailService.js
 * Envio via Resend com escapeHtml em todos os inputs do usuário.
 * Referência: SECURITY_AUDIT_CHECKLIST.md — XSS em templates de e-mail.
 */

import { Resend } from 'resend';
import { escapeHtml } from '../utils/validation.js';

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('[emailService] RESEND_API_KEY não configurada');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

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
      </table>
      <p style="font-size:11px;color:#94a3b8;margin-top:12px;">${escapeHtml(timestamp)} (BRT)</p>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * @param {object} user
 * @param {number} position
 * @param {object} rewards
 */
export async function sendConfirmationEmail(user, position, rewards) {
  const corporateEmail = process.env.CORPORATE_EMAIL;
  const fromAddress = process.env.RESEND_FROM || 'Nexa App <onboarding@resend.dev>';

  let resend;
  try {
    resend = getResendClient();
  } catch (err) {
    console.error('[emailService] Config error');
    return;
  }

  const tierEmoji = getTierEmoji(rewards.tier);
  const emailPromises = [];

  emailPromises.push(
    resend.emails
      .send({
        from: fromAddress,
        to: [user.email],
        replyTo: corporateEmail || undefined,
        subject: `${tierEmoji} Você está na lista! Posição #${position} — Nexa Beta`,
        html: buildConfirmationEmail(user, position, rewards),
      })
      .then((result) => {
        if (result.error) {
          console.error('[emailService] User email failed');
        } else {
          console.info('[emailService] Confirmation email dispatched');
        }
      })
      .catch(() => {
        console.error('[emailService] User email exception');
      })
  );

  if (corporateEmail) {
    emailPromises.push(
      resend.emails
        .send({
          from: fromAddress,
          to: [corporateEmail],
          subject: `[Nexa] Novo ${rewards.tier} — posição #${position}`,
          html: buildInternalNotificationEmail(user, position, rewards),
        })
        .then((result) => {
          if (result.error) {
            console.error('[emailService] Internal notification failed');
          } else {
            console.info('[emailService] Internal notification dispatched');
          }
        })
        .catch(() => {
          console.error('[emailService] Internal notification exception');
        })
    );
  }

  await Promise.allSettled(emailPromises);
}
