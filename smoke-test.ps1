# smoke-test.ps1
# Teste rápido dos endpoints principais após o deploy

$BaseUrl = "https://nexa-whiilist.vercel.app"
$EmailToTest = "beta-test-$(Get-Date -Format 'yyyyMMddHHmmss')@email.com"

Write-Host "Iniciando Smoke Test - Nexa v2.1" -ForegroundColor Cyan
Write-Host "==============================="

# 1. Testar Status (Not Found)
Write-Host "`n[1] Testando GET /api/status (Não encontrado)..."
try {
    $StatusResponse = Invoke-WebRequest -Uri "$BaseUrl/api/status?email=$EmailToTest" -Method Get
    $StatusJson = $StatusResponse.Content | ConvertFrom-Json
    if ($StatusJson.success -and $StatusJson.data.found -eq $false) {
        Write-Host "✅ OK: Usuário não encontrado conforme esperado." -ForegroundColor Green
    } else {
        Write-Host "❌ Falha: Resposta inesperada." -ForegroundColor Red
        $StatusJson | ConvertTo-Json -Depth 3 | Write-Host
    }
} catch {
    Write-Host "❌ Falha na requisição: $_" -ForegroundColor Red
}

# 2. Testar Inscrição (Success)
Write-Host "`n[2] Testando POST /api/register (Inscrição de novo usuário)..."
$RegisterPayload = @{
    fullName = "Tester da Silva"
    email = $EmailToTest
    phone = "(11) 99999-9999"
    socialMedia = "linkedin"
    profession = "profissional"
    lossExperience = "Prejuízo testando endpoints na produção com procrastinação"
    consent = $true
} | ConvertTo-Json

try {
    $RegisterResponse = Invoke-WebRequest -Uri "$BaseUrl/api/register" -Method Post -Body $RegisterPayload -ContentType "application/json"
    $RegisterJson = $RegisterResponse.Content | ConvertFrom-Json
    if ($RegisterJson.success -and $RegisterJson.data.position) {
        Write-Host "✅ OK: Inscrição confirmada. Posição na fila: $($RegisterJson.data.position)" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha: Resposta inesperada." -ForegroundColor Red
        $RegisterJson | ConvertTo-Json -Depth 3 | Write-Host
    }
} catch {
    Write-Host "❌ Falha na requisição: $_" -ForegroundColor Red
}

# 3. Testar Status (Found)
Write-Host "`n[3] Testando GET /api/status (Usuário encontrado)..."
try {
    $StatusResponse2 = Invoke-WebRequest -Uri "$BaseUrl/api/status?email=$EmailToTest" -Method Get
    $StatusJson2 = $StatusResponse2.Content | ConvertFrom-Json
    if ($StatusJson2.success -and $StatusJson2.data.found -eq $true) {
        Write-Host "✅ OK: Usuário encontrado com as iniciais $($StatusJson2.data.initials)" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha: Resposta inesperada." -ForegroundColor Red
        $StatusJson2 | ConvertTo-Json -Depth 3 | Write-Host
    }
} catch {
    Write-Host "❌ Falha na requisição: $_" -ForegroundColor Red
}

Write-Host "`nSmoke Test Finalizado!" -ForegroundColor Cyan
