# 🧪 NEXA TESTING EXECUTION GUIDE

**Como executar a bateria completa de testes de segurança, funcionalidade e conformidade.**

---

## ⚡ QUICK START (5 minutos)

### 1. Setup Local

```bash
# Instale dependências
npm install
cd frontend && npm install && cd ..

# Configure ambiente
cp .env.example .env.local

# Edite .env.local com valores reais:
# DATABASE_URL=postgresql://...
# RESEND_API_KEY=re_...
# ADMIN_SECRET=<gere com: openssl rand -hex 32>
# NODE_ENV=development (para testes locais)
```

### 2. Inicie o Servidor Local

```bash
# Terminal 1: Backend + Frontend
npm run dev

# Aguarde:
# ✓ Backend listening on http://localhost:3001
# ✓ Frontend listening on http://localhost:5173
# Nota: Vercel rewrite redireciona /api/* para :3001
```

### 3. Execute os Testes

```bash
# Terminal 2: Testes de Segurança

# Opção A: Bash (curl-based)
chmod +x tests/security-tests.sh
./tests/security-tests.sh local

# Opção B: Node.js (mais detalhado)
npm install node-fetch@2  # Se não tiver
node tests/security-tests.js local

# Ambos devem exibir: "✅ ALL TESTS PASSED"
```

---

## 📋 TESTES INDIVIDUAIS (Execução Manual)

### Teste 1: Rate Limiting

```bash
#!/bin/bash
# Envia 6 requisições rápidas, espera 429 na 6ª

for i in {1..6}; do
  echo "Request $i:"
  curl -s -X POST http://localhost:3000/api/register \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "Rate Test '$i'",
      "email": "rate'$i'@nexa.local",
      "phone": "1234567890",
      "socialMedia": "linkedin",
      "profession": "dev",
      "consent": true,
      "consentVersion": "1.0"
    }' | jq '.data.message, .code' 
  sleep 0.1
done

# Esperado:
# Request 1-5: {"position": X, ...}
# Request 6: {"code": "RATE_LIMIT_EXCEEDED"}
```

### Teste 2: XSS Prevention

```bash
# Payload com XSS
curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test<script>alert(1)</script>Name",
    "email": "xss'$(date +%s)'@nexa.local",
    "phone": "1234567890",
    "socialMedia": "linkedin",
    "profession": "dev",
    "consent": true,
    "consentVersion": "1.0"
  }' | jq '.'

# Esperado: HTTP 200, registro criado
# Verificar se email recebido tem HTML escapado:
# <p>Name: Test&lt;script&gt;alert(1)&lt;/script&gt;Name</p>
```

### Teste 3: Email Enumeration

```bash
# Email que existe
curl -s http://localhost:3000/api/status?email=rate1@nexa.local | jq '.data'

# Email que não existe  
curl -s http://localhost:3000/api/status?email=nonexistent'$(date +%s)'@nexa.local | jq '.data'

# Esperado: Ambas retornam estrutura similar
# {
#   "found": true/false,
#   "position": X ou null,
#   "tier": "OBSERVER" ou null
# }
```

### Teste 4: Honeypot Detection

```bash
# Tenta preencher campo website (oculto)
curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Bot Attacker",
    "email": "bot'$(date +%s)'@nexa.local",
    "phone": "1234567890",
    "socialMedia": "linkedin",
    "profession": "dev",
    "consent": true,
    "consentVersion": "1.0",
    "website": "https://spam.com"
  }' | jq '.'

# Esperado: HTTP 400, erro "Validação falhou."
```

### Teste 5: LGPD Right to Erasure

```bash
# 1. Registra usuário
email="lgpd_$(date +%s)@nexa.local"

curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "LGPD User",
    "email": "'$email'",
    "phone": "1234567890",
    "socialMedia": "linkedin",
    "profession": "dev",
    "consent": true,
    "consentVersion": "1.0"
  }' | jq '.data'

# 2. Deleta conta (direito ao esquecimento)
curl -s -X DELETE http://localhost:3000/api/user/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "'$email'"}' | jq '.'

# Esperado: HTTP 200, usuário anonimizado
# fullName: "[DELETED]"
# email: "deleted_<id>@deleted.local"
```

### Teste 6: Security Headers

```bash
# Verifica headers de segurança
curl -I http://localhost:3000/api/register

# Procure por:
# ✅ Content-Security-Policy
# ✅ X-Content-Type-Options: nosniff
# ✅ X-Frame-Options: DENY
# ✅ Referrer-Policy: strict-origin-when-cross-origin
```

### Teste 7: CORS Validation

```bash
# Origem não-autorizada
curl -H "Origin: https://attacker.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/api/register -v 2>&1 | grep -i access-control

# Esperado: NENHUM header Access-Control-Allow-Origin
# (CORS rejeitado pelo navegador)
```

### Teste 8: Admin Auth (Timing Safe)

```bash
# Gere um ADMIN_SECRET para teste
ADMIN_SECRET=$(openssl rand -hex 32)

# Tempo com token VÁLIDO
time curl -s -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/api/admin/stats > /dev/null

# Tempo com token INVÁLIDO
time curl -s -H "Authorization: Bearer INVALID_X" \
  http://localhost:3000/api/admin/stats > /dev/null

# Esperado: Tempos idênticos (±50ms)
# Indica timing-safe comparison funcional
```

### Teste 9: Input Validation

```bash
# Test 1: Nome vazio
curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "",
    "email": "test@nexa.local",
    "phone": "1234567890",
    "socialMedia": "linkedin",
    "profession": "dev",
    "consent": true,
    "consentVersion": "1.0"
  }' | jq '.message'

# Esperado: "mínimo 3 caracteres"

# Test 2: Email inválido
curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "invalid-email",
    "phone": "1234567890",
    "socialMedia": "linkedin",
    "profession": "dev",
    "consent": true,
    "consentVersion": "1.0"
  }' | jq '.message'

# Esperado: "e-mail inválido"

# Test 3: Telefone muito curto
curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@nexa.local",
    "phone": "123",
    "socialMedia": "linkedin",
    "profession": "dev",
    "consent": true,
    "consentVersion": "1.0"
  }' | jq '.message'

# Esperado: "mínimo 10 dígitos"

# Test 4: Domínio de email temporário
curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@tempmail.com",
    "phone": "1234567890",
    "socialMedia": "linkedin",
    "profession": "dev",
    "consent": true,
    "consentVersion": "1.0"
  }' | jq '.message'

# Esperado: "domínio temporário não permitido"
```

### Teste 10: Error Handling

```bash
# Enviando dados inválidos para verificar se há exposição de secrets

curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test",
    "email": "invalid",
    "phone": "123",
    "socialMedia": "x",
    "profession": "x",
    "consent": true,
    "consentVersion": "1.0"
  }' | jq '.message, .details'

# Esperado: NÃO deve conter:
# ❌ stack, trace, Error
# ❌ RESEND_API_KEY, DATABASE_URL, ADMIN_SECRET
# ❌ PrismaClient, SQL details
```

---

## 🔗 TESTES DE INTEGRAÇÃO (End-to-End)

### Fluxo Completo: Registro → Status → Admin

```bash
#!/bin/bash

# 1. Registrar novo usuário
echo "📝 Registrando usuário..."
register_response=$(curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "E2E Test User",
    "email": "e2e'$(date +%s)'@nexa.local",
    "phone": "1234567890",
    "socialMedia": "linkedin",
    "profession": "dev",
    "consent": true,
    "consentVersion": "1.0"
  }')

email=$(echo "$register_response" | jq -r '.data.email')
position=$(echo "$register_response" | jq -r '.data.position')
echo "✅ Registered: $email at position $position"

# 2. Consultar status
echo ""
echo "🔍 Consultando status..."
status_response=$(curl -s http://localhost:3000/api/status?email=$email)
found=$(echo "$status_response" | jq -r '.data.found')
position_check=$(echo "$status_response" | jq -r '.data.position')
echo "✅ Status: Found=$found, Position=$position_check"

# 3. Admin listagem
echo ""
echo "📊 Admin stats..."
admin_response=$(curl -s -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/api/admin/stats)
total=$(echo "$admin_response" | jq -r '.data.total')
echo "✅ Total users: $total"

# 4. Admin list
echo ""
echo "📋 Admin list (page 1)..."
list_response=$(curl -s -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/api/admin/list?page=1&limit=10)
count=$(echo "$list_response" | jq -r '.data.items | length')
echo "✅ Listed: $count users"

# 5. Admin export
echo ""
echo "📥 Admin export..."
csv_response=$(curl -s -H "Authorization: Bearer $ADMIN_SECRET" \
  http://localhost:3000/api/admin/export)
lines=$(echo "$csv_response" | wc -l)
echo "✅ Exported: $lines lines of CSV"
```

---

## 🎯 CHECKLIST ANTES DE DEPLOY

```bash
# ✅ Testes locais
[ ] npm run build — Sem erros
[ ] npm run test — Todos passando
[ ] ./tests/security-tests.sh local — Todos passando
[ ] node tests/security-tests.js local — Todos passando

# ✅ Variáveis de ambiente
[ ] DATABASE_URL setada com ?sslmode=require
[ ] RESEND_API_KEY válida
[ ] ADMIN_SECRET gerada (openssl rand -hex 32)
[ ] NODE_ENV=production
[ ] DOMAIN=https://seu-dominio.com

# ✅ Segurança
[ ] Nenhum secret commited em git
[ ] vercel.json com headers de segurança
[ ] .env.local não versionado
[ ] npm audit executado (0 vulnerabilities)

# ✅ Documentação
[ ] SECURITY_AUDIT_CHECKLIST.md lido
[ ] SECURITY_HARDENING_GUIDE.md lido
[ ] Plano de rollback preparado
[ ] Contatos de escalação documentados

# ✅ Monitoramento
[ ] Sentry configurado (para produção)
[ ] Logs centralizados setup
[ ] Alertas configuradas (rate limit, erros)
[ ] Backup automático habilitado
```

---

## 🚀 DEPLOY PARA STAGING

```bash
# 1. Build final
npm run build

# 2. Deploy staging
vercel --scope your-team

# 3. Testes em staging
./tests/security-tests.sh staging

# 4. Testes manuais em staging
curl https://nexa-staging.vercel.app/api/register

# 5. Se tudo OK, deploy produção
vercel --prod
```

---

## ⚠️ TROUBLESHOOTING

### Erro: "Cannot find module 'node-fetch'"
```bash
npm install node-fetch@2
```

### Erro: "Connection refused (localhost:3000)"
```bash
# Verifique se servidor está rodando
npm run dev

# Em outro terminal, teste conectividade
curl http://localhost:3000
```

### Erro: "Rate limit exceeded" em testes
```bash
# Aguarde 1 hora ou mude IP/clear cache
# Ou modifique tests/security-tests.sh para usar diferentes IPs simulados
```

### Erro: "ADMIN_SECRET not set"
```bash
# Gere e exporte
export ADMIN_SECRET=$(openssl rand -hex 32)

# Ou adicione a .env.local
ADMIN_SECRET=$(openssl rand -hex 32)
```

### Email não chega (teste de XSS)
```bash
# Verifique RESEND_API_KEY em .env.local
# Confirme que email foi registrado em banco:
npx prisma studio  # View data in Prisma Studio

# Verifique logs do servidor
npm run dev # Procure por [emailService] logs
```

---

## 📚 REFERÊNCIAS

- [SECURITY_AUDIT_CHECKLIST.md](./SECURITY_AUDIT_CHECKLIST.md) — Resultado da auditoria
- [SECURITY_HARDENING_GUIDE.md](./SECURITY_HARDENING_GUIDE.md) — Guia pós-deploy
- [AUTOMATED_TESTING_REPORT.md](./AUTOMATED_TESTING_REPORT.md) — Relatório completo
- [QUICK_START_SECURITY.md](./QUICK_START_SECURITY.md) — Setup rápido

---

**Última atualização:** June 3, 2026  
**Status:** Pronto para uso em staging/produção ✅
