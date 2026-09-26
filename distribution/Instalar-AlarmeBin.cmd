@echo off
setlocal
title Instalador privado do AlarmeBin
echo Verificando o certificado e a assinatura do AlarmeBin...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-AlarmeBin.ps1"
if errorlevel 1 exit /b 1
pause
