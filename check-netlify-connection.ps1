# Script para verificar e corrigir a conexão Netlify-GitHub
# Execute: .\check-netlify-connection.ps1

Write-Host "🔍 Verificando conexão Netlify-GitHub..." -ForegroundColor Cyan
Write-Host ""

# Verificar status do repositório local
Write-Host "📂 Status do repositório local:" -ForegroundColor Yellow
git status
Write-Host ""

# Verificar últimos commits
Write-Host "📝 Últimos commits:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# Verificar se há mudanças não enviadas
Write-Host "🔄 Verificando se há mudanças pendentes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  Há mudanças não commitadas:" -ForegroundColor Red
    git status --short
} else {
    Write-Host "✅ Repositório local está limpo" -ForegroundColor Green
}
Write-Host ""

# Verificar se está sincronizado com o remoto
Write-Host "🌐 Verificando sincronização com GitHub..." -ForegroundColor Yellow
git fetch origin
$behind = git rev-list HEAD..origin/master --count
$ahead = git rev-list origin/master..HEAD --count

if ($behind -gt 0) {
    Write-Host "⚠️  Seu repositório local está $behind commits atrás do GitHub" -ForegroundColor Red
    Write-Host "Execute: git pull origin master" -ForegroundColor Cyan
} elseif ($ahead -gt 0) {
    Write-Host "⚠️  Você tem $ahead commits não enviados para o GitHub" -ForegroundColor Red
    Write-Host "Execute: git push origin master" -ForegroundColor Cyan
} else {
    Write-Host "✅ Repositório local sincronizado com GitHub" -ForegroundColor Green
}
Write-Host ""

# Abrir páginas relevantes
Write-Host "🌐 Abrindo páginas para verificação manual..." -ForegroundColor Cyan
Write-Host "1. GitHub Repository" -ForegroundColor White
Start-Process "https://github.com/Odair3341/Luciano-martelinho"
Start-Sleep 2

Write-Host "2. Netlify Deploys" -ForegroundColor White
Start-Process "https://app.netlify.com/sites/martelinho-lovable/deploys"
Start-Sleep 2

Write-Host "3. Netlify Settings" -ForegroundColor White
Start-Process "https://app.netlify.com/sites/martelinho-lovable/settings/deploys"
Write-Host ""

Write-Host "📋 CHECKLIST MANUAL:" -ForegroundColor Yellow
Write-Host "□ 1. Verificar se o último commit aparece no GitHub" -ForegroundColor White
Write-Host "□ 2. Verificar se o Netlify está conectado ao repositório correto" -ForegroundColor White
Write-Host "□ 3. Verificar se a branch 'master' está selecionada no Netlify" -ForegroundColor White
Write-Host "□ 4. Verificar se 'Auto publishing' está habilitado" -ForegroundColor White
Write-Host "□ 5. Se necessário, clicar 'Trigger deploy' > 'Deploy site'" -ForegroundColor White
Write-Host ""
Write-Host "✨ Verificação concluída!" -ForegroundColor Green