import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

type ClienteInput = {
  id?: number | string
  nome: string
  telefone?: string
  email?: string
  endereco?: string
  cpf?: string
}

type ServicoInput = {
  id?: number | string
  data_servico: string
  veiculo: string
  placa: string
  valor_bruto: number | string
  porcentagem_comissao: number | string
  observacao: string
  valor_pago: number | string
  quitado: boolean
  comissao_recebida: number | string
  cliente_id: number | string
}

type DespesaInput = {
  id?: number | string
  descricao: string
  valor: number | string
  data_vencimento: string
  pago: boolean
}

type ComissaoInput = {
  id?: number | string
  servico_id: number | string
  valor: number | string
  data_recebimento: string
  status: string
}

function parseNum(v: string | number | boolean | undefined | null): number {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

function isTemp(id: number | string | undefined): boolean {
  return typeof id === 'string' && id.startsWith('temp_')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = req.body as {
      clientes?: ClienteInput[]
      servicos?: ServicoInput[]
      despesas?: DespesaInput[]
      comissoes?: ComissaoInput[]
      mode?: 'merge' | 'replace'
    }

    // 'merge' é o padrão seguro — nunca apaga registros existentes
    // 'replace' apaga órfãos — usado apenas em reimportação explícita de backup
    const mode: 'merge' | 'replace' = body?.mode === 'replace' ? 'replace' : 'merge'

    const clientes = body?.clientes || []
    const servicos = body?.servicos || []
    const despesas = body?.despesas || []
    const comissoes = body?.comissoes || []

    const errors: { table: string; index: number; message: string }[] = []

    // ─── MODO REPLACE: apaga órfãos (somente em importação explícita de backup) ─────
    if (mode === 'replace') {
      // Ordem importa: respeitar FK clientes → servicos → comissoes
      try {
        const comissaoIds = comissoes
          .map(c => c.id)
          .filter(id => !isTemp(id))
          .map(id => (typeof id === 'string' ? Number(id) : id))
          .filter((id): id is number => typeof id === 'number' && !isNaN(id))

        if (comissaoIds.length > 0) {
          await sql`DELETE FROM public.comissoes WHERE NOT (id = ANY(${comissaoIds}))`
        } else {
          await sql`DELETE FROM public.comissoes`
        }
      } catch (e) {
        errors.push({ table: 'comissoes', index: -1, message: (e as Error)?.message || 'Erro ao deletar comissões órfãs' })
      }

      try {
        const serviceIds = servicos
          .map(s => s.id)
          .filter(id => !isTemp(id))
          .map(id => (typeof id === 'string' ? Number(id) : id))
          .filter((id): id is number => typeof id === 'number' && !isNaN(id))

        if (serviceIds.length > 0) {
          await sql`DELETE FROM public.servicos WHERE NOT (id = ANY(${serviceIds}))`
        } else {
          await sql`DELETE FROM public.servicos`
        }
      } catch (e) {
        errors.push({ table: 'servicos', index: -1, message: (e as Error)?.message || 'Erro ao deletar serviços órfãos' })
      }

      try {
        const clientIds = clientes
          .map(c => c.id)
          .filter(id => !isTemp(id))
          .map(id => (typeof id === 'string' ? Number(id) : id))
          .filter((id): id is number => typeof id === 'number' && !isNaN(id))

        if (clientIds.length > 0) {
          await sql`DELETE FROM public.clientes WHERE NOT (id = ANY(${clientIds}))`
        } else {
          await sql`DELETE FROM public.clientes`
        }
      } catch (e) {
        errors.push({ table: 'clientes', index: -1, message: (e as Error)?.message || 'Erro ao deletar clientes órfãos' })
      }

      try {
        const despesaIds = despesas
          .map(d => d.id)
          .filter(id => !isTemp(id))
          .map(id => (typeof id === 'string' ? Number(id) : id))
          .filter((id): id is number => typeof id === 'number' && !isNaN(id))

        if (despesaIds.length > 0) {
          await sql`DELETE FROM public.despesas WHERE NOT (id = ANY(${despesaIds}))`
        } else {
          await sql`DELETE FROM public.despesas`
        }
      } catch (e) {
        errors.push({ table: 'despesas', index: -1, message: (e as Error)?.message || 'Erro ao deletar despesas órfãs' })
      }
    }

    // ─── UPSERT DE CLIENTES com mapeamento de IDs temporários ─────────────────────
    // clientIdsMap: { [tempId]: realId }
    const clientIdsMap: Record<string, number> = {}

    for (let i = 0; i < clientes.length; i++) {
      const c = clientes[i]
      try {
        if (isTemp(c.id)) {
          // Novo cliente: INSERT sem ID e capturar o ID real gerado
          const rows = await sql`
            INSERT INTO public.clientes (nome, telefone, email, endereco, cpf)
            VALUES (${c.nome}, ${c.telefone || ''}, ${c.email || ''}, ${c.endereco || ''}, ${c.cpf || ''})
            RETURNING id
          ` as { id: number }[]
          if (rows[0]?.id) {
            clientIdsMap[c.id as string] = rows[0].id
          }
        } else {
          const parsedId = typeof c.id === 'string' ? Number(c.id) : c.id
          if (typeof parsedId === 'number' && !isNaN(parsedId)) {
            await sql`
              INSERT INTO public.clientes (id, nome, telefone, email, endereco, cpf)
              VALUES (${parsedId}, ${c.nome}, ${c.telefone || ''}, ${c.email || ''}, ${c.endereco || ''}, ${c.cpf || ''})
              ON CONFLICT (id) DO UPDATE SET
                nome = EXCLUDED.nome,
                telefone = EXCLUDED.telefone,
                email = EXCLUDED.email,
                endereco = EXCLUDED.endereco,
                cpf = EXCLUDED.cpf
            `
          }
        }
      } catch (e) {
        errors.push({ table: 'clientes', index: i, message: (e as Error)?.message || 'Erro ao inserir cliente' })
      }
    }

    // ─── UPSERT DE SERVIÇOS com resolução de FK temporária ────────────────────────
    const serviceIdsMap: Record<string, number> = {}

    for (let i = 0; i < servicos.length; i++) {
      const s = servicos[i]
      try {
        const valorBruto = parseNum(s.valor_bruto)
        const porcentagem = parseNum(s.porcentagem_comissao)
        const valorPago = parseNum(s.valor_pago)
        const comissaoRecebida = parseNum(s.comissao_recebida)

        // Resolver cliente_id: se temporário, buscar no mapa; se não encontrado, usar null
        let clienteId: number | null = null
        if (s.cliente_id !== null && s.cliente_id !== undefined && s.cliente_id !== '') {
          if (isTemp(s.cliente_id)) {
            const resolved = clientIdsMap[s.cliente_id as string]
            clienteId = resolved ?? null
          } else {
            const parsed = typeof s.cliente_id === 'string' ? Number(s.cliente_id) : s.cliente_id
            clienteId = typeof parsed === 'number' && !isNaN(parsed) ? parsed : null
          }
        }

        if (isTemp(s.id)) {
          // Novo serviço: INSERT sem ID e capturar o ID real
          const rows = await sql`
            INSERT INTO public.servicos (
              data_servico, veiculo, placa, valor_bruto, porcentagem_comissao,
              observacao, valor_pago, quitado, comissao_recebida, cliente_id
            ) VALUES (
              ${s.data_servico}, ${s.veiculo}, ${s.placa}, ${valorBruto}, ${porcentagem},
              ${s.observacao}, ${valorPago}, ${s.quitado}, ${comissaoRecebida}, ${clienteId}
            )
            RETURNING id
          ` as { id: number }[]
          if (rows[0]?.id) {
            serviceIdsMap[s.id as string] = rows[0].id
          }
        } else {
          const parsedId = typeof s.id === 'string' ? Number(s.id) : s.id
          if (typeof parsedId === 'number' && !isNaN(parsedId)) {
            await sql`
              INSERT INTO public.servicos (
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
                cliente_id = EXCLUDED.cliente_id
            `
          }
        }
      } catch (e) {
        errors.push({ table: 'servicos', index: i, message: (e as Error)?.message || 'Erro ao inserir serviço' })
      }
    }

    // ─── UPSERT DE DESPESAS ────────────────────────────────────────────────────────
    for (let i = 0; i < despesas.length; i++) {
      const d = despesas[i]
      try {
        const parsedValor = parseNum(d.valor)

        if (isTemp(d.id)) {
          await sql`
            INSERT INTO public.despesas (descricao, valor, data_vencimento, pago)
            VALUES (${d.descricao}, ${parsedValor}, ${d.data_vencimento}, ${d.pago})
          `
        } else {
          const parsedId = typeof d.id === 'string' ? Number(d.id) : d.id
          if (typeof parsedId === 'number' && !isNaN(parsedId)) {
            await sql`
              INSERT INTO public.despesas (id, descricao, valor, data_vencimento, pago)
              VALUES (${parsedId}, ${d.descricao}, ${parsedValor}, ${d.data_vencimento}, ${d.pago})
              ON CONFLICT (id) DO UPDATE SET
                descricao = EXCLUDED.descricao,
                valor = EXCLUDED.valor,
                data_vencimento = EXCLUDED.data_vencimento,
                pago = EXCLUDED.pago
            `
          }
        }
      } catch (e) {
        errors.push({ table: 'despesas', index: i, message: (e as Error)?.message || 'Erro ao inserir despesa' })
      }
    }

    // ─── UPSERT DE COMISSÕES com resolução de servico_id temporário ───────────────
    for (let i = 0; i < comissoes.length; i++) {
      const c = comissoes[i]
      try {
        const parsedValor = parseNum(c.valor)

        let servicoId: number | null = null
        if (isTemp(c.servico_id)) {
          servicoId = serviceIdsMap[c.servico_id as string] ?? null
        } else {
          const parsed = typeof c.servico_id === 'string' ? Number(c.servico_id) : c.servico_id
          servicoId = typeof parsed === 'number' && !isNaN(parsed) ? parsed : null
        }

        if (servicoId === null) {
          errors.push({ table: 'comissoes', index: i, message: 'servico_id não resolvido' })
          continue
        }

        if (isTemp(c.id)) {
          await sql`
            INSERT INTO public.comissoes (servico_id, valor, data_recebimento, status)
            VALUES (${servicoId}, ${parsedValor}, ${c.data_recebimento}, ${c.status})
          `
        } else {
          const parsedId = typeof c.id === 'string' ? Number(c.id) : c.id
          if (typeof parsedId === 'number' && !isNaN(parsedId)) {
            await sql`
              INSERT INTO public.comissoes (id, servico_id, valor, data_recebimento, status)
              VALUES (${parsedId}, ${servicoId}, ${parsedValor}, ${c.data_recebimento}, ${c.status})
              ON CONFLICT (id) DO UPDATE SET
                servico_id = EXCLUDED.servico_id,
                valor = EXCLUDED.valor,
                data_recebimento = EXCLUDED.data_recebimento,
                status = EXCLUDED.status
            `
          }
        }
      } catch (e) {
        errors.push({ table: 'comissoes', index: i, message: (e as Error)?.message || 'Erro ao inserir comissão' })
      }
    }

    // ─── Resetar sequências ────────────────────────────────────────────────────────
    await sql`SELECT setval(pg_get_serial_sequence('public.clientes','id'), COALESCE((SELECT MAX(id) FROM public.clientes), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.servicos','id'), COALESCE((SELECT MAX(id) FROM public.servicos), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.despesas','id'), COALESCE((SELECT MAX(id) FROM public.despesas), 1))`
    await sql`SELECT setval(pg_get_serial_sequence('public.comissoes','id'), COALESCE((SELECT MAX(id) FROM public.comissoes), 1))`

    res.status(200).json({
      ok: errors.length === 0,
      errors,
      clientIdsMap,
      serviceIdsMap
    })
  } catch (e) {
    const error = e as Error
    res.status(500).json({ error: error?.message || 'Erro ao importar dados' })
  }
}
