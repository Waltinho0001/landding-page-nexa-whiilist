/**
 * api/server-local.js
 * Servidor Express de desenvolvimento local.
 * Espelha o comportamento das Vercel Serverless Functions.
 *
 * Uso: node api/server-local.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env.local da raiz do projeto
dotenv.config({ path: path.join(__dirname, '../../.env.local') });
// Fallback para .env (no backend)
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';

// Importa os handlers das Vercel Functions
import registerHandler from './register.js';
import statusHandler from './status.js';
import sendEmailHandler from './send-email.js';

console.log('═══════════════════════════════════════');
console.log('  🚀 Nexa API — Servidor de Dev Local  ');
console.log('═══════════════════════════════════════');
console.log('🔑 Resend API Key:', process.env.RESEND_API_KEY ? '✅ Carregada' : '❌ AUSENTE');
console.log('📧 Corporate Email:', process.env.CORPORATE_EMAIL || '❌ AUSENTE');
console.log('🗄️  Database URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ AUSENTE');
console.log('─────────────────────────────────────── ');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globais
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Adapta um Vercel Handler para o Express.
 * Os handlers Vercel recebem (req, res) com a mesma interface do Node HTTP,
 * então podemos usá-los diretamente.
 */
function vercelAdapter(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error('[server-local] Erro não tratado no handler:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor.', error: 'INTERNAL_ERROR' });
      }
    }
  };
}

// Rotas
app.post('/api/register', vercelAdapter(registerHandler));
app.get('/api/status', vercelAdapter(statusHandler));
app.post('/api/send-email', vercelAdapter(sendEmailHandler));
app.options('/api/*', (req, res) => res.status(204).end());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/register',
      'GET  /api/status?email=',
      'POST /api/send-email',
    ],
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Rota não encontrada: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`✅ API rodando em: http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponíveis:`);
  console.log(`   POST http://localhost:${PORT}/api/register`);
  console.log(`   GET  http://localhost:${PORT}/api/status?email=SEU_EMAIL`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════');
});