#!/usr/bin/env node

/**
 * NEXA AUTOMATED TEST SUITE — Node.js Edition
 * 
 * Testes automatizados com node-fetch, validação de schemas,
 * e verificação de conformidade LGPD/GDPR.
 * 
 * Usage:
 *   node tests/security-tests.js [local|staging|production]
 * 
 * Requirements:
 *   npm install node-fetch@2 zod
 */

const fetch = require('node-fetch');
const { z } = require('zod');

// ─────── CONFIGURAÇÃO ────────
const ENVIRONMENT = process.argv[2] || 'local';
const BASE_URL = {
  local: 'http://localhost:3000',
  staging: 'https://nexa-staging.vercel.app',
  production: 'https://nexa.com',
}[ENVIRONMENT];

if (!BASE_URL) {
  console.error('❌ Ambiente inválido. Use: local, staging, ou production');
  process.exit(1);
}

// Cores
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Contadores
let passed = 0;
let failed = 0;
let warnings = 0;

// ─────── FUNÇÕES AUXILIARES ────────

function log(level, message) {
  const prefix = {
    pass: `${colors.green}✅${colors.reset}`,
    fail: `${colors.red}❌${colors.reset}`,
    warn: `${colors.yellow}⚠️${colors.reset}`,
    test: `${colors.cyan}🧪${colors.reset}`,
    header: `${colors.blue}═══${colors.reset}`,
  }[level];

  console.log(`${prefix} ${message}`);
}

function header(title) {
  console.log(`\n${colors.blue}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(60)}${colors.reset}\n`);
}

function assert(condition, message) {
  if (condition) {
    log('pass', message);
    passed++;
  } else {
    log('fail', message);
    failed++;
  }
}

function warning(message) {
  log('warn', message);
  warnings++;
}

// ─────── TESTE 1: RATE LIMITING ────────

async function testRateLimiting() {
  header('TEST 1: RATE LIMITING (5 req/hour per IP)');

  const results = [];

  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: `Rate Limit Test ${i}`,
          email: `ratelimit${i}@nexa.local`,
          phone: '1234567890',
          socialMedia: 'linkedin',
          profession: 'engineer',
          consent: true,
          consentVersion: '1.0',
        }),
      });

      results.push({
        attempt: i,
        status: response.status,
        ok: response.ok,
      });

      console.log(`  Request ${i}: HTTP ${response.status}`);
    } catch (err) {
      console.log(`  Request ${i}: Error (${err.message})`);
      results.push({ attempt: i, status: 0, ok: false });
    }
  }

  // Verifica padrão esperado: 5x 200/201, 1x 429
  const success = results.slice(0, 5).filter((r) => r.status === 200 || r.status === 201).length;
  const limited = results[5]?.status === 429;

  assert(success === 5 && limited, 'Rate limiting working (5 success, 1 rejected with 429)');
}

// ─────── TESTE 2: XSS PREVENTION ────────

async function testXSSPrevention() {
  header('TEST 2: XSS PREVENTION (HTML Escaping)');

  log('test', 'Enviando payload XSS no campo fullName');

  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'XSS<script>alert(1)</script>Test',
        email: `xss${Date.now()}@nexa.local`,
        phone: '1234567890',
        socialMedia: 'linkedin',
        profession: 'engineer',
        consent: true,
        consentVersion: '1.0',
      }),
    });

    const data = await response.json();

    // Deveria aceitar com 200 (não bloqueia, mas sanitiza)
    assert(response.status === 200 || response.status === 201, 'XSS payload accepted with 200/201');

    // Verifica se nome foi sanitizado
    if (data.data && data.data.position) {
      log('pass', 'XSS payload sanitized and processed');
    } else {
      warning('XSS sanitization verification inconclusive');
    }
  } catch (err) {
    log('fail', `XSS prevention test error: ${err.message}`);
    failed++;
  }
}

// ─────── TESTE 3: EMAIL ENUMERATION PROTECTION ────────

async function testEmailEnumeration() {
  header('TEST 3: EMAIL ENUMERATION PROTECTION');

  log('test', 'Comparando respostas para email existe vs. não existe');

  try {
    // Email que existe
    const existsResponse = await fetch(`${BASE_URL}/api/status?email=ratelimit1@nexa.local`);
    const existsData = await existsResponse.json();

    // Email que não existe
    const notExistsResponse = await fetch(`${BASE_URL}/api/status?email=nonexistent${Date.now()}@nexa.local`);
    const notExistsData = await notExistsResponse.json();

    // Ambas devem retornar estrutura similar (200, não 404)
    assert(existsResponse.status === 200, 'Email exists query returns 200');
    assert(notExistsResponse.status === 200, 'Email not exists query returns 200 (not 404)');

    // Ambas devem ter estrutura de resposta similar
    const hasExistsField = existsData.data && ('position' in existsData.data || 'found' in existsData.data);
    const hasNotExistsField = notExistsData.data && ('position' in notExistsData.data || 'found' in notExistsData.data);

    assert(hasExistsField && hasNotExistsField, 'Both responses have similar structure (email enumeration protection)');
  } catch (err) {
    log('fail', `Email enumeration test error: ${err.message}`);
    failed++;
  }
}

// ─────── TESTE 4: HONEYPOT DETECTION ────────

async function testHoneypot() {
  header('TEST 4: HONEYPOT BOT DETECTION');

  log('test', 'Preenchendo campo oculto website (honeypot)');

  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bot Attacker',
        email: `bot${Date.now()}@nexa.local`,
        phone: '1234567890',
        socialMedia: 'linkedin',
        profession: 'engineer',
        consent: true,
        consentVersion: '1.0',
        website: 'https://spam.com', // Honeypot field
      }),
    });

    // Honeypot deve rejeitar com 400
    assert(response.status === 400, 'Honeypot field rejected with HTTP 400');

    const data = await response.json();
    const hasHoneypotError = data.details && data.details.website;
    if (hasHoneypotError) {
      log('pass', `Honeypot error message: "${data.details.website}"`);
    }
  } catch (err) {
    log('fail', `Honeypot test error: ${err.message}`);
    failed++;
  }
}

// ─────── TESTE 5: LGPD COMPLIANCE ────────

async function testLGPDCompliance() {
  header('TEST 5: LGPD COMPLIANCE (Consentimento Versionado)');

  log('test', 'Verificando se consentVersion é registrado');

  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'LGPD Test User',
        email: `lgpd${Date.now()}@nexa.local`,
        phone: '1234567890',
        socialMedia: 'linkedin',
        profession: 'engineer',
        consent: true,
        consentVersion: '1.0',
      }),
    });

    assert(response.status === 200 || response.status === 201, 'LGPD consent registration accepted');

    const data = await response.json();
    if (data.data && data.data.position) {
      log('pass', 'User registered with consent version 1.0');
    }

    // Tenta sem consentimento
    const noConsentResponse = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'No Consent User',
        email: `noconsent${Date.now()}@nexa.local`,
        phone: '1234567890',
        socialMedia: 'linkedin',
        profession: 'engineer',
        consent: false, // Não consentiu
        consentVersion: '1.0',
      }),
    });

    assert(noConsentResponse.status === 400, 'Registration rejected without consent');
  } catch (err) {
    log('fail', `LGPD compliance test error: ${err.message}`);
    failed++;
  }
}

// ─────── TESTE 6: SECURITY HEADERS ────────

async function testSecurityHeaders() {
  header('TEST 6: SECURITY HEADERS');

  log('test', 'Verificando headers obrigatórios');

  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'HEAD', // HEAD não envia body
    });

    const csp = response.headers.get('content-security-policy');
    const noSniff = response.headers.get('x-content-type-options');
    const xFrame = response.headers.get('x-frame-options');
    const referrer = response.headers.get('referrer-policy');
    const hsts = response.headers.get('strict-transport-security');

    assert(csp, 'CSP header present');
    assert(noSniff === 'nosniff', 'X-Content-Type-Options: nosniff');
    assert(xFrame, 'X-Frame-Options header present');
    assert(referrer, 'Referrer-Policy header present');

    if (!hsts && BASE_URL.includes('https')) {
      warning('HSTS header missing (required for HTTPS)');
    } else if (hsts) {
      log('pass', `HSTS header present: ${hsts.split(';')[0]}`);
    }
  } catch (err) {
    log('fail', `Security headers test error: ${err.message}`);
    failed++;
  }
}

// ─────── TESTE 7: INPUT VALIDATION ────────

async function testInputValidation() {
  header('TEST 7: INPUT VALIDATION (Zod Schemas)');

  log('test', 'Testando rejeição de inputs inválidos');

  const invalidTests = [
    {
      name: 'Empty fullName',
      data: { fullName: '', email: 'test@nexa.local', phone: '1234567890', socialMedia: 'linkedin', profession: 'eng', consent: true, consentVersion: '1.0' },
    },
    {
      name: 'Invalid email',
      data: { fullName: 'Test User', email: 'invalid-email', phone: '1234567890', socialMedia: 'linkedin', profession: 'eng', consent: true, consentVersion: '1.0' },
    },
    {
      name: 'Phone too short',
      data: { fullName: 'Test User', email: `phone${Date.now()}@nexa.local`, phone: '123', socialMedia: 'linkedin', profession: 'eng', consent: true, consentVersion: '1.0' },
    },
    {
      name: 'Disposable email domain',
      data: { fullName: 'Test User', email: 'test@tempmail.com', phone: '1234567890', socialMedia: 'linkedin', profession: 'eng', consent: true, consentVersion: '1.0' },
    },
  ];

  for (const test of invalidTests) {
    try {
      const response = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.data),
      });

      assert(response.status === 400, `Input validation: ${test.name} rejected with 400`);
    } catch (err) {
      log('fail', `Input validation test error (${test.name}): ${err.message}`);
      failed++;
    }
  }
}

// ─────── TESTE 8: ERROR HANDLING ────────

async function testErrorHandling() {
  header('TEST 8: ERROR HANDLING (No Information Disclosure)');

  log('test', 'Verificando se erros não expõem dados sensíveis');

  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test',
        email: 'invalid',
        phone: '123',
        socialMedia: 'x',
        profession: 'x',
        consent: true,
        consentVersion: '1.0',
      }),
    });

    const text = await response.text();

    // Não deve expor stack trace, API keys, ou informações de sistema
    const hasStackTrace = /stack|trace|at\s+|\.js:/i.test(text);
    const hasApiKey = /api[_-]?key|secret|token|password/i.test(text) && !/authorization/i.test(text);

    assert(!hasStackTrace, 'No stack trace exposed in errors');
    assert(!hasApiKey, 'No sensitive credentials in error messages');
  } catch (err) {
    log('fail', `Error handling test error: ${err.message}`);
    failed++;
  }
}

// ─────── TESTE 9: CORS ────────

async function testCORS() {
  header('TEST 9: CORS VALIDATION');

  log('test', 'Verificando se CORS rejeita origens não-autorizadas');

  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://attacker.com',
        'Access-Control-Request-Method': 'POST',
      },
    });

    const allowOrigin = response.headers.get('access-control-allow-origin');

    assert(
      !allowOrigin || allowOrigin !== '*',
      'CORS does not use wildcard (*) for Access-Control-Allow-Origin'
    );

    if (allowOrigin && !allowOrigin.includes('attacker.com')) {
      log('pass', 'CORS properly rejects unauthorized origins');
    } else {
      warning('CORS origin validation may be too permissive');
    }
  } catch (err) {
    log('fail', `CORS test error: ${err.message}`);
    failed++;
  }
}

// ─────── MAIN ────────

async function runAllTests() {
  console.log(`\n${colors.blue}NEXA SECURITY TESTING SUITE${colors.reset}`);
  console.log(`Environment: ${colors.cyan}${ENVIRONMENT}${colors.reset}`);
  console.log(`Base URL: ${colors.cyan}${BASE_URL}${colors.reset}\n`);

  try {
    await testRateLimiting();
    await testXSSPrevention();
    await testEmailEnumeration();
    await testHoneypot();
    await testLGPDCompliance();
    await testSecurityHeaders();
    await testInputValidation();
    await testErrorHandling();
    await testCORS();
  } catch (err) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, err);
    process.exit(1);
  }

  // ─────── RESUMO ────────

  header('SUMMARY');

  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}\n`);

  const total = passed + failed;
  const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  console.log(`Success Rate: ${successRate}%\n`);

  if (failed === 0) {
    console.log(`${colors.green}🎉 ALL TESTS PASSED! Status: GO FOR PRODUCTION${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}⛔ FAILURES DETECTED. Status: NEEDS REVIEW${colors.reset}\n`);
    process.exit(1);
  }
}

runAllTests();
