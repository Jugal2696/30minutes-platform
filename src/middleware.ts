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

  // This refreshes the session if needed
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // 1. ADMIN BYPASS & STATIC FILES
  if (path.startsWith('/admin') || path.startsWith('/_next') || path.includes('.')) {
    return response
  }

  // 2. PROTECTED ROUTES (Dashboard)
  if (path.startsWith('/dashboard') || path.startsWith('/onboarding')) {
    if (!user) {
      // Redirect to login if no user found
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 3. AUTH PAGE REDIRECT (Prevent logged-in users from seeing login page)
  if (path === '/login' || path === '/signup') {
    if (user) {
      // If user is already logged in, send them to dashboard
      // We check their role to decide WHICH dashboard
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      
      if (profile?.role === 'BRAND' || profile?.role === 'BUSINESS') {
         return NextResponse.redirect(new URL('/dashboard/business', request.url))
      } else if (profile?.role === 'CREATOR') {
         return NextResponse.redirect(new URL('/dashboard/creator', request.url))
      } else if (profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN') {
         return NextResponse.redirect(new URL('/admin', request.url))
      } else {
         return NextResponse.redirect(new URL('/dashboard/business', request.url)) // Fallback
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}