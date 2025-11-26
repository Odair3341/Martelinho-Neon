import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hasEnv = !!process.env.DATABASE_URL
  if (!hasEnv) {
    res.status(200).json({ ok: false, hasEnv: false, error: 'Missing DATABASE_URL' })
    return
  }

  try {
    const { sql } = await import('./_db.js')
    const rows = await sql`SELECT 1 AS ok` as { ok: number }[]
    res.status(200).json({ ok: true, hasEnv: true, result: rows[0]?.ok === 1 })
  } catch (e: any) {
    res.status(500).json({ ok: false, hasEnv: true, error: e?.message || 'Health check failed' })
  }
}