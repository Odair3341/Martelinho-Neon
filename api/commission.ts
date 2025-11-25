import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    type Body = { servicoId?: number; amount?: number; date?: string }
    const { servicoId, amount, date } = (req.body || {}) as Body
    if (!servicoId || !amount) {
      res.status(400).json({ error: 'Missing servicoId or amount' })
      return
    }

    const dataRecebimento = date || new Date().toISOString().slice(0, 10)

    await sql.begin(async (trx) => {
      await trx`INSERT INTO public.comissoes (servico_id, valor, data_recebimento, status) VALUES (${servicoId}, ${amount}, ${dataRecebimento}, ${'recebido'})`
      await trx`UPDATE public.servicos SET comissao_recebida = COALESCE(comissao_recebida, 0) + ${amount} WHERE id = ${servicoId}`
    })

    res.status(200).json({ ok: true, data_recebimento: dataRecebimento })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Erro ao receber comissão' })
  }
}