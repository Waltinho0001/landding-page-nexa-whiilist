# 🛡️ GUIA DE HARDENING PÓS-DEPLOY — NEXA LANDING PAGE

**Versão:** 1.0  
**Data:** June 3, 2026  
**Status:** Production-Ready

---

## 📌 RESUMO EXECUTIVO

Este documento fornece um **checklist passo-a-passo** para garantir máxima segurança após o deployment em produção. Segue princípios de "Security by Design" e "Privacidade by Design" conforme LGPD/GDPR.

---

## ✅ FASE 1: PRÉ-DEPLOYMENT (Antes de ir para produção)

### 1.1 Configuração de Secrets no Vercel

```bash
# Acesse: https://vercel.com/[seu-projeto]/settings/environment-variables

# Adicione:
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_SECRET=[Gere com: openssl rand -hex 32]
CONSENT_VERSION=1.0
NODE_ENV=production
DOMAIN=https://seu-dominio.com
CORPORATE_EMAIL=team@seu-dominio.com
```

**🔐 CRÍTICO:**
- ✅ Nunca commite `.env` com valores reais
- ✅ Use preview environments com secrets separados
- ✅ Revise acesso ao projeto (apenas times autorizadas)
- ✅ Ative 2FA em todas as contas Vercel

### 1.2 Configuração do Banco de Dados

**PostgreSQL (Neon / Supabase):**
- ✅ Habilite SSL obrigatório (`sslmode=require`)
- ✅ Configure firewall para apenas IPs Vercel
- ✅ Crie usuário dedicado (não use `postgres`)
- ✅ Limite permissões: apenas SELECT/INSERT/UPDATE em `beta_users`

```sql
-- Exemplo (Neon/Supabase):
CREATE ROLE nexa_app WITH LOGIN PASSWORD 'strong_random_password';
GRANT CONNECT ON DATABASE nexa_db TO nexa_app;
GRANT SELECT, INSERT, UPDATE ON beta_users TO nexa_app;
```

### 1.3 Domínio & SSL/TLS

- ✅ Configure domínio com HTTPS obrigatório
- ✅ Ative HSTS preload: `max-age=31536000; includeSubDomains; preload`
- ✅ Obtenha certificado SSL wildcard (Vercel fornece gratuitamente)
- ✅ Configure DNS: CNAME → Vercel nameserver

### 1.4 Audit de Dependências

```bash
# Verifique vulnerabilidades
npm audit

# Se houver vulnerabilidades HIGH/CRITICAL:
npm audit fix

# Ou atualize manualmente
npm update

# Revise Prisma gerado
npx prisma generate --skip-engine-check
```

---

## 🚀 FASE 2: DEPLOYMENT

### 2.1 Deploy via Vercel CLI

```bash
# Build localmente primeiro (testa errors)
npm run build

# Deploy (production)
vercel --prod

# Verifique se todos os secrets foram aplicados
vercel env list
```

### 2.2 Verificações Pós-Deploy

```bash
# 1. Teste endpoint /api/register (POST)
curl -X POST https://seu-dominio.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "socialMedia": "linkedin",
    "profession": "developer",
    "consent": true,
    "consentVersion": "1.0"
  }'

# Deve retornar: { "success": true, "data": { "position": 1, ... } }

# 2. Teste endpoint /api/status?email=... (GET)
curl https://seu-dominio.com/api/status?email=test@example.com

# Deve retornar: { "success": true, "data": { "found": true, ... } }

# 3. Teste admin endpoint /api/admin/stats (GET com token)
curl -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  https://seu-dominio.com/api/admin/stats

# Deve retornar: { "success": true, "data": { "total": 1, ... } }
```

---

## 📊 FASE 3: MONITORAMENTO & OBSERVABILIDADE

### 3.1 Configurar Logs Centralizados

Recomendação: **Sentry** (Erro Tracking) + **Datadog** ou **New Relic** (Performance)

#### Sentry Setup:

```bash
# Instale
npm install @sentry/node

# Configure em: backend/src/database/prisma.js ou main handler
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% em produção
});
```

Adicione ao `.env`:
```
SENTRY_DSN=https://xxxxx@sentry.io/project-id
```

### 3.2 Alertas Críticos

Configure alertas para:
- ❌ Taxa de erro > 1% em 5 minutos
- ⚠️ Rate limit triggered (RATE_LIMIT_EXCEEDED)
- 🔓 Múltiplas tentativas de acesso admin (UNAUTHORIZED)
- 💾 Erros de conexão com banco de dados

### 3.3 Logs Estruturados

**Sempre use:**
- ✅ Timestamp em ISO 8601
- ✅ Níveis: `info`, `warn`, `error`
- ✅ Sem exposição de dados sensíveis (emails, IPs inteiros)

**Exemplo bom:**
```javascript
console.info('[register] New registration — position #123 — tier FOUNDER');
console.warn('[register] Rate limit exceeded for IP (hashed)');
console.error('[status] Unhandled error (type: P2025)');
```

**Exemplo ruim:**
```javascript
console.log(`Email registrado: user@example.com`); ❌
console.error(err); // Expõe stack trace ❌
```

---

## 🔐 FASE 4: SEGURANÇA EM PRODUÇÃO

### 4.1 Headers de Segurança

Verificar no `vercel.json`:
- ✅ `Content-Security-Policy` (CSP)
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `X-Frame-Options: SAMEORIGIN`
- ✅ `Strict-Transport-Security` (HSTS)
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`

Teste com:
```bash
curl -I https://seu-dominio.com
# Verifique todos os headers acima
```

### 4.2 CORS Validation

Verificar `backend/src/config/cors.js`:
- ✅ Allowlist restrita (sem `*`)
- ✅ Apenas `GET, POST, OPTIONS`
- ✅ Credenciais habilitadas apenas quando necessário

### 4.3 Rate Limiting

Configuração em `backend/api/register.js`:
- ✅ **5 requisições/hora por IP** (em memória — MVP)
- ℹ️ Para produção scale, migre para Redis:
  - `@upstash/ratelimit`
  - `redis`
  - `node-cache`

### 4.4 Admin Token Rotation

- ✅ Altere `ADMIN_SECRET` a cada **30 dias**
- ✅ Gere novo token: `openssl rand -hex 32`
- ✅ Notifique usuários admin sobre novo token via 1Password / Vault

---

## 👥 FASE 5: CONFORMIDADE LGPD/GDPR

### 5.1 Checklist de Consentimento

- ✅ Consentimento explícito registrado no campo `consent`
- ✅ `consentVersion` rastreável (auditoria)
- ✅ `consentDate` timestamp automático
- ✅ Política de privacidade acessível (rodapé do site)

### 5.2 Direito ao Esquecimento (Direito de Exclusão)

**Implemente endpoint `/api/user/unsubscribe`:**

```javascript
// backend/api/user/unsubscribe.js
export default async function handler(req, res) {
  if (req.method !== 'DELETE') return sendError(res, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  
  const { email } = req.body;
  
  // Validar email
  if (!validateEmailFormat(email)) {
    return sendError(res, 'Email inválido', 'INVALID_EMAIL', 400);
  }
  
  try {
    // Buscar usuário
    const user = await prisma.betaUser.findUnique({ where: { email } });
    
    if (!user) {
      return sendError(res, 'Usuário não encontrado', 'NOT_FOUND', 404);
    }
    
    // Anonimizar (LGPD: "direito ao esquecimento")
    await prisma.betaUser.update({
      where: { id: user.id },
      data: {
        fullName: '[DELETED]',
        email: `deleted_${user.id}@deleted.local`,
        phone: null,
        socialMedia: null,
        profession: null,
      },
    });
    
    return sendSuccess(res, { message: 'Inscrição removida com sucesso' });
  } catch (err) {
    return sendError(res, 'Erro ao remover inscrição', 'INTERNAL_ERROR', 500);
  }
}
```

### 5.3 Relatórios de Dados

- ✅ Prepare procedimento mensal de "data access requests"
- ✅ Documente retenção de dados (máximo 6 meses pós-encerramento beta)
- ✅ Implemente limpeza automática: `DELETE FROM beta_users WHERE createdAt < NOW() - INTERVAL 12 MONTHS`

---

## 🧪 FASE 6: TESTES DE SEGURANÇA

### 6.1 Teste de Rate Limiting

```bash
#!/bin/bash
# Envie 10 requisições rápidas
for i in {1..10}; do
  curl -X POST https://seu-dominio.com/api/register \
    -H "Content-Type: application/json" \
    -d '{"fullName":"Test","email":"test'$i'@x.com","phone":"1234567890",...}' &
done
wait

# A 6ª requisição deve retornar: 429 RATE_LIMIT_EXCEEDED
```

### 6.2 Teste de XSS (Email Templates)

```javascript
// Tente registrar com payload XSS:
{
  "fullName": "Test<script>alert('XSS')</script>",
  "email": "test@example.com",
  ...
}

// Email recebido deve ter HTML escapado:
// ❌ Antes: <script>alert('XSS')</script>
// ✅ Depois: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

### 6.3 Teste de Timing Attack (Admin Auth)

```bash
# Requisição 1: Token válido
time curl -H "Authorization: Bearer VALID_SECRET" \
  https://seu-dominio.com/api/admin/stats

# Requisição 2: Token inválido (diferentes tamanhos)
time curl -H "Authorization: Bearer WRONG" \
  https://seu-dominio.com/api/admin/stats

# ✅ Ambas devem levar **exatamente o mesmo tempo** (± 50ms)
# ❌ Se uma for mais rápida, há timing leak
```

### 6.4 Teste de CORS

```bash
# Teste origem não-permitida
curl -H "Origin: https://attacker.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://seu-dominio.com/api/register

# Deve retornar: 204 sem header Access-Control-Allow-Origin
# ❌ NÃO deve retornar: Access-Control-Allow-Origin: *
```

---

## 📈 FASE 7: ESCALABILIDADE & MANUTENÇÃO

### 7.1 Rate Limiting em Escala

Quando atingir 1.000+ requisições/dia, migre de memória para Redis:

```bash
npm install @upstash/ratelimit redis
```

```javascript
// Atualizar: backend/api/register.js
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"),
});

// Use: const { success } = await ratelimit.limit(ipHash);
```

### 7.2 Monitoramento de Performance

- ✅ Tempo resposta `/api/register` < 500ms
- ✅ Tempo resposta `/api/status` < 200ms
- ✅ Database query time < 100ms
- ✅ Email dispatch lag < 5s (async, não bloqueia)

### 7.3 Backups Automáticos

- ✅ Database: diário (Neon/Supabase fornece)
- ✅ Retenção: mínimo 30 dias
- ✅ Teste restauração mensalmente

---

## 🚨 INCIDENTES & RESPOSTA

### 7.1 Plano de Resposta a Incidentes

| Severidade | Exemplo | Ação | Tempo |
|---|---|---|---|
| **CRÍTICA** | Vazamento de dados, RCE | 1. Disable API 2. Notify users 3. Investigate | ≤ 1h |
| **ALTA** | Rate limit attack, Auth bypass | 1. Increase rate limit 2. Investigate 3. Patch | ≤ 4h |
| **MÉDIA** | Email logs expostos | 1. Patch 2. Investigate 3. Notify | ≤ 24h |
| **BAIXA** | Typo em log, minor bug | 1. Schedule patch | ≤ 7 dias |

### 7.2 Contatos de Emergência

```
Security Team Lead: [seu-email]@nexa.com
CTO: [seu-email]@nexa.com
Incident Response Hotline: [phone]
```

---

## 📚 RECURSOS & REFERÊNCIAS

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [LGPD Compliance Guide](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lei-geral-de-protecao-de-dados-pessoais-lgpd)
- [Prisma Security Best Practices](https://www.prisma.io/docs/orm/security)
- [Vercel Security Documentation](https://vercel.com/docs/concepts/security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## ✍️ Sign-Off

**Auditor:** GitHub Copilot (AppSec)  
**Data:** June 3, 2026  
**Próxima Revisão:** September 3, 2026 (Trimestral)

---

**Este documento é confidencial e deve ser armazenado de forma segura.**
