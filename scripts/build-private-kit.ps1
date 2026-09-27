[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleaseDirectory = Join-Path $ProjectRoot 'release'
$DistributionDirectory = Join-Path $ProjectRoot 'distribution'
$KitDirectory = Join-Path $ReleaseDirectory 'AlarmeBin-Private-Kit'
$CertificateThumbprint = 'EF93510E6694345DCA8A960D634E0EA1C202D87D'

$Installer = Get-ChildItem -LiteralPath $ReleaseDirectory -Filter 'AlarmeBin-Setup-*.exe' |
    Where-Object { $_.Name -notlike '*.__uninstaller.exe' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $Installer) { throw 'Nenhum instalador do AlarmeBin foi encontrado em release.' }

$SigningCertificate = $null
if ($env:WIN_CSC_LINK -and $env:WIN_CSC_KEY_PASSWORD) {
    $CertificatePath = $env:WIN_CSC_LINK
    if ($CertificatePath.StartsWith('file:///', [StringComparison]::OrdinalIgnoreCase)) {
        $CertificatePath = $CertificatePath.Substring(8).Replace('/', '\')
    }
    if (Test-Path -LiteralPath $CertificatePath) {
        $CertificateFlags = [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::UserKeySet -bor
            [Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable
        $SigningCertificate = [Security.Cryptography.X509Certificates.X509Certificate2]::new(
            (Resolve-Path -LiteralPath $CertificatePath).Path,
            $env:WIN_CSC_KEY_PASSWORD.Trim(),
            $CertificateFlags
        )
    }
}

if (-not $SigningCertificate) {
    $SigningCertificate = Get-ChildItem Cert:\CurrentUser\My | Where-Object {
        $_.Thumbprint -eq $CertificateThumbprint -and $_.HasPrivateKey
    } | Select-Object -First 1
}

if (-not $SigningCertificate) { throw 'O certificado privado de release nao esta disponivel neste computador.' }
if (-not $SigningCertificate.HasPrivateKey -or $SigningCertificate.Thumbprint -ne $CertificateThumbprint) {
    throw 'O certificado privado de release nao corresponde ao certificado esperado.'
}

$InstallerSignature = Get-AuthenticodeSignature -LiteralPath $Installer.FullName
if (
    $InstallerSignature.Status -in @('NotSigned', 'HashMismatch') -or
    -not $InstallerSignature.SignerCertificate -or
    $InstallerSignature.SignerCertificate.Thumbprint -ne $CertificateThumbprint
) {
    throw "O instalador nao possui a assinatura privada esperada: $($InstallerSignature.Status)."
}

if (Test-Path -LiteralPath $KitDirectory) { Remove-Item -LiteralPath $KitDirectory -Recurse -Force }
New-Item -ItemType Directory -Path $KitDirectory | Out-Null

$Files = @(
    'AlarmeBin-Public.cer',
    'Install-AlarmeBin.ps1',
    'Instalar-AlarmeBin.cmd',
    'Remove-AlarmeBin-Trust.ps1',
    'LEIA-ME.txt'
)

foreach ($File in $Files) {
    Copy-Item -LiteralPath (Join-Path $DistributionDirectory $File) -Destination $KitDirectory
}
Copy-Item -LiteralPath $Installer.FullName -Destination $KitDirectory

foreach ($ScriptName in @('Install-AlarmeBin.ps1', 'Remove-AlarmeBin-Trust.ps1')) {
    $ScriptPath = Join-Path $KitDirectory $ScriptName
    $Result = Set-AuthenticodeSignature -FilePath $ScriptPath -Certificate $SigningCertificate -HashAlgorithm SHA256
    if (
        $Result.Status -in @('NotSigned', 'HashMismatch') -or
        -not $Result.SignerCertificate -or
        $Result.SignerCertificate.Thumbprint -ne $CertificateThumbprint
    ) {
        throw "Falha ao assinar ${ScriptName}: $($Result.StatusMessage)"
    }
}

$Version = [System.Diagnostics.FileVersionInfo]::GetVersionInfo((Join-Path $ReleaseDirectory 'win-unpacked\AlarmeBin.exe')).FileVersion
$ArchivePath = Join-Path $ReleaseDirectory "AlarmeBin-Private-Kit-$Version.zip"
if (Test-Path -LiteralPath $ArchivePath) { Remove-Item -LiteralPath $ArchivePath -Force }
Compress-Archive -Path (Join-Path $KitDirectory '*') -DestinationPath $ArchivePath -CompressionLevel Optimal

Write-Host "Kit privado criado em $ArchivePath"
