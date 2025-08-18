# Script PowerShell para forcar deploy no Netlify
# Execute: .\force-deploy.ps1

Write-Host "Forcando deploy manual no Netlify..." -ForegroundColor Green

# URL do build hook - voce precisa configurar isso no Netlify
$buildHookUrl = "https://api.netlify.com/build_hooks/YOUR_BUILD_HOOK_ID"

# Se voce nao tem o build hook configurado, vamos usar uma abordagem diferente
Write-Host "Para configurar o build hook:" -ForegroundColor Yellow
Write-Host "1. Acesse: https://app.netlify.com/sites/lucianomartelinho/settings/deploys" -ForegroundColor White
Write-Host "2. Role ate Build hooks" -ForegroundColor White
Write-Host "3. Clique Add build hook" -ForegroundColor White
Write-Host "4. Nome: Manual Deploy" -ForegroundColor White
Write-Host "5. Branch: master" -ForegroundColor White
Write-Host "6. Copie a URL e substitua no script" -ForegroundColor White
Write-Host ""

# Por enquanto, vamos abrir o painel do Netlify para deploy manual
Write-Host "Abrindo painel do Netlify para deploy manual..." -ForegroundColor Green
Start-Process "https://app.netlify.com/sites/lucianomartelinho/deploys"

Write-Host ""
Write-Host "Painel do Netlify aberto!" -ForegroundColor Green
Write-Host "Clique no botao Trigger deploy > Deploy site" -ForegroundColor Yellow
Write-Host "Aguarde 2-3 minutos para o deploy completar" -ForegroundColor Cyan