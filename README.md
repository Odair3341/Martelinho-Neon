# Martelinho Lovable - Sistema de Gestão

Sistema de gestão para oficina de martelinho de ouro com controle de clientes, serviços, despesas e comissões.

Última atualização: 09/01/2025 - 09:15

## 🚀 Deploy no Netlify

### Pré-requisitos
- Conta no [Netlify](https://netlify.com)
- Repositório Git (GitHub, GitLab, etc.)
- Projeto Supabase configurado

### Passos para Deploy

1. **Faça push do código para um repositório Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <seu-repositorio>
   git push -u origin main
   ```

2. **Configure no Netlify**
   - Acesse [Netlify](https://app.netlify.com)
   - Clique em "New site from Git"
   - Conecte seu repositório
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Variáveis de Ambiente**
   No painel do Netlify, vá em Site settings > Environment variables e adicione:
   ```
   VITE_SUPABASE_URL=https://fdavzmkbbyhqljkcjwmq.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkYXZ6bWtiYnlocWxqa2Nqd21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTU0NTQsImV4cCI6MjA3MDc3MTQ1NH0.28W1TceOuTZlnp0yVF4WMDMAOPcmA5BA45XavXUmZGo
   ```

4. **Deploy**
   - O Netlify fará o deploy automaticamente
   - Sua aplicação estará disponível em uma URL como: `https://seu-site.netlify.app`

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📋 Funcionalidades

- ✅ Gestão de clientes
- ✅ Controle de serviços
- ✅ Gestão de despesas
- ✅ Controle de comissões
- ✅ Relatórios financeiros
- ✅ Backup e importação de dados
- ✅ Autenticação segura

## 🔧 Tecnologias

- React + TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- Supabase (Backend)
- React Router
- React Hook Form

## 📞 Suporte

Para suporte técnico, entre em contato através do sistema.

## 🧩 Extensões Netlify (Neon) com Supabase

Se você usa Supabase, não precisa da extensão Neon do Netlify (Neon é outra plataforma de Postgres). Manter essa extensão ativa pode causar falhas de build com `ETIMEDOUT` durante "Installing extensions".

### Como desativar
- Netlify → `Site settings` → `Extensions` → selecione `Neon` → `Disable/Uninstall`
- Netlify → `Deploys` → `Clear build cache and deploy site`
- Netlify → `Site settings` → `Build & deploy` → `Production branch` = `main`

### Se quiser manter extensões
- Defina variáveis de ambiente para tolerar timeouts:
  - `NPM_CONFIG_FETCH_TIMEOUT=600000`
  - `NPM_CONFIG_RETRY=5`

### Referência
- Erro "Build script returned non-zero exit code: 2": https://ntl.fyi/exit-code-2
