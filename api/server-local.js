// api/server-local.js (ou server-local.js na raiz)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Força o carregamento do .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') }); // Ajuste o caminho se necessário

import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';

console.log('🔑 Chave Resend carregada?', process.env.RESEND_API_KEY ? 'SIM' : 'NÃO');
console.log(' Email Corporativo:', process.env.CORPORATE_EMAIL);

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/send-email', async (req, res) => {
  console.log('📩 Recebendo dados:', req.body);
  
  try {
    const { fullName, email, phone, socialMedia, profession } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    // Verifica se a chave existe antes de enviar
    if (!process.env.RESEND_API_KEY) {
      throw new Error('Chave da API Resend não encontrada no .env.local');
    }

    await resend.emails.send({
      from: 'Nexa Leads <onboarding@resend.dev>',
      to: process.env.CORPORATE_EMAIL,
      subject: `[TESTE LOCAL] Novo Lead: ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #197cf7;">Novo Beta Tester Nexa</h1>
          <hr/>
          <p><strong>Nome:</strong> ${fullName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
          <p><strong>Rede Social:</strong> ${socialMedia || 'Não informado'}</p>
          <p><strong>Perfil:</strong> ${profession}</p>
          <hr/>
          <p style="font-size: 12px; color: #888;">Enviado via Teste Local Nexa</p>
        </div>
      `,
    });

    console.log('✅ Email enviado com sucesso para:', process.env.CORPORATE_EMAIL);
    res.json({ success: true, message: 'Email enviado!' });
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    res.status(500).json({ error: 'Erro interno ao enviar email', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor API de Teste rodando em http://localhost:${PORT}`);
});