import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /crm/* routes
  if (!pathname.startsWith('/crm')) {
    return NextResponse.next()
  }

  // Allow auth pages through without session check
  if (
    pathname === '/crm/login' ||
    pathname.startsWith('/crm/login/') ||
    pathname === '/crm/forgot-password' ||
    pathname.startsWith('/crm/forgot-password/')
  ) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/crm/login'
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/crm/:path*'],
}
