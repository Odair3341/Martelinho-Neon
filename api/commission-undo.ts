import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    type Body = { servicoId?: number }
    const { servicoId } = (req.body || {}) as Body
    if (!servicoId) {
      res.status(400).json({ error: 'Missing servicoId' })
      return
    }

    await sql.begin(async (trx) => {
      await trx`DELETE FROM public.comissoes WHERE servico_id = ${servicoId} AND status = ${'recebido'}`
      await trx`UPDATE public.servicos SET comissao_recebida = 0 WHERE id = ${servicoId}`
    })

    res.status(200).json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Erro ao desfazer comissão' })
  }
}