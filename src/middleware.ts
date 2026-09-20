import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production.')
    }
    return new TextEncoder().encode('veia_nutri_local_development_jwt_secret_key_32bytes_long')
  }
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('nutrimvo_token')?.value
  const { pathname } = request.nextUrl

  // Protected paths
  const isDashboard = pathname.startsWith('/dashboard')
  const isClient = pathname.startsWith('/client')
  const isAdmin = pathname.startsWith('/admin')

  if (!isDashboard && !isClient && !isAdmin) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret())

    const role = payload.role as string

    // Role-based Access Control
    if (isDashboard && role !== 'NUTRITIONIST') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isClient && role !== 'CLIENT') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAdmin && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  } catch {
    // Invalid token
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('nutrimvo_token')
    return response
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/client/:path*', '/admin/:path*'],
}
