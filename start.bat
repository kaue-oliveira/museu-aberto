@echo off
setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   Museu Aberto -- Galeria Digital de Arte
echo ==========================================
echo.

REM Check Java
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Java nao encontrado. Instale Java 17+
    echo Download: https://adoptium.net/
    pause
    exit /b 1
)
echo [OK] Java detectado

set JAR_FILE=backend\target\museu-aberto-backend-1.0.0.jar
if not exist "%JAR_FILE%" (
    echo [ERRO] Arquivo JAR nao encontrado em %JAR_FILE%
    pause
    exit /b 1
)

REM Start application
echo.
echo [INFO] Iniciando aplicacao na porta 8091...
start "Museu Aberto" java -jar "%JAR_FILE%"

REM Wait a bit for application to start
echo [INFO] Aguardando inicializacao (15 segundos)...
timeout /t 15 /nobreak >nul

echo.
echo ==========================================
echo   Aplicacao Iniciada!
echo ==========================================
echo   Acesse: http://localhost:8091
echo   API:    http://localhost:8091/api
echo   H2 Console: http://localhost:8091/h2-console
echo ==========================================
echo.
echo Feche a janela do terminal para parar a aplicacao.
echo.
pause
