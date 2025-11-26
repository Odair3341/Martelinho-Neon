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

    const errors: { table: string; index: number; message: string }[] = []

    for (let i = 0; i < clientes.length; i++) {
      const c = clientes[i]
      try {
        if (typeof c.id === 'number') {
          await sql`INSERT INTO public.clientes (id, nome)
                    VALUES (${c.id}, ${c.nome})
                    ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome`
        } else {
          await sql`INSERT INTO public.clientes (nome) VALUES (${c.nome})`
        }
      } catch (e: any) {
        errors.push({ table: 'clientes', index: i, message: e?.message || 'Erro ao inserir cliente' })
      }
    }

    for (let i = 0; i < servicos.length; i++) {
      const s = servicos[i]
      try {
        const valorBruto = typeof s.valor_bruto === 'string' ? Number(s.valor_bruto) : s.valor_bruto
        const porcentagem = typeof s.porcentagem_comissao === 'string' ? Number(s.porcentagem_comissao) : s.porcentagem_comissao
        const valorPago = typeof s.valor_pago === 'string' ? Number(s.valor_pago) : s.valor_pago
        const comissaoRecebida = typeof s.comissao_recebida === 'string' ? Number(s.comissao_recebida) : s.comissao_recebida
        const clienteId = typeof s.cliente_id === 'string' ? Number(s.cliente_id) : s.cliente_id

        if (typeof s.id === 'number') {
          await sql`INSERT INTO public.servicos (
                      id, data_servico, veiculo, placa, valor_bruto, porcentagem_comissao,
                      observacao, valor_pago, quitado, comissao_recebida, cliente_id
                    ) VALUES (
                      ${s.id}, ${s.data_servico}, ${s.veiculo}, ${s.placa}, ${valorBruto}, ${porcentagem},
                      ${s.observacao}, ${valorPago}, ${s.quitado}, ${comissaoRecebida}, ${clienteId}
                    )
                    ON CONFLICT (id) DO UPDATE SET
                      data_servico = EXCLUDED.data_servico,
                      veiculo = EXCLUDED.veiculo,
                      placa = EXCLUDED.placa,
                      valor_bruto = EXCLUDED.valor_bruto,
                      porcentagem_comissao = EXCLUDED.porcentagem_comissao,
                      observacao = EXCLUDED.observacao,
                      valor_pago = EXCLUDED.valor_pago,
                      quitado = EXCLUDED.quitado,
                      comissao_recebida = EXCLUDED.comissao_recebida,
                      cliente_id = EXCLUDED.cliente_id`
        } else {
          await sql`INSERT INTO public.servicos (
                      data_servico, veiculo, placa, valor_bruto, porcentagem_comissao,
                      observacao, valor_pago, quitado, comissao_recebida, cliente_id
                    ) VALUES (
                      ${s.data_servico}, ${s.veiculo}, ${s.placa}, ${valorBruto}, ${porcentagem},
                      ${s.observacao}, ${valorPago}, ${s.quitado}, ${comissaoRecebida}, ${clienteId}
                    )`
        }
      } catch (e: any) {
        errors.push({ table: 'servicos', index: i, message: e?.message || 'Erro ao inserir serviço' })
      }
    }

    for (let i = 0; i < despesas.length; i++) {
      const d = despesas[i]
      try {
        const valor = typeof d.valor === 'string' ? Number(d.valor) : d.valor
        if (typeof d.id === 'number') {
          await sql`INSERT INTO public.despesas (id, descricao, valor, data_vencimento, pago)
                    VALUES (${d.id}, ${d.descricao}, ${valor}, ${d.data_vencimento}, ${d.pago})
                    ON CONFLICT (id) DO UPDATE SET
                      descricao = EXCLUDED.descricao,
                      valor = EXCLUDED.valor,
                      data_vencimento = EXCLUDED.data_vencimento,
                      pago = EXCLUDED.pago`
        } else {
          await sql`INSERT INTO public.despesas (descricao, valor, data_vencimento, pago)
                    VALUES (${d.descricao}, ${valor}, ${d.data_vencimento}, ${d.pago})`
        }
      } catch (e: any) {
        errors.push({ table: 'despesas', index: i, message: e?.message || 'Erro ao inserir despesa' })
      }
    }

    for (let i = 0; i < comissoes.length; i++) {
      const c = comissoes[i]
      try {
        const valor = typeof c.valor === 'string' ? Number(c.valor) : c.valor
        const servicoId = typeof c.servico_id === 'string' ? Number(c.servico_id) : c.servico_id
        if (typeof c.id === 'number') {
          await sql`INSERT INTO public.comissoes (id, servico_id, valor, data_recebimento, status)
                    VALUES (${c.id}, ${servicoId}, ${valor}, ${c.data_recebimento}, ${c.status})
                    ON CONFLICT (id) DO UPDATE SET
                      servico_id = EXCLUDED.servico_id,
                      valor = EXCLUDED.valor,
                      data_recebimento = EXCLUDED.data_recebimento,
                      status = EXCLUDED.status`
        } else {
          await sql`INSERT INTO public.comissoes (servico_id, valor, data_recebimento, status)
                    VALUES (${servicoId}, ${valor}, ${c.data_recebimento}, ${c.status})`
        }
      } catch (e: any) {
        errors.push({ table: 'comissoes', index: i, message: e?.message || 'Erro ao inserir comissão' })
      }
    }

    await sql`SELECT setval(pg_get_serial_sequence('public.clientes','id'), COALESCE((SELECT MAX(id) FROM public.clientes), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.servicos','id'), COALESCE((SELECT MAX(id) FROM public.servicos), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.despesas','id'), COALESCE((SELECT MAX(id) FROM public.despesas), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.comissoes','id'), COALESCE((SELECT MAX(id) FROM public.comissoes), 1))`

    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors })
      return
    }

    res.status(200).json({ ok: true })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Erro ao importar dados' })
  }
}