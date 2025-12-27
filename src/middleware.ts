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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // 1. GET AUTH USER
  const { data: { user } } = await supabase.auth.getUser()

  // 2. LOGIC: IF LOGGED IN AND ON LOGIN PAGE, MOVE TO CORRECT DASHBOARD
  if (user && request.nextUrl.pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // 🏆 GOD MODE ENFORCEMENT
    if (profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    // Standard Business fallback
    if (profile?.role === 'BUSINESS') {
      return NextResponse.redirect(new URL('/dashboard/business', request.url))
    }
  }

  // 3. PROTECT ADMIN ROUTE
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/business', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}