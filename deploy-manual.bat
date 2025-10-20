@echo off
echo ========================================
echo    DEPLOY MANUAL NETLIFY
echo ========================================
echo.
echo Abrindo painel do Netlify...
start https://app.netlify.com/sites/lucianomartelinho/deploys
echo.
echo INSTRUCOES:
echo 1. Clique no botao "Trigger deploy"
echo 2. Selecione "Deploy site"
echo 3. Aguarde 2-3 minutos
echo.
echo ========================================
echo    CONFIGURAR BUILD HOOK (OPCIONAL)
echo ========================================
echo.
echo Para automatizar no futuro:
echo 1. Acesse: Site Settings ^> Build ^& deploy
echo 2. Role ate "Build hooks"
echo 3. Clique "Add build hook"
echo 4. Nome: "Manual Deploy"
echo 5. Branch: "main"
echo 6. Copie a URL gerada
echo.
pause