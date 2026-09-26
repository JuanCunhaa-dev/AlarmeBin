[CmdletBinding()]
param(
    [string]$InstallerPath,
    [switch]$Silent
)

$ErrorActionPreference = 'Stop'
$ExpectedThumbprint = 'EF93510E6694345DCA8A960D634E0EA1C202D87D'
$ExpectedSubject = 'CN=AlarmeBin Private Publisher'
$ScriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$CertificatePath = Join-Path $ScriptDirectory 'AlarmeBin-Public.cer'

function Stop-WithMessage([string]$Message) {
    Write-Host "ERRO: $Message" -ForegroundColor Red
    Write-Host 'Nenhuma alteração adicional foi realizada.' -ForegroundColor Yellow
    Read-Host 'Pressione Enter para fechar'
    exit 1
}

try {
    if (-not (Test-Path -LiteralPath $CertificatePath)) {
        Stop-WithMessage 'O certificado público não está junto do instalador.'
    }

    $Certificate = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($CertificatePath)
    if ($Certificate.Thumbprint -ne $ExpectedThumbprint -or $Certificate.Subject -ne $ExpectedSubject) {
        Stop-WithMessage 'A identidade do certificado não corresponde à versão oficial do AlarmeBin.'
    }

    $CodeSigningEku = $Certificate.Extensions | Where-Object {
        $_.Oid.Value -eq '2.5.29.37' -and $_.Format($false) -match '1\.3\.6\.1\.5\.5\.7\.3\.3|Code Signing|Assinatura de Código'
    }
    if (-not $CodeSigningEku) {
        Stop-WithMessage 'O certificado não está autorizado para assinatura de código.'
    }

    foreach ($Store in @('Cert:\CurrentUser\Root', 'Cert:\CurrentUser\TrustedPublisher')) {
        if (-not (Test-Path -LiteralPath (Join-Path $Store $ExpectedThumbprint))) {
            Import-Certificate -FilePath $CertificatePath -CertStoreLocation $Store | Out-Null
        }
    }

    if (-not $InstallerPath) {
        $Installer = Get-ChildItem -LiteralPath $ScriptDirectory -Filter 'AlarmeBin-Setup-*.exe' |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if (-not $Installer) { Stop-WithMessage 'O instalador do AlarmeBin não foi encontrado.' }
        $InstallerPath = $Installer.FullName
    }

    $ResolvedInstaller = (Resolve-Path -LiteralPath $InstallerPath).Path
    Unblock-File -LiteralPath $ResolvedInstaller
    $Signature = Get-AuthenticodeSignature -LiteralPath $ResolvedInstaller
    if ($Signature.Status -ne 'Valid' -or $Signature.SignerCertificate.Thumbprint -ne $ExpectedThumbprint) {
        Stop-WithMessage "A assinatura do instalador é inválida: $($Signature.Status)."
    }

    Write-Host 'Certificado verificado e instalado para este usuário.' -ForegroundColor Green
    Write-Host 'Assinatura do instalador confirmada.' -ForegroundColor Green

    $Arguments = if ($Silent) { '/S' } else { '' }
    $Process = Start-Process -FilePath $ResolvedInstaller -ArgumentList $Arguments -Wait -PassThru
    if ($Process.ExitCode -ne 0) {
        Stop-WithMessage "O instalador terminou com o código $($Process.ExitCode)."
    }

    Write-Host 'AlarmeBin instalado com sucesso.' -ForegroundColor Green
} catch {
    Stop-WithMessage $_.Exception.Message
}
