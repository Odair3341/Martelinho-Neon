## Objetivo
Garantir que o app esteja conectado ao banco Neon (não Supabase), validando via Vercel e (se necessário) usando MCP Neon para inspeção, sem alterar dados.

## Diagnóstico de Deploy e Rotas
1. Verificar projeto Vercel do domínio `martelinho-neon.vercel.app`:
   - Repositório conectado: `Odair3341/Martelinho-Neon`
   - Branch de produção: `main`
   - Root Directory: raiz (onde existe a pasta `api/`)
   - Build: `npm run build`; Output: `dist`
2. Confirmar variável `DATABASE_URL`:
   - Adicionar em “All Environments”: Production, Preview e Development
   - Valor: string Neon `postgresql://...neon.tech/neondb?sslmode=require&channel_binding=require`
3. Redeploy do último commit em `main`.
4. Testar rotas:
   - `GET /api/health` deve retornar `{ ok: true, hasEnv: true, result: true }`
   - `GET /api/data` deve retornar JSON com `clientes`, `servicos`, `despesas`, `comissoes`
   - Se `api/health` retornar 404, validar que o domínio está no projeto correto e que as funções em `api/` estão sendo publicadas.

## Validação da Conexão Neon (sem alterar dados)
1. Verificar formatação da `DATABASE_URL` e parâmetros `sslmode=require` e `channel_binding=require`.
2. Teste externo opcional com `psql` (no seu PC) para confirmar credenciais:
   - `psql "postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require&channel_binding=require"`
   - `\dt public.*`, `SELECT COUNT(*) FROM public.servicos;`
3. Usar MCP Neon (somente leitura):
   - Listar projetos (se disponível) e descrever projeto para conferir status
   - Não criar/deletar nada — apenas leitura

## Ajustes de Código (após confirmação)
1. Remover autenticação Supabase reativada por engano:
   - Tornar `/` público novamente e retirar `ProtectedRoute`
   - Manter apenas o Neon para dados (sem Supabase)
2. Manter endpoints incrementais (já criados):
   - `POST /api/service-create` para adicionar serviço sem apagar dados
3. Melhorar `api/import` (já melhorado):
   - Preservar IDs, converter números, sincronizar sequences
   - Responder erros por item/tabela (`errors: [...]`)
4. Adicionar logs detalhados nas respostas de erro 500 das APIs (somente backend) para facilitar suporte.

## Critérios de Sucesso
- `GET /api/health` retorna ok e `GET /api/data` traz dados
- Adicionar novo serviço funciona e persiste no Neon sem apagar dados
- A home carrega sem login e sem erro

## Próximo Passo
Confirme para eu executar: (a) validação das configurações na Vercel, (b) testes das rotas `api/health` e `api/data`, e (c) remoção do fluxo Supabase e ajustes finais do app para Neon-only. Posso também usar MCP Neon em modo leitura para conferir projetos/status.