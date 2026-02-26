@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ── GIS Demo Helper - Windows Kurulum ──────────────────────────────────────
:: Kullanım: setup.bat

echo.
echo   ╔══════════════════════════════════════╗
echo   ║       GIS Demo Helper Setup          ║
echo   ╚══════════════════════════════════════╝
echo.

:: 1. Node.js kontrolü
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js bulunamadi. Lutfen Node.js 18+ yukleyin:
    echo     https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
for /f "tokens=2 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)"
if %errorlevel% neq 0 (
    echo [!] Node.js 18+ gerekli.
    for /f %%v in ('node -v') do echo     Mevcut: %%v
    pause
    exit /b 1
)
for /f %%v in ('node -v') do echo [+] Node.js %%v
echo.

:: 2. npm kontrolü
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] npm bulunamadi.
    pause
    exit /b 1
)
for /f %%v in ('npm -v') do echo [+] npm %%v
echo.

:: 3. Bağımlılıkları yükle
echo [*] Bagimliliklar yukleniyor...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [!] npm install basarisiz!
    pause
    exit /b 1
)
echo [+] Bagimliliklar yuklendi
echo.

:: 4. .env.local dosyasını oluştur (yoksa)
if not exist .env.local (
    echo # Overpass API endpoint ^(varsayilan, degistirmenize gerek yok^)>.env.local
    echo OVERPASS_API_URL=https://overpass-api.de/api/interpreter>>.env.local
    echo [+] .env.local olusturuldu
) else (
    echo [+] .env.local zaten mevcut
)
echo.

:: 5. Build
echo [*] Proje derleniyor...
call npm run build
if %errorlevel% neq 0 (
    echo [!] Build basarisiz!
    pause
    exit /b 1
)
echo [+] Build basarili
echo.

:: 6. Tamamlandı
echo ══════════════════════════════════════
echo   Kurulum tamamlandi!
echo ══════════════════════════════════════
echo.
echo   Gelistirme modu:  npm run dev
echo   Production modu:  npm run start
echo   Tarayicida ac:    http://localhost:3000
echo.
echo   Not: Hicbir API key gerekmez!
echo.

:: Otomatik başlat
set /p REPLY="Simdi baslatilsin mi? (dev modu) [E/h]: "
if /i "!REPLY!"=="h" (
    echo Cikiliyor...
    pause
    exit /b 0
)
echo [*] Dev sunucu baslatiliyor...
call npm run dev
