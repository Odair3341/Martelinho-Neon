# 🚀 Instruções para Resolver o Deploy Automático do Netlify

## ❌ Problema Atual
O deploy automático do Netlify parou de funcionar. Os pushes para o GitHub não estão disparando novos deploys automaticamente.

## ✅ Soluções Disponíveis

### 1. **SOLUÇÃO IMEDIATA: Deploy Manual**
Enquanto o automático não funciona, você pode fazer deploy manual:

1. Acesse: https://app.netlify.com/sites/lucianomartelinho/deploys
2. Clique no botão **"Trigger deploy"**
3. Selecione **"Deploy site"**

### 2. **SOLUÇÃO ALTERNATIVA: Build Hook**
Configure um Build Hook para deploy via script:

1. **No Netlify:**
   - Vá em: Site Settings → Build & deploy → Build hooks
   - Clique em **"Add build hook"**
   - Nome: "Manual Deploy"
   - Branch: "main"
   - Copie a URL gerada

2. **No projeto:**
   - Abra o arquivo `deploy.js`
   - Substitua `SEU_BUILD_HOOK_AQUI` pela URL copiada
   - Execute: `node deploy.js`

### 3. **SOLUÇÃO DEFINITIVA: Corrigir Webhook**

#### Opção A: Relinkar Repositório
1. **No Netlify:**
   - Vá em: Site Settings → Build & deploy → Continuous deployment
   - Clique em **"Manage repository"**
   - Selecione **"Link to a different repository"**
   - Relinque o mesmo repositório: `Odair3341/Luciano-martelinho`
   - Confirme que a "Production branch" é `main`

#### Opção B: Verificar Webhooks no GitHub
1. **No GitHub:**
   - Vá em: https://github.com/Odair3341/Luciano-martelinho/settings/hooks
   - Verifique se existe um webhook do Netlify
   - Se houver webhooks duplicados ou com erro, remova-os
   - O webhook correto deve apontar para: `https://api.netlify.com/hooks/github`

#### Opção C: Verificar Permissões
1. **No GitHub:**
   - Vá em: Settings → Applications → Authorized OAuth Apps
   - Verifique se o Netlify tem permissões adequadas
   - Se necessário, revogue e reautorize

### 4. **Variáveis de Ambiente (Netlify)**
Para evitar expor segredos no repositório e garantir consistência em todos os contextos de deploy, configure as variáveis no Netlify:

- Site Settings → Build & deploy → Environment
- Adicione:
  - `VITE_SUPABASE_URL` = `https://fdavzmkbbyhqljkcjwmq.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYXZ6bWtiYnlocWxqa2Nqd21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTU0NTQsImV4cCI6MjA3MDc3MTQ1NH0.28W1TceOuTZlnp0yVF4WMDMAOPcmA5BA45XavXUmZGo`
- Opcional: remova essas variáveis do `netlify.toml` depois que estiverem definidas no Netlify.
- Recomendo também definir `NODE_VERSION=18` no Netlify para alinhar com o projeto.

## 🔧 Teste do Deploy Automático

Após aplicar qualquer solução acima, teste fazendo uma pequena alteração:

```bash
# Faça uma pequena alteração
echo "Teste $(date)" >> README.md

# Commit e push
git add README.md
git commit -m "Test: Deploy automático"
git push origin main
```

Aguarde 2-3 minutos e verifique se apareceu um novo deploy no painel do Netlify.

## 📞 Suporte

Se nenhuma solução funcionar:
1. Entre em contato com o suporte do Netlify
2. Mencione que o webhook do GitHub parou de funcionar
3. Forneça o ID do site: `lucianomartelinho`

## 🎯 Status Atual
- ✅ Código atualizado no GitHub
- ✅ Funcionalidade "Desfazer Comissão" implementada
- ❌ Deploy automático não funcionando
- ✅ Deploy manual disponível como alternativa