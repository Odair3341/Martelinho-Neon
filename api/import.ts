import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    type Body = {
      clientes?: { id?: number; nome: string }[]
      servicos?: { id?: number; data_servico: string; veiculo: string; placa: string; valor_bruto: number | string; porcentagem_comissao: number | string; observacao: string; valor_pago: number | string; quitado: boolean; comissao_recebida: number | string; cliente_id: number | string }[]
      despesas?: { id?: number; descricao: string; valor: number | string; data_vencimento: string; pago: boolean }[]
      comissoes?: { id?: number; servico_id: number | string; valor: number | string; data_recebimento: string; status: string }[]
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
      if (typeof c.id === 'number') {
        await sql`INSERT INTO public.clientes (id, nome) VALUES (${c.id}, ${c.nome})`
      } else {
        await sql`INSERT INTO public.clientes (nome) VALUES (${c.nome})`
      }
    }

    for (const s of servicos) {
      const valorBruto = typeof s.valor_bruto === 'string' ? Number(s.valor_bruto) : s.valor_bruto
      const porcentagem = typeof s.porcentagem_comissao === 'string' ? Number(s.porcentagem_comissao) : s.porcentagem_comissao
      const valorPago = typeof s.valor_pago === 'string' ? Number(s.valor_pago) : s.valor_pago
      const comissaoRecebida = typeof s.comissao_recebida === 'string' ? Number(s.comissao_recebida) : s.comissao_recebida
      const clienteId = typeof s.cliente_id === 'string' ? Number(s.cliente_id) : s.cliente_id

      if (typeof s.id === 'number') {
        await sql`INSERT INTO public.servicos (id, data_servico, veiculo, placa, valor_bruto, porcentagem_comissao, observacao, valor_pago, quitado, comissao_recebida, cliente_id) VALUES (${s.id}, ${s.data_servico}, ${s.veiculo}, ${s.placa}, ${valorBruto}, ${porcentagem}, ${s.observacao}, ${valorPago}, ${s.quitado}, ${comissaoRecebida}, ${clienteId})`
      } else {
        await sql`INSERT INTO public.servicos (data_servico, veiculo, placa, valor_bruto, porcentagem_comissao, observacao, valor_pago, quitado, comissao_recebida, cliente_id) VALUES (${s.data_servico}, ${s.veiculo}, ${s.placa}, ${valorBruto}, ${porcentagem}, ${s.observacao}, ${valorPago}, ${s.quitado}, ${comissaoRecebida}, ${clienteId})`
      }
    }

    for (const d of despesas) {
      const valor = typeof d.valor === 'string' ? Number(d.valor) : d.valor
      if (typeof d.id === 'number') {
        await sql`INSERT INTO public.despesas (id, descricao, valor, data_vencimento, pago) VALUES (${d.id}, ${d.descricao}, ${valor}, ${d.data_vencimento}, ${d.pago})`
      } else {
        await sql`INSERT INTO public.despesas (descricao, valor, data_vencimento, pago) VALUES (${d.descricao}, ${valor}, ${d.data_vencimento}, ${d.pago})`
      }
    }

    for (const c of comissoes) {
      const valor = typeof c.valor === 'string' ? Number(c.valor) : c.valor
      const servicoId = typeof c.servico_id === 'string' ? Number(c.servico_id) : c.servico_id
      if (typeof c.id === 'number') {
        await sql`INSERT INTO public.comissoes (id, servico_id, valor, data_recebimento, status) VALUES (${c.id}, ${servicoId}, ${valor}, ${c.data_recebimento}, ${c.status})`
      } else {
        await sql`INSERT INTO public.comissoes (servico_id, valor, data_recebimento, status) VALUES (${servicoId}, ${valor}, ${c.data_recebimento}, ${c.status})`
      }
    }

    await sql`SELECT setval(pg_get_serial_sequence('public.clientes','id'), COALESCE((SELECT MAX(id) FROM public.clientes), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.servicos','id'), COALESCE((SELECT MAX(id) FROM public.servicos), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.despesas','id'), COALESCE((SELECT MAX(id) FROM public.despesas), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.comissoes','id'), COALESCE((SELECT MAX(id) FROM public.comissoes), 1))`

    res.status(200).json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Erro ao importar dados' })
  }
}