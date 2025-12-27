import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Default to dashboard if no specific destination is set
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    
    // Create a Supabase client that can SET cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignored for Server Components
            }
          },
        },
      }
    )
    
    // THE CRITICAL STEP: Exchange temporary code for permanent session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 🔍 CTO UPDATE: ROLE-BASED ARCHITECTURAL ROUTING
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // 🏆 PRIORITY 1: GOD MODE (SUPER_ADMIN)
        if (profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN') {
          return NextResponse.redirect(`${origin}/admin`)
        }

        // 🏆 PRIORITY 2: BUSINESS DASHBOARD
        if (profile?.role === 'BUSINESS') {
          return NextResponse.redirect(`${origin}/dashboard/business`)
        }

        // 🏆 PRIORITY 3: CREATOR DASHBOARD
        if (profile?.role === 'CREATOR') {
          return NextResponse.redirect(`${origin}/dashboard/creator`)
        }
      }

      // Success fallback! Redirect to dashboard with the cookie set
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If error, go back to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}