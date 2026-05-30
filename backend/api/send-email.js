/**
 * Nexa – Serverless Function: /api/send-email
 * Compatível com Vercel Node.js Runtime.
 * Recebe dados de lead, valida, e envia e-mail formatado via Resend.
 */

import { Resend } from 'resend';

const ALLOWED_ORIGINS = [
  process.env.DOMAIN || '',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

function setCORSHeaders(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body inválido.' };
  }

  const b = body;

  if (!b.fullName || typeof b.fullName !== 'string' || b.fullName.trim().length < 3) {
    return { valid: false, error: "Campo 'fullName' inválido (mínimo 3 caracteres)." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!b.email || typeof b.email !== 'string' || !emailRegex.test(b.email)) {
    return { valid: false, error: "Campo 'email' inválido." };
  }

  if (b.mode !== 'beta' && b.mode !== 'validation') {
    return { valid: false, error: "Campo 'mode' deve ser 'beta' ou 'validation'." };
  }

  return {
    valid: true,
    data: {
      mode: b.mode,
      fullName: b.fullName.trim(),
      email: b.email.trim().toLowerCase(),
      phone: typeof b.phone === 'string' ? b.phone.trim() : undefined,
      socialMedia: typeof b.socialMedia === 'string' ? b.socialMedia.trim() : undefined,
      profession: typeof b.profession === 'string' ? b.profession.trim() : undefined,
      message: typeof b.message === 'string' ? b.message.trim() : undefined,
      surveyAnswers: typeof b.surveyAnswers === 'object' ? b.surveyAnswers : undefined,
    },
  };
}

function buildCard(label, value) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;">
        <span style="font-size:11px;font-weight:700;color:#73868b;text-transform:uppercase;letter-spacing:0.05em;">${label}</span>
        <div style="font-size:14px;color:#1e293b;margin-top:4px;font-weight:500;">${value}</div>
      </td>
    </tr>
  `;
}

function buildSurveySection(answers) {
  if (!answers || Object.keys(answers).length === 0) return '';
  const rows = Object.entries(answers)
    .map(
      ([step, answer]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;">
          <span style="font-size:11px;font-weight:700;color:#8958f3;text-transform:uppercase;">Etapa ${Number(step) + 1}</span>
          <div style="font-size:13px;color:#334155;margin-top:4px;line-height:1.5;">${answer}</div>
        </td>
      </tr>
    `
    )
    .join('');
  return `
    <tr><td style="padding:16px 16px 4px;"><h3 style="margin:0;font-size:13px;font-weight:700;color:#8958f3;text-transform:uppercase;letter-spacing:0.08em;">Respostas da Pesquisa</h3></td></tr>
    ${rows}
  `;
}

function buildHtmlEmail(data) {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const modeLabel = data.mode === 'beta' ? 'Beta Tester' : 'Validação de Ideia';
  const modeColor = data.mode === 'beta' ? '#197cf7' : '#8958f3';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Novo Lead Nexa – ${modeLabel}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0582da 0%,#197cf7 50%,#8958f3 100%);padding:28px 32px 24px;">
              <table width="100%">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.03em;">NEXA</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.75);margin-top:2px;letter-spacing:0.1em;font-weight:600;">MÍNIMO DE CLIQUES • MÁXIMO DE RESULTADO</div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:rgba(255,255,255,0.18);color:#ffffff;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.3);letter-spacing:0.05em;">
                      ${modeLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              <h2 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">
                🎯 Novo Lead Capturado
              </h2>
              <p style="margin:6px 0 0;font-size:13px;color:#64748b;">
                Um novo usuário se inscreveu via formulário de <strong style="color:${modeColor};">${modeLabel}</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;">
              <table width="100%" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                ${buildCard('Nome Completo', data.fullName)}
                ${buildCard('E-mail', data.email)}
                ${data.phone ? buildCard('Telefone / WhatsApp', data.phone) : ''}
                ${data.socialMedia ? buildCard('Rede Social', data.socialMedia) : ''}
                ${data.profession ? buildCard('Perfil Profissional', data.profession) : ''}
                ${data.message ? buildCard('Mensagem / Feedback', data.message) : ''}
                ${data.surveyAnswers ? buildSurveySection(data.surveyAnswers) : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e2e8f0;">
              <table width="100%">
                <tr>
                  <td>
                    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                      📅 Recebido em: <strong style="color:#64748b;">${timestamp} (BRT)</strong><br/>
                      🔐 Dados protegidos conforme LGPD
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

export default async function handler(req, res) {
  if (setCORSHeaders(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Método não permitido.', error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const { RESEND_API_KEY, CORPORATE_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CORPORATE_EMAIL) {
    console.error('[send-email] Variáveis de ambiente ausentes.');
    res.status(500).json({ success: false, message: 'Configuração do servidor incompleta.', error: 'ENV_MISSING' });
    return;
  }

  const validation = validatePayload(req.body);
  if (!validation.valid) {
    res.status(400).json({ success: false, message: validation.error, error: 'INVALID_PAYLOAD' });
    return;
  }

  const { data } = validation;

  try {
    const resend = new Resend(RESEND_API_KEY);
    const modeLabel = data.mode === 'beta' ? 'Beta Tester' : 'Validação de Ideia';

    const result = await resend.emails.send({
      from: 'Nexa Leads <onboarding@resend.dev>',
      to: [CORPORATE_EMAIL],
      replyTo: data.email,
      subject: `[Nexa] Novo Lead – ${modeLabel}: ${data.fullName}`,
      html: buildHtmlEmail(data),
    });

    if (result.error) {
      console.error('[send-email] Resend error:', result.error);
      res.status(502).json({ success: false, message: 'Falha ao enviar e-mail.', error: 'RESEND_ERROR' });
      return;
    }

    const queuePosition = Math.floor(Math.random() * 300) + 501;

    res.status(200).json({
      success: true,
      message: 'E-mail enviado com sucesso!',
      data: { emailId: result.data?.id, queuePosition },
    });
  } catch (err) {
    console.error('[send-email] Unexpected error:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.', error: 'INTERNAL_ERROR' });
  }
}
