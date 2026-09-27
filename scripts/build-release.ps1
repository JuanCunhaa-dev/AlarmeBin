[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$CertificateThumbprint = 'EF93510E6694345DCA8A960D634E0EA1C202D87D'
$CertificateSubject = 'AlarmeBin Private Publisher'

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(Mandatory = $true)]
        [string[]]$ArgumentList
    )

    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "$FilePath falhou com o codigo $LASTEXITCODE."
    }
}

Push-Location $ProjectRoot
try {
    Invoke-NativeCommand -FilePath 'npm.cmd' -ArgumentList @('run', 'build')

    $BuilderPath = Join-Path $ProjectRoot 'node_modules\.bin\electron-builder.cmd'
    $BuilderArguments = @('--win', 'nsis')

    if (-not $env:WIN_CSC_LINK) {
        # Builds locais usam o certificado privado instalado no perfil do usuario.
        $BuilderArguments += "--config.win.signtoolOptions.certificateSubjectName=$CertificateSubject"
        $BuilderArguments += "--config.win.signtoolOptions.certificateSha1=$CertificateThumbprint"
    }

    Invoke-NativeCommand -FilePath $BuilderPath -ArgumentList $BuilderArguments
    Invoke-NativeCommand -FilePath 'npm.cmd' -ArgumentList @('run', 'bundle:private')
} finally {
    Pop-Location
}
