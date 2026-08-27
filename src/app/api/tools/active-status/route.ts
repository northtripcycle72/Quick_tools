import { NextResponse } from 'next/server'
import { getDbPool, initDb } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const dbOk = await initDb()
    if (!dbOk) {
      return NextResponse.json({ activeMap: {} }, { status: 500 })
    }

    const db = getDbPool()
    const [rows] = await db.query<RowDataPacket[]>('SELECT slug, is_active FROM tools_config')

    const activeMap: Record<string, boolean> = {}
    rows.forEach((r) => {
      activeMap[r.slug] = r.is_active === 1
    })

    return NextResponse.json({ activeMap }, { status: 200 })
  } catch (error) {
    console.error('[API /api/tools/active-status] Error:', error)
    return NextResponse.json({ activeMap: {} }, { status: 500 })
  }
}
