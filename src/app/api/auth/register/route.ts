import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDbPool, initDb } from '@/lib/db'
import { generateToken } from '@/lib/auth-mysql'
import type { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password } = await req.json()

    // Validation
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Full name, email, and password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = fullName.trim()

    // Initialize database `quick_tool_db`
    const dbOk = await initDb()
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Database connection failed. Please check MySQL service.' },
        { status: 500 }
      )
    }

    const db = getDbPool()

    // Check if email already exists
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [cleanEmail]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Insert user into quick_tool_db.users table with user_type = 1 (Regular User)
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO users (full_name, email, password_hash, user_type, role) VALUES (?, ?, ?, 1, "user")',
      [cleanName, cleanEmail, passwordHash]
    )

    const userId = result.insertId

    // Generate JWT Token
    const token = generateToken({
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      user_type: 1,
      role: 'user',
    })

    // Create Response with HttpOnly Cookie
    const response = NextResponse.json(
      {
        message: 'Account registered successfully!',
        user: {
          id: userId,
          full_name: cleanName,
          email: cleanEmail,
        },
      },
      { status: 201 }
    )

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: unknown) {
    console.error('[API /api/auth/register] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during registration.' },
      { status: 500 }
    )
  }
}
