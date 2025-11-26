## Objetivo
Eliminar qualquer exigência de senha/login e garantir que o sistema funcione apenas com o banco Neon, sem Supabase.

## Causas Prováveis
- A rota "/auth" foi reativada em um deploy anterior e está protegendo a home.
- O componente `ProtectedRoute` pode estar protegendo `/` ou algum fallback ainda redireciona para `/auth`.

## Ajustes no Código
1. `src/App.tsx`
   - Remover imports de `Auth` e `ProtectedRoute`.
   - Definir rotas públicas:
     - `/` → `Index`
     - `*` → `NotFound`
   - Não incluir a rota `/auth`.
2. `src/pages/NotFound.tsx`
   - Confirmar que não usa Supabase nem redireciona para `/auth` (apenas botão "Ir para o início").
3. `src/integrations/supabase/client.ts`
   - Manter stub seguro: não lançar erro se `VITE_SUPABASE_*` não existir.
4. Opcional (limpeza):
   - Remover `src/pages/Auth.tsx` e `src/components/ProtectedRoute.tsx` do projeto para evitar reintrodução acidental.

## Validação
1. Build local (verificação de importações e bundle).
2. Redeploy na Vercel (branch `main`).
3. Testes de produção:
   - Abrir `https://martelinho-neon.vercel.app/` → deve carregar sem pedir senha.
   - `GET /api/health` → conexão Neon OK.
   - `GET /api/data` → retorna `clientes`, `servicos`, `despesas`, `comissoes`.
   - Adicionar novo serviço via UI → persiste com `POST /api/service-create`.

## Critérios de Sucesso
- Home acessível sem login.
- Nenhum redirecionamento para `/auth`.
- Dados carregando do Neon e operações persistindo normalmente.

## Próximo Passo
Se você aprovar, eu aplico os ajustes nas rotas, limpo dependências de login e faço o redeploy. Em seguida, valido `/api/health` e `/api/data` e te entrego o status final.