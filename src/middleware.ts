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

    // 🏆 GOD MODE ENFORCEMENT: FOUNDER ALWAYS GOES TO ADMIN
    if (profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    // Standard Business fallback
    if (profile?.role === 'BUSINESS') {
      return NextResponse.redirect(new URL('/dashboard/business', request.url))
    }

    // Standard Creator fallback
    if (profile?.role === 'CREATOR') {
      return NextResponse.redirect(new URL('/dashboard/creator', request.url))
    }
  }

  // 3. PROTECT ADMIN ROUTE: STRICT ACCESS CONTROL
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // 🛑 KICKBACK PREVENTER: Allow Super Admin to stay in Admin OS
    if (profile?.role !== 'SUPER_ADMIN' && profile?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard/business', request.url))
    }
  }
  
  // 4. PREVENT GOD-MODE USERS FROM GETTING STUCK IN BUSINESS DASHBOARDS
  if (request.nextUrl.pathname.startsWith('/dashboard/business')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single()

    // If you are an Admin/SuperAdmin but landed on a business page, 
    // we let you stay ONLY if you explicitly want to be there, 
    // otherwise, the system is now ready for God Mode.
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}