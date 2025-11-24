## Pré-checagens
- Confirmar que Git está instalado e disponível no terminal.
- Verificar se o diretório do projeto é `c:\Users\Financeiro\Documents\Martelinho Lovable`.

## Ajustes de segurança antes do commit
- Criar/ajustar `.gitignore` para ignorar `node_modules/`, `dist/`, `.env`, `*.log`, `.vscode/`, `coverage/`.
- Remover valores hardcoded sensíveis do código (ex.: anon key em `src/integrations/supabase/client.ts`) e usar somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via `.env`.

## Inicializar o repositório
- Executar `git init` no diretório do projeto.
- Definir branch padrão para `main` com `git branch -M main`.

## Preparar commit
- Executar `git add .` (com `.env` e arquivos ignorados fora do stage).
- Executar `git commit -m "feat: ajustes Supabase e correção de gravação de serviços"`.

## Configurar remoto e enviar
- Adicionar remoto: `git remote add origin https://github.com/Odair3341/Luciano-martelinho.git`.
- Executar `git push -u origin main`.

## Autenticação no GitHub
- Se solicitado, autenticar com GitHub (credenciais ou Personal Access Token com escopo `repo`).

## Verificação
- Abrir o repositório no GitHub e confirmar arquivos, histórico e que `.env` não foi versionado.
- Rodar `npm run dev` localmente para garantir que o projeto funciona pós-commit.

## Possíveis bloqueios e tratamento
- Caso o repositório remoto não exista ou não tenha permissões, criar/ajustar permissões no GitHub para o usuário atual.
- Se o push falhar por conflito de branch, usar `git push -u origin main --force-with-lease` apenas se for repositório vazio ou aprovado.

Confirma seguir com esses passos e aplicar os ajustes (incluindo remover a anon key hardcoded) antes de fazer o push?