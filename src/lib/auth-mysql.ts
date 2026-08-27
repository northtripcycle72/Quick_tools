import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getDbPool, initDb } from './db'
import type { RowDataPacket } from 'mysql2'

const JWT_SECRET = process.env.JWT_SECRET || 'quick_tools_mysql_secret_key_2026_super_secure'

export interface MySqlUser {
  id: number
  email: string
  full_name: string
  user_type: number // 0: Admin, 1: Regular User
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'banned'
  created_at: string
}

export function generateToken(user: { id: number; email: string; full_name: string; user_type?: number; role?: string }, expiresIn = '7d'): string {
  const userType = typeof user.user_type === 'number' ? user.user_type : (user.role === 'admin' ? 0 : 1)
  const role = userType === 0 ? 'admin' : 'user'

  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      userType,
      role,
    },
    JWT_SECRET,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  )
}

export function verifyToken(token: string): { userId: number; email: string; fullName: string; userType?: number; role?: 'admin' | 'user' } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; fullName: string; userType?: number; role?: 'admin' | 'user' }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<MySqlUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded) return null

    await initDb()
    const db = getDbPool()
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, full_name, email, user_type, role, status, created_at FROM users WHERE id = ? LIMIT 1',
      [decoded.userId]
    )

    if (rows.length === 0) return null

    const row = rows[0]
    if (row.status === 'banned' || row.status === 'inactive') {
      return null
    }

    const userType = typeof row.user_type === 'number' ? row.user_type : (row.role === 'admin' ? 0 : 1)
    const role: 'admin' | 'user' = userType === 0 ? 'admin' : 'user'

    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      user_type: userType,
      role,
      status: row.status || 'active',
      created_at: row.created_at,
    }
  } catch (err) {
    console.error('[MySQL Auth Error] getCurrentUser failed:', err)
    return null
  }
}

export async function requireAuthApi(req: Request): Promise<MySqlUser | null> {
  const user = await getCurrentUser()
  if (user) return user

  // Check Bearer Token Header
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (payload) {
      const userType = typeof payload.userType === 'number' ? payload.userType : (payload.role === 'admin' ? 0 : 1)
      const role: 'admin' | 'user' = userType === 0 ? 'admin' : 'user'
      return {
        id: payload.userId,
        email: payload.email,
        full_name: payload.fullName,
        user_type: userType,
        role,
        status: 'active',
        created_at: new Date().toISOString(),
      }
    }
  }

  return null
}
