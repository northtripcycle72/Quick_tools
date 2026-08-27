import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-mysql'
import { getDbPool, initDb } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

// GET /api/admin/tools — List all 19 tools & their status
export async function GET() {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    await initDb()
    const db = getDbPool()

    const [tools] = await db.query<RowDataPacket[]>(
      'SELECT id, slug, name, category, description, is_active, updated_at FROM tools_config ORDER BY category ASC, name ASC'
    )

    return NextResponse.json({ tools })
  } catch (error) {
    console.error('[API GET /api/admin/tools] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tools configuration' }, { status: 500 })
  }
}

// PATCH /api/admin/tools — Toggle active / inactive tool status
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { slug, isActive } = await req.json()

    if (!slug || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Tool slug and isActive boolean are required' }, { status: 400 })
    }

    await initDb()
    const db = getDbPool()

    await db.query('UPDATE tools_config SET is_active = ? WHERE slug = ?', [isActive ? 1 : 0, slug])

    return NextResponse.json({
      message: `Tool "${slug}" is now ${isActive ? 'active' : 'inactive'}`,
      slug,
      isActive,
    })
  } catch (error) {
    console.error('[API PATCH /api/admin/tools] Error:', error)
    return NextResponse.json({ error: 'Failed to toggle tool status' }, { status: 500 })
  }
}
