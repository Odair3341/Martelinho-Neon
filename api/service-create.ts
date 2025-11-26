import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    type Body = {
      data_servico: string
      veiculo: string
      placa: string
      valor_bruto: number | string
      porcentagem_comissao: number | string
      observacao?: string
      cliente_id: number | string
    }

    const body = req.body as Body
    if (!body || !body.data_servico || !body.veiculo || !body.placa || body.valor_bruto == null || body.porcentagem_comissao == null || !body.cliente_id) {
      res.status(400).json({ error: 'Missing required fields' })
      return
    }

    const valorBruto = typeof body.valor_bruto === 'string' ? Number(body.valor_bruto) : body.valor_bruto
    const porcentagem = typeof body.porcentagem_comissao === 'string' ? Number(body.porcentagem_comissao) : body.porcentagem_comissao
    const clienteId = typeof body.cliente_id === 'string' ? Number(body.cliente_id) : body.cliente_id

    const rows = await sql`
      INSERT INTO public.servicos (
        data_servico, veiculo, placa, valor_bruto, porcentagem_comissao, observacao,
        valor_pago, quitado, comissao_recebida, cliente_id
      ) VALUES (
        ${body.data_servico}, ${body.veiculo}, ${body.placa}, ${valorBruto}, ${porcentagem}, ${body.observacao || ''},
        ${0}, ${false}, ${0}, ${clienteId}
      ) RETURNING id` as { id: number }[]

    const insertedId = rows[0]?.id
    res.status(200).json({ ok: true, id: insertedId })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Erro ao criar serviço' })
  }
}