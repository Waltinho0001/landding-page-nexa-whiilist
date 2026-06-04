/**
 * src/services/emailService.js
 * Envio de e-mail de confirmação via Resend SDK.
 *
 * Security:
 *   - Escaping HTML de todos os user inputs
 *   - Error handling seguro (sem exposição de API keys)
 *   - Template sanitizado contra XSS
 */

import { Resend } from 'resend';
import { escapeHtml } from '../utils/validation.js';

let resendClient = null;

/**
 * Inicializa cliente Resend de forma segura.
 * Nunca expõe RESEND_API_KEY em logs ou erros.
 *
 * @throws {Error}
 * @returns {Resend}
 */
function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.length === 0) {
      throw new Error('[emailService] Configuration error: API key missing');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Formata timestamp no fuso horário de Brasília.
 * @returns {string}
 */
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

/**
 * Retorna cor hexadecimal associada ao tier.
 * @param {string} tier
 * @returns {string}
 */
function getTierColor(tier) {
  const colors = {
    ELITE: '#f59e0b',
    FOUNDER: '#8958f3',
    OBSERVER: '#197cf7',
  };
  return colors[tier] ?? colors.OBSERVER;
}

/**
 * Retorna emoji associado ao tier.
 * @param {string} tier
 * @returns {string}
 */
function getTierEmoji(tier) {
  const emojis = {
    ELITE: '⚡',
    FOUNDER: '🚀',
    OBSERVER: '🌟',
  };
  return emojis[tier] ?? emojis.OBSERVER;
}

/**
 * Constrói linha de dado no template HTML com escaping.
 * Previne XSS: todos os valores são escapados.
 *
 * @param {string} label
 * @param {string|undefined} value
 * @returns {string}
 */
function buildDataRow(label, value) {
  if (!value) return '';
  // Escapa HTML para segurança
  const escapedLabel = escapeHtml(label);
  const escapedValue = escapeHtml(value);

  return `
    <tr>
      <td style="padding:10px 20px;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">${escapedLabel}</span>
        <div style="font-size:14px;color:#1e293b;margin-top:3px;font-weight:500;">${escapedValue}</div>
      </td>
    </tr>`;
}

/**
 * Constrói linha de benefício no template HTML.
 * @param {string} perk
 * @returns {string}
 */
function buildPerkRow(perk) {
  const escapedPerk = escapeHtml(perk);
  return `
    <tr>
      <td style="padding:5px 20px;">
        <span style="font-size:13px;color:#334155;line-height:1.6;">
          ✅ ${escapedPerk}
        </span>
      </td>
    </tr>`;
}

/**
 * Constrói template HTML do e-mail de confirmação.
 * Todos os valores são escapados contra XSS.
 *
 * @param {object} user
 * @param {number} position
 * @param {object} rewards
 * @returns {string}
 */
function buildConfirmationEmail(user, position, rewards) {
  const timestamp = getBRTTimestamp();
  const tierColor = getTierColor(rewards.tier);
  const tierEmoji = getTierEmoji(rewards.tier);
  const discountPercent = Math.round(rewards.lifetimeDiscount * 100);
  const perksHtml = rewards.perks.map(buildPerkRow).join('');

  // Escapa valores de usuário
  const escapedFullName = escapeHtml(user.fullName);
  const escapedEmail = escapeHtml(user.email);
  const escapedPhone = user.phone ? escapeHtml(user.phone) : null;
  const escapedProfession = user.profession ? escapeHtml(user.profession) : null;

  // Extrai primeiro nome de forma segura
  const firstName = escapedFullName.split(' ')[0] ?? 'Usuário';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Bem-vindo ao Beta da Nexa!</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

          <!-- Header com gradiente -->
          <tr>
            <td style="background:linear-gradient(135deg,#0582da 0%,#197cf7 45%,#8958f3 100%);padding:32px;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.04em;">NEXA</div>
                    <div style="font-size:10px;color:rgba(255,255,255,0.70);margin-top:2px;letter-spacing:0.12em;font-weight:600;">MÍNIMO DE CLIQUES • MÁXIMO DE RESULTADO</div>
                  </td>
                  <td align="right">
                    <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.30);border-radius:20px;padding:6px 16px;">
                      <span style="font-size:12px;font-weight:700;color:#ffffff;">${tierEmoji} ${rewards.label}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Saudação -->
          <tr>
            <td style="padding:28px 32px 0;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
                Você está na lista, ${firstName}! 🎉
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:#64748b;line-height:1.6;">
                Sua inscrição no Beta Fechado da <strong style="color:#197cf7;">Nexa</strong> foi confirmada com sucesso.
                Você já tem seu lugar reservado na fila de acesso antecipado.
              </p>
            </td>
          </tr>

          <!-- Card de posição e tier -->
          <tr>
            <td style="padding:20px 32px;">
              <table width="100%" style="background:linear-gradient(135deg,#f8fafc,#f0f9ff);border:2px solid ${tierColor}30;border-radius:14px;overflow:hidden;">
                <tr>
                  <td style="padding:20px;" align="center">
                    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Sua Posição na Fila</div>
                    <div style="font-size:48px;font-weight:900;color:${tierColor};line-height:1;">#${position}</div>
                    <div style="margin-top:10px;display:inline-block;background:${tierColor}15;color:${tierColor};font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;border:1px solid ${tierColor}30;">
                      ${tierEmoji} Tier ${rewards.tier}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dados cadastrais -->
          <tr>
            <td style="padding:0 32px 8px;">
              <h3 style="margin:0 0 10px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Seus Dados</h3>
              <table width="100%" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                ${buildDataRow('Nome', escapedFullName)}
                ${buildDataRow('E-mail', escapedEmail)}
                ${escapedPhone ? buildDataRow('Telefone / WhatsApp', escapedPhone) : ''}
                ${escapedProfession ? buildDataRow('Perfil Profissional', escapedProfession) : ''}
              </table>
            </td>
          </tr>

          <!-- Benefícios -->
          <tr>
            <td style="padding:16px 32px 8px;">
              <h3 style="margin:0 0 10px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Seus Benefícios como ${rewards.tier}</h3>
              <table width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 20px 4px;">
                    <div style="font-size:20px;font-weight:800;color:${tierColor};">${discountPercent}% OFF</div>
                    <div style="font-size:11px;color:#64748b;">Desconto vitalício no plano Pro</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 20px 12px;">
                    <div style="font-size:20px;font-weight:800;color:${tierColor};">${rewards.premiumMonths} meses</div>
                    <div style="font-size:11px;color:#64748b;">De acesso premium gratuito</div>
                  </td>
                </tr>
                ${perksHtml}
              </table>
            </td>
          </tr>

          <!-- Próximos passos -->
          <tr>
            <td style="padding:16px 32px;">
              <div style="background:#eff6ff;border-left:4px solid #197cf7;border-radius:8px;padding:14px 16px;">
                <div style="font-size:12px;font-weight:700;color:#197cf7;margin-bottom:4px;">📬 Próximos Passos</div>
                <p style="margin:0;font-size:13px;color:#334155;line-height:1.6;">
                  Em breve você receberá um novo e-mail com o convite de acesso à plataforma.
                  Fique de olho na sua caixa de entrada!
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <table width="100%">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                      📅 Inscrito em: <strong style="color:#64748b;">${timestamp} (BRT)</strong><br/>
                      🔐 Dados protegidos conforme LGPD &amp; GDPR
                    </p>
                  </td>
                  <td align="right">
                    <div style="font-size:10px;color:#cbd5e1;font-weight:700;letter-spacing:0.08em;">NEXA APP © ${new Date().getFullYear()}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Constrói template HTML do e-mail interno de notificação (para equipe).
 * Também com escaping de segurança.
 *
 * @param {object} user
 * @param {number} position
 * @param {object} rewards
 * @returns {string}
 */
function buildInternalNotificationEmail(user, position, rewards) {
  const timestamp = getBRTTimestamp();
  const tierColor = getTierColor(rewards.tier);
  const tierEmoji = getTierEmoji(rewards.tier);

  // Escapa valores
  const escapedFullName = escapeHtml(user.fullName);
  const escapedEmail = escapeHtml(user.email);
  const escapedPhone = user.phone ? escapeHtml(user.phone) : null;
  const escapedSocial = user.socialMedia ? escapeHtml(user.socialMedia) : null;
  const escapedProfession = user.profession ? escapeHtml(user.profession) : null;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/><title>Novo Beta Tester – ${rewards.tier}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:540px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0582da,#8958f3);padding:20px 28px;">
              <span style="font-size:18px;font-weight:800;color:#fff;">NEXA</span>
              <span style="float:right;background:rgba(255,255,255,0.2);color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);">
                ${tierEmoji} ${rewards.tier} — #${position}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 8px;">
              <h2 style="margin:0;font-size:16px;color:#0f172a;">🎯 Novo Beta Tester Registrado</h2>
              <p style="font-size:13px;color:#64748b;margin:4px 0 0;">Posição <strong style="color:${tierColor};">#${position}</strong> — Tier <strong style="color:${tierColor};">${rewards.tier}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 20px;">
              <table width="100%" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                ${buildDataRow('Nome', escapedFullName)}
                ${buildDataRow('E-mail', escapedEmail)}
                ${escapedPhone ? buildDataRow('Telefone', escapedPhone) : ''}
                ${escapedSocial ? buildDataRow('Rede Social', escapedSocial) : ''}
                ${escapedProfession ? buildDataRow('Perfil', escapedProfession) : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:14px 28px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">📅 ${timestamp} (BRT) • 🔐 LGPD</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


/**
 * Envia e-mail de confirmação para o usuário e notificação interna para a equipe.
 * Execução não-bloqueante — erros são logados mas não propagados ao caller.
 *
 * @param {object} user  - Dados do usuário salvo no banco
 * @param {number} position - Posição na fila
 * @param {object} rewards  - Tier e benefícios atribuídos
 * @returns {Promise<void>}
 */
export async function sendConfirmationEmail(user, position, rewards) {
  const corporateEmail = process.env.CORPORATE_EMAIL;
  if (!corporateEmail) {
    console.warn('[emailService] CORPORATE_EMAIL não configurado — e-mail interno não enviado.');
  }

  let resend;
  try {
    resend = getResendClient();
  } catch (err) {
    console.error('[emailService] Falha ao inicializar Resend:', err.message);
    return;
  }

  const tierEmoji = getTierEmoji(rewards.tier);
  const senderName = 'Nexa App';
  const senderAddress = 'onboarding@resend.dev';

  const emailPromises = [];

  // E-mail de confirmação para o usuário
  emailPromises.push(
    resend.emails.send({
      from: `${senderName} <${senderAddress}>`,
      to: [user.email],
      replyTo: corporateEmail || undefined,
      subject: `${tierEmoji} Você está na lista! Sua posição é #${position} — Nexa Beta`,
      html: buildConfirmationEmail(user, position, rewards),
    }).then((result) => {
      if (result.error) {
        console.error('[emailService] Erro ao enviar e-mail para usuário:', result.error);
      } else {
        console.log(`[emailService] E-mail de confirmação enviado para ${user.email} (ID: ${result.data?.id})`);
      }
    }).catch((err) => {
      console.error('[emailService] Exceção ao enviar e-mail para usuário:', err.message);
    })
  );

  // E-mail de notificação interna (para a equipe)
  if (corporateEmail) {
    emailPromises.push(
      resend.emails.send({
        from: `${senderName} <${senderAddress}>`,
        to: [corporateEmail],
        replyTo: user.email,
        subject: `[Nexa] Novo ${rewards.tier}: ${user.fullName} — #${position}`,
        html: buildInternalNotificationEmail(user, position, rewards),
      }).then((result) => {
        if (result.error) {
          console.error('[emailService] Erro ao enviar notificação interna:', result.error);
        } else {
          console.log(`[emailService] Notificação interna enviada (ID: ${result.data?.id})`);
        }
      }).catch((err) => {
        console.error('[emailService] Exceção ao enviar notificação interna:', err.message);
      })
    );
  }

  // Fire-and-forget — não bloqueia a resposta da API
  Promise.allSettled(emailPromises).catch(() => {});
}
