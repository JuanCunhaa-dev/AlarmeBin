[CmdletBinding()]
param(
    [string]$Repository = 'JuanCunhaa-dev/AlarmeBin'
)

$ErrorActionPreference = 'Stop'
$Thumbprint = 'EF93510E6694345DCA8A960D634E0EA1C202D87D'
$Certificate = Get-ChildItem Cert:\CurrentUser\My | Where-Object {
    $_.Thumbprint -eq $Thumbprint -and $_.HasPrivateKey
} | Select-Object -First 1

if (-not $Certificate) {
    throw 'O certificado privado do AlarmeBin não foi encontrado neste usuário.'
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw 'GitHub CLI (gh) não foi encontrado.'
}

$RandomBytes = New-Object byte[] 36
$RandomGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $RandomGenerator.GetBytes($RandomBytes)
} finally {
    $RandomGenerator.Dispose()
}
$PasswordText = [Convert]::ToBase64String($RandomBytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
$SecurePassword = ConvertTo-SecureString $PasswordText -AsPlainText -Force
$TemporaryPfx = Join-Path $env:TEMP ("alarmebin-" + [guid]::NewGuid().ToString('N') + '.pfx')

try {
    Export-PfxCertificate -Cert $Certificate -FilePath $TemporaryPfx -Password $SecurePassword -CryptoAlgorithmOption AES256_SHA256 -Force | Out-Null
    $PfxBase64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($TemporaryPfx))

    $PfxBase64 | gh secret set WINDOWS_CERTIFICATE_BASE64 --repo $Repository
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao cadastrar WINDOWS_CERTIFICATE_BASE64.' }

    $PasswordText | gh secret set WINDOWS_CERTIFICATE_PASSWORD --repo $Repository
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao cadastrar WINDOWS_CERTIFICATE_PASSWORD.' }

    gh variable set PRIVATE_SIGNING_READY --repo $Repository --body true
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao habilitar o workflow de release.' }

    Write-Host 'Assinatura automática do GitHub configurada com sucesso.' -ForegroundColor Green
    Write-Host 'A chave privada não foi adicionada ao repositório.' -ForegroundColor Green
} finally {
    if (Test-Path -LiteralPath $TemporaryPfx) {
        Remove-Item -LiteralPath $TemporaryPfx -Force
    }
    $PasswordText = $null
    $SecurePassword = $null
    $PfxBase64 = $null
}
