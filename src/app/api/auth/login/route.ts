import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDbPool, initDb } from '@/lib/db'
import { generateToken } from '@/lib/auth-mysql'
import type { RowDataPacket } from 'mysql2'

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()

    // Initialize DB
    const dbOk = await initDb()
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database connection error. Ensure MySQL is running.' },
        { status: 500 }
      )
    }

    const db = getDbPool()

    // Query user from MySQL quick_tool_db.users table
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, full_name, email, password_hash, user_type, role, status FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    const user = rows[0]

    if (user.status === 'banned' || user.status === 'inactive') {
      return NextResponse.json(
        { error: 'Your account is disabled or banned. Please contact administrator.' },
        { status: 403 }
      )
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    const userType = typeof user.user_type === 'number' ? user.user_type : (user.role === 'admin' ? 0 : 1)
    const userRole = userType === 0 ? 'admin' : 'user'

    // Generate Token (30 days if rememberMe, else 1 day)
    const tokenExp = rememberMe ? '30d' : '1d'
    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60

    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: userType,
        role: userRole,
      },
      tokenExp
    )

    const response = NextResponse.json({
      message: 'Sign in successful!',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        user_type: userType,
        role: userRole,
      },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    })

    return response
  } catch (error: unknown) {
    console.error('[API /api/auth/login] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during sign in.' },
      { status: 500 }
    )
  }
}
