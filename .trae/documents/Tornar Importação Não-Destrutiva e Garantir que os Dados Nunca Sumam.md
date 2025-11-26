## Objetivo
Eliminar o risco de apagar dados ao importar e operar sempre de forma incremental no Neon, sem exigir backups diários.

## Mudanças Propostas (Seguras)
1. `api/import.ts` (modo seguro por padrão):
   - Remover os `DELETE` gerais.
   - Implementar **append/merge** com `INSERT ... ON CONFLICT (id) DO UPDATE` para `clientes`, `servicos`, `despesas`, `comissoes`.
   - Sincronizar sequences após a importação (já implementado; manter).
   - Suportar um **flag opcional** `mode: "replace"` no corpo (ou query) para substituição total, e nesse caso pedir confirmação explícita no frontend.
2. Frontend `ImportDialog`:
   - Adicionar seletor de modo: `Adicionar/Mesclar (recomendado)` vs `Substituir (apaga tudo)` — **padrão: Adicionar/Mesclar**.
   - Exigir confirmação dupla (dialog) ao escolher `Substituir`, descrevendo impacto.
   - Exibir resumo de quantidades que serão inseridas/atualizadas antes de confirmar.
3. CRUD incremental (já parcialmente):
   - Manter `POST /api/service-create` ao adicionar serviço.
   - Criar endpoints opcionais para editar/excluir serviço, clientes e despesas, sempre incrementais.
4. Observabilidade:
   - Melhorar retorno da API com logs de erro por item (já iniciado) e mensagem clara para UI.

## Recuperação Agora (se dados sumiram)
1. Se tiver arquivo de backup JSON, importar em **modo Adicionar/Mesclar** (após as mudanças acima).
2. Se não tiver backup, usar **Neon PITR**:
   - Criar branch no Neon “from timestamp” do dia/hora anterior.
   - Exportar dados das tabelas do branch recuperado.
   - Reimportar no principal (modo Adicionar/Mesclar) ou apontar `DATABASE_URL` para o branch recuperado.

## Critérios de Sucesso
- Importação padrão nunca apaga dados; apenas adiciona/atualiza.
- Adicionar serviço, receber/desfazer comissão continuam funcionando.
- Usuário nunca perde dados por engano.

## Próximo Passo
Com sua confirmação, implemento o modo seguro de importação, ajusto o diálogo no frontend e (se necessário) auxilio na recuperação via Neon PITR ou arquivo de backup. Posso seguir?