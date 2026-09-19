import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'nutri_mvo_super_secret_jwt_key_2026_prod'

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
 const secret = new TextEncoder().encode(JWT_SECRET)
 const { payload } = await jwtVerify(token, secret)

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
 } catch (error) {
 // Invalid token
 const response = NextResponse.redirect(new URL('/login', request.url))
 response.cookies.delete('nutrimvo_token')
 return response
 }
}

export const config = {
 matcher: ['/dashboard/:path*', '/client/:path*', '/admin/:path*'],
}
