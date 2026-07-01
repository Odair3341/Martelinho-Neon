import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    type Body = {
      clientes?: { id?: number | string; nome: string; telefone?: string; email?: string; endereco?: string; cpf?: string }[]
      servicos?: { id?: number | string; data_servico: string; veiculo: string; placa: string; valor_bruto: number | string; porcentagem_comissao: number | string; observacao: string; valor_pago: number | string; quitado: boolean; comissao_recebida: number | string; cliente_id: number | string }[]
      despesas?: { id?: number | string; descricao: string; valor: number | string; data_vencimento: string; pago: boolean }[]
      comissoes?: { id?: number | string; servico_id: number | string; valor: number | string; data_recebimento: string; status: string }[]
    }
    const body = req.body as Body
    const clientes = body?.clientes || []
    const servicos = body?.servicos || []
    const despesas = body?.despesas || []
    const comissoes = body?.comissoes || []

    const errors: { table: string; index: number; message: string }[] = []

    // 1. Delete orphan records from comissoes
    try {
      const comissaoIds = comissoes.map(c => c.id).map(id => typeof id === 'string' ? Number(id) : id).filter((id): id is number => typeof id === 'number' && !isNaN(id))
      if (comissaoIds.length > 0) {
        await sql`DELETE FROM public.comissoes WHERE NOT (id = ANY(${comissaoIds}))`
      } else {
        await sql`DELETE FROM public.comissoes`
      }
    } catch (e) {
      const error = e as Error
      errors.push({ table: 'comissoes', index: -1, message: error?.message || 'Erro ao deletar comissões órfãs' })
    }

    // 2. Delete orphan records from servicos
    try {
      const serviceIds = servicos.map(s => s.id).map(id => typeof id === 'string' ? Number(id) : id).filter((id): id is number => typeof id === 'number' && !isNaN(id))
      if (serviceIds.length > 0) {
        await sql`DELETE FROM public.servicos WHERE NOT (id = ANY(${serviceIds}))`
      } else {
        await sql`DELETE FROM public.servicos`
      }
    } catch (e) {
      const error = e as Error
      errors.push({ table: 'servicos', index: -1, message: error?.message || 'Erro ao deletar serviços órfãos' })
    }

    // 3. Delete orphan records from clientes
    try {
      const clientIds = clientes.map(c => c.id).map(id => typeof id === 'string' ? Number(id) : id).filter((id): id is number => typeof id === 'number' && !isNaN(id))
      if (clientIds.length > 0) {
        await sql`DELETE FROM public.clientes WHERE NOT (id = ANY(${clientIds}))`
      } else {
        await sql`DELETE FROM public.clientes`
      }
    } catch (e) {
      const error = e as Error
      errors.push({ table: 'clientes', index: -1, message: error?.message || 'Erro ao deletar clientes órfãos' })
    }

    // 4. Delete orphan records from despesas
    try {
      const despesaIds = despesas.map(d => d.id).map(id => typeof id === 'string' ? Number(id) : id).filter((id): id is number => typeof id === 'number' && !isNaN(id))
      if (despesaIds.length > 0) {
        await sql`DELETE FROM public.despesas WHERE NOT (id = ANY(${despesaIds}))`
      } else {
        await sql`DELETE FROM public.despesas`
      }
    } catch (e) {
      const error = e as Error
      errors.push({ table: 'despesas', index: -1, message: error?.message || 'Erro ao deletar despesas órfãs' })
    }

    // Now proceed with upserting the data
    for (let i = 0; i < clientes.length; i++) {
      const c = clientes[i]
      try {
        const parsedId = typeof c.id === 'string' ? Number(c.id) : c.id
        if (typeof parsedId === 'number' && !isNaN(parsedId)) {
          await sql`INSERT INTO public.clientes (id, nome, telefone, email, endereco, cpf)
                    VALUES (${parsedId}, ${c.nome}, ${c.telefone || ''}, ${c.email || ''}, ${c.endereco || ''}, ${c.cpf || ''})
                    ON CONFLICT (id) DO UPDATE SET 
                      nome = EXCLUDED.nome,
                      telefone = EXCLUDED.telefone,
                      email = EXCLUDED.email,
                      endereco = EXCLUDED.endereco,
                      cpf = EXCLUDED.cpf`
        } else {
          await sql`INSERT INTO public.clientes (nome, telefone, email, endereco, cpf) 
                    VALUES (${c.nome}, ${c.telefone || ''}, ${c.email || ''}, ${c.endereco || ''}, ${c.cpf || ''})`
        }
      } catch (e) {
        const error = e as Error
        errors.push({ table: 'clientes', index: i, message: error?.message || 'Erro ao inserir cliente' })
      }
    }

    for (let i = 0; i < servicos.length; i++) {
      const s = servicos[i]
      try {
        const parseNumber = (v: string | number | boolean | undefined | null) => {
          const n = typeof v === 'string' ? Number(v) : v
          return typeof n === 'number' && Number.isFinite(n) ? n : 0
        }
        const valorBruto = parseNumber(s.valor_bruto)
        const porcentagem = parseNumber(s.porcentagem_comissao)
        const valorPago = parseNumber(s.valor_pago)
        const comissaoRecebida = parseNumber(s.comissao_recebida)
        const clienteId = typeof s.cliente_id === 'string' ? Number(s.cliente_id) : s.cliente_id
        const parsedId = typeof s.id === 'string' ? Number(s.id) : s.id

        if (typeof parsedId === 'number' && !isNaN(parsedId)) {
          await sql`INSERT INTO public.servicos (
                      id, data_servico, veiculo, placa, valor_bruto, porcentagem_comissao,
                      observacao, valor_pago, quitado, comissao_recebida, cliente_id
                    ) VALUES (
                      ${parsedId}, ${s.data_servico}, ${s.veiculo}, ${s.placa}, ${valorBruto}, ${porcentagem},
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
      } catch (e) {
        const error = e as Error
        errors.push({ table: 'servicos', index: i, message: error?.message || 'Erro ao inserir serviço' })
      }
    }

    for (let i = 0; i < despesas.length; i++) {
      const d = despesas[i]
      try {
        const valor = typeof d.valor === 'string' ? Number(d.valor) : d.valor
        const parsedValor = typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
        const parsedId = typeof d.id === 'string' ? Number(d.id) : d.id
        if (typeof parsedId === 'number' && !isNaN(parsedId)) {
          await sql`INSERT INTO public.despesas (id, descricao, valor, data_vencimento, pago)
                    VALUES (${parsedId}, ${d.descricao}, ${parsedValor}, ${d.data_vencimento}, ${d.pago})
                    ON CONFLICT (id) DO UPDATE SET
                      descricao = EXCLUDED.descricao,
                      valor = EXCLUDED.valor,
                      data_vencimento = EXCLUDED.data_vencimento,
                      pago = EXCLUDED.pago`
        } else {
          await sql`INSERT INTO public.despesas (descricao, valor, data_vencimento, pago)
                    VALUES (${d.descricao}, ${parsedValor}, ${d.data_vencimento}, ${d.pago})`
        }
      } catch (e) {
        const error = e as Error
        errors.push({ table: 'despesas', index: i, message: error?.message || 'Erro ao inserir despesa' })
      }
    }

    for (let i = 0; i < comissoes.length; i++) {
      const c = comissoes[i]
      try {
        const valor = typeof c.valor === 'string' ? Number(c.valor) : c.valor
        const parsedValor = typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
        const servicoId = typeof c.servico_id === 'string' ? Number(c.servico_id) : c.servico_id
        const parsedId = typeof c.id === 'string' ? Number(c.id) : c.id
        if (typeof parsedId === 'number' && !isNaN(parsedId)) {
          await sql`INSERT INTO public.comissoes (id, servico_id, valor, data_recebimento, status)
                    VALUES (${parsedId}, ${servicoId}, ${parsedValor}, ${c.data_recebimento}, ${c.status})
                    ON CONFLICT (id) DO UPDATE SET
                      servico_id = EXCLUDED.servico_id,
                      valor = EXCLUDED.valor,
                      data_recebimento = EXCLUDED.data_recebimento,
                      status = EXCLUDED.status`
        } else {
          await sql`INSERT INTO public.comissoes (servico_id, valor, data_recebimento, status)
                    VALUES (${servicoId}, ${parsedValor}, ${c.data_recebimento}, ${c.status})`
        }
      } catch (e) {
        const error = e as Error
        errors.push({ table: 'comissoes', index: i, message: error?.message || 'Erro ao inserir comissão' })
      }
    }

    await sql`SELECT setval(pg_get_serial_sequence('public.clientes','id'), COALESCE((SELECT MAX(id) FROM public.clientes), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.servicos','id'), COALESCE((SELECT MAX(id) FROM public.servicos), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.despesas','id'), COALESCE((SELECT MAX(id) FROM public.despesas), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.comissoes','id'), COALESCE((SELECT MAX(id) FROM public.comissoes), 1))`

    res.status(200).json({ ok: errors.length === 0, errors })
  } catch (e) {
    const error = e as Error
    res.status(500).json({ error: error?.message || 'Erro ao importar dados' })
  }
}