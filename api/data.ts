import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const clientes = await sql`SELECT id, nome, created_at FROM public.clientes ORDER BY nome`
    const servicos = await sql`SELECT id, data_servico, veiculo, placa, valor_bruto, porcentagem_comissao, observacao, valor_pago, quitado, comissao_recebida, cliente_id FROM public.servicos ORDER BY data_servico DESC`
    const despesas = await sql`SELECT id, descricao, valor, data_vencimento, pago FROM public.despesas ORDER BY data_vencimento DESC`
    const comissoes = await sql`SELECT id, servico_id, valor, data_recebimento, status, created_at, updated_at FROM public.comissoes ORDER BY data_recebimento DESC`

    res.status(200).json({ clientes, servicos, despesas, comissoes })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Erro ao carregar dados' })
  }
}