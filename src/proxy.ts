import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyToken } from '@/lib/auth-mysql'

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Routes that require an authenticated session.
 * Any path STARTING WITH these prefixes requires the user to be logged in.
 * Gate all /tools and /dashboard pages behind login.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/tools',
  '/admin',
]

/**
 * Routes that authenticated users should NOT be able to visit.
 * Visiting /auth while logged in will bounce them home.
 */
const AUTH_ROUTES = ['/auth']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route))
}

// ─────────────────────────────────────────────────────────────────────────────
// PROXY (Next.js 16 Gatekeeper)
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Check MySQL JWT Auth Token Cookie
  const mysqlToken = request.cookies.get('auth_token')?.value
  let isAuthenticated = false

  if (mysqlToken) {
    const payload = verifyToken(mysqlToken)
    if (payload) {
      isAuthenticated = true
    }
  }

  // 2. Fallback: Check Supabase Auth Session Cookie if MySQL token not present
  if (!isAuthenticated) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      isAuthenticated = true
    }
  }

  // ── RULE 1: Protected route gateway ────────────────────────────────────────
  // Unauthenticated users trying to access any tool or dashboard route are redirected to /auth
  if (isProtected(pathname) && !isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set('redirect', pathname)
    console.info(
      `[Proxy Guard] Unauthenticated access to "${pathname}" — redirecting to /auth?redirect=${pathname}`
    )
    return NextResponse.redirect(redirectUrl)
  }

  // ── RULE 2: Authenticated user lock ────────────────────────────────────────
  // Logged-in users visiting /auth are bounced to the home page.
  if (isAuthRoute(pathname) && isAuthenticated) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.search = ''
    console.info(
      `[Proxy Guard] Authenticated user visited "${pathname}" — redirecting to /`
    )
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|css|js|map)$).*)',
  ],
}
