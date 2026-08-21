import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db.js'

// Whitelist estrita — NUNCA interpolar nome de tabela dinamicamente
const ALLOWED_TABLES = ['clientes', 'servicos', 'despesas'] as const
type AllowedTable = (typeof ALLOWED_TABLES)[number]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { table, id } = req.body as { table?: string; id?: number | string }

    if (!table || !ALLOWED_TABLES.includes(table as AllowedTable)) {
      res.status(400).json({ error: `Tabela inválida. Permitidas: ${ALLOWED_TABLES.join(', ')}` })
      return
    }

    const parsedId = typeof id === 'string' ? Number(id) : id
    if (typeof parsedId !== 'number' || isNaN(parsedId) || parsedId <= 0) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    // Queries estáticas — zero interpolação de nomes de tabela
    if (table === 'clientes') {
      await sql`DELETE FROM public.clientes WHERE id = ${parsedId}`
    } else if (table === 'servicos') {
      await sql`DELETE FROM public.servicos WHERE id = ${parsedId}`
    } else if (table === 'despesas') {
      await sql`DELETE FROM public.despesas WHERE id = ${parsedId}`
    }

    res.status(200).json({ ok: true })
  } catch (e) {
    const error = e as Error
    res.status(500).json({ error: error?.message || 'Erro ao deletar registro' })
  }
}
