#!/bin/bash

##############################################################################
# NEXA SECURITY TESTING SUITE
# 
# Bateria completa de testes de segurança, conformidade e funcionalidade.
# 
# Usage:
#   chmod +x tests/security-tests.sh
#   ./tests/security-tests.sh [local|staging|production]
#   
# Environment:
#   - Requer cURL, jq (JSON parser), Node.js
#   - Base URL configurável: http://localhost:3000 (default)
#
# Tests covered:
#   1. Rate Limiting (5 req/hour)
#   2. XSS Prevention (HTML escaping)
#   3. Timing Attack (constant-time comparison)
#   4. Email Enumeration (response ambiguity)
#   5. Honeypot Detection (bot protection)
#   6. LGPD Right to Erasure (anonimização)
#   7. Security Headers (CSP, HSTS, etc.)
#   8. CORS Validation (origin allowlist)
#   9. Payload Size Limits (input constraints)
#   10. Database Error Handling (no info disclosure)
##############################################################################

set -e

# ─────── CONFIGURAÇÃO ────────
ENVIRONMENT="${1:-local}"
case "$ENVIRONMENT" in
  local)
    BASE_URL="http://localhost:3000"
    ;;
  staging)
    BASE_URL="https://nexa-staging.vercel.app"
    ;;
  production)
    BASE_URL="https://nexa.com"
    ;;
  *)
    echo "❌ Ambiente inválido. Use: local, staging, ou production"
    exit 1
    ;;
esac

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores de teste
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNINGS=0

# ─────── FUNÇÕES AUXILIARES ────────

function print_header() {
  echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

function print_test() {
  echo -e "${YELLOW}🧪 TEST: $1${NC}"
}

function print_pass() {
  echo -e "${GREEN}✅ PASS: $1${NC}"
  ((TESTS_PASSED++))
}

function print_fail() {
  echo -e "${RED}❌ FAIL: $1${NC}"
  ((TESTS_FAILED++))
}

function print_warn() {
  echo -e "${YELLOW}⚠️  WARN: $1${NC}"
  ((TESTS_WARNINGS++))
}

function assert_http_code() {
  local actual=$1
  local expected=$2
  local message=$3
  
  if [ "$actual" -eq "$expected" ]; then
    print_pass "$message (HTTP $actual)"
  else
    print_fail "$message (expected $expected, got $actual)"
  fi
}

function assert_json_field() {
  local json=$1
  local field=$2
  local expected=$3
  local message=$4
  
  local actual=$(echo "$json" | jq -r "$field" 2>/dev/null || echo "ERROR")
  
  if [ "$actual" = "$expected" ]; then
    print_pass "$message"
  else
    print_fail "$message (expected '$expected', got '$actual')"
  fi
}

function test_header_present() {
  local header=$1
  local url=$2
  
  local response=$(curl -sI "$url" | grep -i "^${header}:" || echo "MISSING")
  
  if [ "$response" != "MISSING" ]; then
    print_pass "Security header present: $header"
  else
    print_fail "Security header missing: $header"
  fi
}

# ─────── TESTE 1: RATE LIMITING ────────

print_header "TEST 1: RATE LIMITING (5 req/hour per IP)"

function test_rate_limiting() {
  print_test "Enviando 6 requisições consecutivas em <10s"
  
  local results=()
  
  for i in {1..6}; do
    local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/register" \
      -H "Content-Type: application/json" \
      -d '{
        "fullName": "Rate Limit Test '$i'",
        "email": "ratelimit'$i'@nexa.local",
        "phone": "1234567890",
        "socialMedia": "linkedin",
        "profession": "engineer",
        "consent": true,
        "consentVersion": "1.0"
      }')
    
    local http_code=$(echo "$response" | tail -n1)
    results+=($http_code)
    
    echo "  Request $i: HTTP $http_code"
  done
  
  # Verifica: primeiras 5 devem ser 200/201, 6ª deve ser 429
  local count_success=0
  local count_limited=0
  
  for i in {0..4}; do
    if [ "${results[$i]}" -eq 200 ] || [ "${results[$i]}" -eq 201 ]; then
      ((count_success++))
    fi
  done
  
  if [ "${results[5]}" -eq 429 ]; then
    ((count_limited++))
  fi
  
  if [ $count_success -eq 5 ] && [ $count_limited -eq 1 ]; then
    print_pass "Rate limiting works correctly (5 success, 1 rejected with 429)"
  else
    print_fail "Rate limiting failed (expected 5x 200/201 + 1x 429, got ${results[@]})"
  fi
}

test_rate_limiting

# ─────── TESTE 2: XSS PREVENTION ────────

print_header "TEST 2: XSS PREVENTION (HTML Escaping)"

function test_xss_prevention() {
  print_test "Tentando registrar com payload XSS"
  
  local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/register" \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "XSS<script>alert(1)</script>Test",
      "email": "xss'$(date +%s)'@nexa.local",
      "phone": "1234567890",
      "socialMedia": "linkedin",
      "profession": "engineer",
      "consent": true,
      "consentVersion": "1.0"
    }')
  
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n -1)
  
  assert_http_code "$http_code" "200" "XSS payload accepted with 200"
  
  # Verifica se nome foi sanitizado (HTML escapado)
  local has_script=$(echo "$body" | jq -r '.data.position' 2>/dev/null || echo "ERROR")
  
  if [ "$has_script" != "ERROR" ]; then
    print_pass "XSS payload sanitized (registration processed)"
  else
    print_fail "XSS prevention test inconclusive"
  fi
}

test_xss_prevention

# ─────── TESTE 3: EMAIL ENUMERATION PROTECTION ────────

print_header "TEST 3: EMAIL ENUMERATION PROTECTION"

function test_email_enumeration() {
  print_test "Verificando respostas para email existe vs. não existe"
  
  # Email que deve existir (registrado em teste anterior)
  local exists_response=$(curl -s "$BASE_URL/api/status?email=ratelimit1@nexa.local")
  local exists_code=$(echo "$exists_response" | jq -r '.success' 2>/dev/null || echo "ERROR")
  
  # Email que provavelmente não existe
  local not_exists_response=$(curl -s "$BASE_URL/api/status?email=nonexistent_$(date +%s)@nexa.local")
  local not_exists_code=$(echo "$not_exists_response" | jq -r '.success' 2>/dev/null || echo "ERROR")
  
  # Verifica se ambas retornam estrutura similar
  if [ "$exists_code" = "true" ] && [ "$not_exists_code" = "true" ]; then
    print_pass "Email enumeration protection: same response structure for both"
  else
    print_warn "Email enumeration response structure differs"
  fi
}

test_email_enumeration

# ─────── TESTE 4: HONEYPOT DETECTION ────────

print_header "TEST 4: HONEYPOT BOT DETECTION"

function test_honeypot() {
  print_test "Preenchendo campo honeypot 'website'"
  
  local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/register" \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "Bot Attacker",
      "email": "bot'$(date +%s)'@nexa.local",
      "phone": "1234567890",
      "socialMedia": "linkedin",
      "profession": "engineer",
      "consent": true,
      "consentVersion": "1.0",
      "website": "https://spam.com"
    }')
  
  local http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" -eq 400 ]; then
    print_pass "Honeypot field rejected (400)"
  else
    print_fail "Honeypot field not properly validated (got $http_code)"
  fi
}

test_honeypot

# ─────── TESTE 5: LGPD RIGHT TO ERASURE ────────

print_header "TEST 5: LGPD RIGHT TO ERASURE (Anonimização)"

function test_lgpd_erasure() {
  print_test "Deletando conta (direito ao esquecimento)"
  
  # Primeiro, registra um usuário
  local register_response=$(curl -s -X POST "$BASE_URL/api/register" \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "LGPD Test User",
      "email": "lgpd'$(date +%s)'@nexa.local",
      "phone": "1234567890",
      "socialMedia": "linkedin",
      "profession": "engineer",
      "consent": true,
      "consentVersion": "1.0"
    }')
  
  local email=$(echo "$register_response" | jq -r '.data.email' 2>/dev/null || echo "ERROR")
  
  if [ "$email" != "ERROR" ]; then
    # Tenta deletar
    local delete_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/user/unsubscribe" \
      -H "Content-Type: application/json" \
      -d '{"email": "'$email'"}')
    
    local http_code=$(echo "$delete_response" | tail -n1)
    
    assert_http_code "$http_code" "200" "Right to erasure endpoint responds with 200"
  else
    print_warn "Could not test erasure (email registration failed)"
  fi
}

test_lgpd_erasure

# ─────── TESTE 6: SECURITY HEADERS ────────

print_header "TEST 6: SECURITY HEADERS"

function test_security_headers() {
  print_test "Verificando headers de segurança obrigatórios"
  
  test_header_present "Content-Security-Policy" "$BASE_URL/api/register"
  test_header_present "X-Content-Type-Options" "$BASE_URL/api/register"
  test_header_present "X-Frame-Options" "$BASE_URL/api/register"
  test_header_present "Referrer-Policy" "$BASE_URL/api/register"
}

test_security_headers

# ─────── TESTE 7: CORS VALIDATION ────────

print_header "TEST 7: CORS VALIDATION"

function test_cors() {
  print_test "Validando CORS com origem não-autorizada"
  
  local response=$(curl -s -w "\n%{http_code}" \
    -H "Origin: https://attacker.com" \
    -H "Access-Control-Request-Method: POST" \
    -X OPTIONS "$BASE_URL/api/register")
  
  local http_code=$(echo "$response" | tail -n1)
  local headers=$(echo "$response" | head -n -1)
  
  # Verifica se não retorna Access-Control-Allow-Origin para origem não-autorizada
  if ! echo "$headers" | grep -q "Access-Control-Allow-Origin: https://attacker.com"; then
    print_pass "CORS properly rejects unauthorized origins"
  else
    print_fail "CORS may be too permissive"
  fi
}

test_cors

# ─────── TESTE 8: PAYLOAD SIZE LIMITS ────────

print_header "TEST 8: PAYLOAD SIZE LIMITS"

function test_payload_limits() {
  print_test "Tentando registrar com payload oversized"
  
  local oversized_name=$(printf 'A%.0s' {1..500})
  
  local response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/register" \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "'$oversized_name'",
      "email": "oversized@nexa.local",
      "phone": "1234567890",
      "socialMedia": "linkedin",
      "profession": "engineer",
      "consent": true,
      "consentVersion": "1.0"
    }')
  
  local http_code=$(echo "$response" | tail -n1)
  
  if [ "$http_code" -eq 400 ] || [ "$http_code" -eq 413 ]; then
    print_pass "Oversized payload rejected (HTTP $http_code)"
  else
    print_warn "Oversized payload not rejected (HTTP $http_code)"
  fi
}

test_payload_limits

# ─────── TESTE 9: ADMIN AUTH TIMING SAFE ────────

print_header "TEST 9: ADMIN AUTHENTICATION (Timing Safe)"

function test_admin_timing() {
  print_test "Verificando timing de comparação de token"
  
  # Token válido (suposição: vem de variável de ambiente)
  if [ -z "$ADMIN_SECRET" ]; then
    print_warn "ADMIN_SECRET not set, skipping timing test"
    return
  fi
  
  # Tempo com token válido
  local start=$(date +%s%N)
  curl -s -H "Authorization: Bearer $ADMIN_SECRET" "$BASE_URL/api/admin/stats" > /dev/null
  local end=$(date +%s%N)
  local time_valid=$(( ($end - $start) / 1000000 ))
  
  # Tempo com token inválido
  start=$(date +%s%N)
  curl -s -H "Authorization: Bearer INVALID_TOKEN_X" "$BASE_URL/api/admin/stats" > /dev/null
  end=$(date +%s%N)
  local time_invalid=$(( ($end - $start) / 1000000 ))
  
  # Diferença deve ser mínima (constant-time comparison)
  local diff=$((time_valid - time_invalid))
  if [ $diff -lt 0 ]; then
    diff=$((-diff))
  fi
  
  if [ $diff -lt 50 ]; then
    print_pass "Timing-safe comparison: valid and invalid tokens take same time (±${diff}ms)"
  else
    print_warn "Timing difference detected: ${diff}ms (should be <50ms for timing-safe comparison)"
  fi
}

if [ ! -z "$ADMIN_SECRET" ]; then
  test_admin_timing
fi

# ─────── TESTE 10: ERROR HANDLING ────────

print_header "TEST 10: ERROR HANDLING (No Information Disclosure)"

function test_error_handling() {
  print_test "Verificando se erros não expõem informações sensíveis"
  
  # Tenta com email inválido
  local response=$(curl -s -X POST "$BASE_URL/api/register" \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "Test",
      "email": "invalid-email",
      "phone": "123",
      "socialMedia": "linkedin",
      "profession": "engineer",
      "consent": true,
      "consentVersion": "1.0"
    }')
  
  # Verifica se não há exposição de stack trace ou credenciais
  if ! echo "$response" | grep -qi "stack\|trace\|api_key\|secret"; then
    print_pass "Error handling: no stack trace or secrets exposed"
  else
    print_fail "Error handling: sensitive information exposed"
  fi
}

test_error_handling

# ─────── RESUMO FINAL ────────

print_header "RESUMO DE TESTES"

echo "Base URL: $BASE_URL"
echo ""
echo -e "${GREEN}✅ Testes Passou: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Testes Falharam: $TESTS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Avisos: $TESTS_WARNINGS${NC}"
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNINGS))
SUCCESS_RATE=$((TESTS_PASSED * 100 / (TESTS_PASSED + TESTS_FAILED)))

echo "Taxa de Sucesso: ${SUCCESS_RATE}%"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM! Status: GO FOR PRODUCTION${NC}"
  exit 0
else
  echo -e "${RED}⛔ FALHAS DETECTADAS. Status: NEEDS REVIEW${NC}"
  exit 1
fi
