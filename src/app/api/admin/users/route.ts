import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-mysql'
import { getDbPool, initDb } from '@/lib/db'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

// GET /api/admin/users — List all users with search
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')?.trim() || ''

    await initDb()
    const db = getDbPool()

    let sql = 'SELECT id, full_name, email, user_type, role, status, created_at, updated_at FROM users'
    const params: (string | number)[] = []

    if (query) {
      sql += ' WHERE full_name LIKE ? OR email LIKE ?'
      params.push(`%${query}%`, `%${query}%`)
    }

    sql += ' ORDER BY id DESC LIMIT 100'

    const [users] = await db.query<RowDataPacket[]>(sql, params)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('[API GET /api/admin/users] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// PATCH /api/admin/users — Update user role or status
export async function PATCH(req: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { userId, role, userType, status } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Determine target user_type and role
    const targetType = typeof userType === 'number' ? userType : (role === 'admin' ? 0 : (role === 'user' ? 1 : undefined))
    const targetRole = targetType === 0 ? 'admin' : (targetType === 1 ? 'user' : role)

    // Prevent demoting self if admin is performing operation on own ID
    if (userId === admin.id && targetType === 1) {
      return NextResponse.json({ error: 'You cannot demote your own admin account.' }, { status: 400 })
    }

    await initDb()
    const db = getDbPool()

    const updates: string[] = []
    const params: (string | number)[] = []

    if (typeof targetType === 'number') {
      updates.push('user_type = ?', 'role = ?')
      params.push(targetType, targetRole)
    }

    if (status && ['active', 'inactive', 'banned'].includes(status)) {
      updates.push('status = ?')
      params.push(status)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    params.push(userId)
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)

    return NextResponse.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('[API PATCH /api/admin/users] Error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/users — Remove user
export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentUser()
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (parseInt(userId, 10) === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 })
    }

    await initDb()
    const db = getDbPool()

    await db.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [userId])

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('[API DELETE /api/admin/users] Error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
