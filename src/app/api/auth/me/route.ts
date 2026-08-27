import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-mysql'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('[API /api/auth/me] Error:', error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
