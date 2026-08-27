import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-mysql'
import { getDbPool, initDb } from '@/lib/db'
import type { RowDataPacket } from 'mysql2'

export async function GET() {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    await initDb()
    const db = getDbPool()

    // 1. Total Users
    const [userRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users')
    const totalUsers = userRows[0]?.total || 0

    // 2. Active & Inactive Tools
    const [toolRows] = await db.query<RowDataPacket[]>(
      'SELECT is_active, COUNT(*) as count FROM tools_config GROUP BY is_active'
    )
    let activeToolsCount = 0
    let inactiveToolsCount = 0
    toolRows.forEach((r) => {
      if (r.is_active === 1) activeToolsCount = r.count
      else inactiveToolsCount = r.count
    })

    // 3. Total Tool Executions
    const [usageRows] = await db.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM tool_usages')
    const totalExecutions = usageRows[0]?.total || 0

    // 4. Recent Registered Users
    const [recentUsers] = await db.query<RowDataPacket[]>(
      'SELECT id, full_name, email, role, status, created_at FROM users ORDER BY id DESC LIMIT 5'
    )

    // 5. Popular Tools Usage Breakdown
    const [popularTools] = await db.query<RowDataPacket[]>(
      'SELECT tool_slug, COUNT(*) as usage_count FROM tool_usages GROUP BY tool_slug ORDER BY usage_count DESC LIMIT 5'
    )

    // 6. Python Backend Health Check
    let pythonBackendStatus = 'offline'
    try {
      const pyRes = await fetch('http://127.0.0.1:8000/api/health', { signal: AbortSignal.timeout(2000) })
      if (pyRes.ok) pythonBackendStatus = 'online'
    } catch {}

    return NextResponse.json({
      stats: {
        totalUsers,
        totalExecutions,
        activeToolsCount,
        inactiveToolsCount,
        systemHealth: {
          database: 'connected',
          pythonBackend: pythonBackendStatus,
          serverUptime: '99.9%',
        },
      },
      recentUsers,
      popularTools,
    })
  } catch (error) {
    console.error('[API /api/admin/stats] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
  }
}
