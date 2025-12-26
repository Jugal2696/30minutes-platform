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

  // 1. ADMIN BYPASS (Critical Safety)
  if (path.startsWith('/admin') || path.startsWith('/_next') || path.includes('.')) {
    return response
  }

  // 2. EMERGENCY KILL SWITCHES
  try {
      const { data: controls } = await supabase.from('emergency_controls').select('*').single()

      if (controls) {
        if (controls.kill_all_traffic && path !== '/maintenance') {
          return NextResponse.redirect(new URL('/maintenance', request.url))
        }

        if (controls.kill_auth_system) {
           const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/onboarding') || path.startsWith('/auth');
           const isLogout = path === '/auth/logout' || path === '/logout';
           
           if (isAuthRoute && !isLogout && path !== '/maintenance') {
              return NextResponse.redirect(new URL('/maintenance?reason=auth_disabled', request.url))
           }
        }
      }
  } catch (e) {
      console.error("Middleware Safety Check Failed", e)
  }

  // 3. PROTECTED ROUTES
  if (path.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}