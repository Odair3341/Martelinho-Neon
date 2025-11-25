import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    type Body = {
      clientes?: { nome: string }[]
      servicos?: { data_servico: string; veiculo: string; placa: string; valor_bruto: number; porcentagem_comissao: number; observacao: string; valor_pago: number; quitado: boolean; comissao_recebida: number; cliente_id: number | string }[]
      despesas?: { descricao: string; valor: number; data_vencimento: string; pago: boolean }[]
      comissoes?: { servico_id: number; valor: number; data_recebimento: string; status: string }[]
    }
    const body = req.body as Body
    const clientes = body?.clientes || []
    const servicos = body?.servicos || []
    const despesas = body?.despesas || []
    const comissoes = body?.comissoes || []

    await sql`DELETE FROM public.comissoes`
    await sql`DELETE FROM public.servicos`
    await sql`DELETE FROM public.despesas`
    await sql`DELETE FROM public.clientes`

    for (const c of clientes) {
      await sql`INSERT INTO public.clientes (nome) VALUES (${c.nome})`
    }

    for (const s of servicos) {
      await sql`INSERT INTO public.servicos (data_servico, veiculo, placa, valor_bruto, porcentagem_comissao, observacao, valor_pago, quitado, comissao_recebida, cliente_id) VALUES (${s.data_servico}, ${s.veiculo}, ${s.placa}, ${s.valor_bruto}, ${s.porcentagem_comissao}, ${s.observacao}, ${s.valor_pago}, ${s.quitado}, ${s.comissao_recebida}, ${typeof s.cliente_id === 'string' ? Number(s.cliente_id) : s.cliente_id})`
    }

    for (const d of despesas) {
      await sql`INSERT INTO public.despesas (descricao, valor, data_vencimento, pago) VALUES (${d.descricao}, ${d.valor}, ${d.data_vencimento}, ${d.pago})`
    }

    for (const c of comissoes) {
      await sql`INSERT INTO public.comissoes (servico_id, valor, data_recebimento, status) VALUES (${c.servico_id}, ${c.valor}, ${c.data_recebimento}, ${c.status})`
    }

    res.status(200).json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Erro ao importar dados' })
  }
}