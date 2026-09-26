[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Thumbprint = 'EF93510E6694345DCA8A960D634E0EA1C202D87D'

foreach ($Store in @('Cert:\CurrentUser\Root', 'Cert:\CurrentUser\TrustedPublisher')) {
    $CertificatePath = Join-Path $Store $Thumbprint
    if (Test-Path -LiteralPath $CertificatePath) {
        Remove-Item -LiteralPath $CertificatePath -Force
        Write-Host "Confiança removida de $Store" -ForegroundColor Yellow
    }
}

Write-Host 'A confiança privada do AlarmeBin foi removida deste usuário.' -ForegroundColor Green
