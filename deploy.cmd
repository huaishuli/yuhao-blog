@echo off
setlocal
rem Build and deploy this Firefly site to Cloudflare Workers.
rem Usage:  deploy.cmd            (build + deploy)
rem         deploy.cmd --skip-build  (upload existing dist only)

set "NODE_DIR=C:\Users\19352\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin"
set "PNPM_CLI=C:\Users\19352\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs"
set "PATH=%NODE_DIR%;%PATH%;C:\Program Files\nodejs"
set "npm_config_registry=https://registry.npmmirror.com"
set "NODE_ENV=production"

cd /d "%~dp0"

if /i "%~1"=="--skip-build" goto deploy

echo ==^> pnpm build
call node "%PNPM_CLI%" build
if errorlevel 1 (
  echo build failed
  exit /b 1
)

:deploy
echo ==^> wrangler deploy
set "CI=1"
call node node_modules\wrangler\bin\wrangler.js deploy
if errorlevel 1 (
  echo deploy failed
  exit /b 1
)

echo ==^> done
endlocal
