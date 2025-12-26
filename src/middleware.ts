import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 🛑 1. ADMIN BYPASS (CRITICAL)
  // Admins must ALWAYS be able to access /admin to turn off the kill switch.
  // We also allow static assets to prevent the site looking broken.
  if (path.startsWith('/admin') || path.startsWith('/_next') || path.includes('.')) {
    return response
  }

  // 🛑 2. FETCH EMERGENCY CONTROLS
  // In a high-scale app, we would cache this in Redis/Edge Config.
  // For now, a direct DB call ensures immediate consistency.
  const { data: controls } = await supabase.from('emergency_controls').select('*').single()

  if (controls) {
    // A. KILL ALL TRAFFIC
    if (controls.kill_all_traffic && path !== '/maintenance') {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }

    // B. KILL AUTH SYSTEM
    // Block login, signup, onboarding, and auth callbacks if auth is killed
    if (controls.kill_auth_system) {
       const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/onboarding') || path.startsWith('/auth');
       // Allow logout so trapped users can leave
       const isLogout = path === '/auth/logout' || path === '/logout';
       
       if (isAuthRoute && !isLogout && path !== '/maintenance') {
          return NextResponse.redirect(new URL('/maintenance?reason=auth_disabled', request.url))
       }
    }
  }

  // 🛑 3. RBAC ROUTE PROTECTION (Existing Logic)
  // Protected Routes
  if (path.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // (Optional: You could check banned_until here too, but auth.getUser handles session validity)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}