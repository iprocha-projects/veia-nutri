import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
 try {
 const { email, password } = await req.json()

 if (!email || !password) {
 return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
 }

 const user = await prisma.user.findUnique({
 where: { email },
 include: { professional: true, client: true },
 })

 if (!user) {
 return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
 }

 const isValid = await bcrypt.compare(password, user.passwordHash)
 if (!isValid) {
 return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
 }

 const sessionPayload = {
 userId: user.id,
 email: user.email,
 role: user.role,
 name: user.name,
 professionalId: user.professional?.id,
 clientId: user.client?.id,
 }

 const token = signToken(sessionPayload)

 const response = NextResponse.json({ success: true, user: sessionPayload })
 response.cookies.set('nutrimvo_token', token, {
 httpOnly: true,
 path: '/',
 maxAge: 60 * 60 * 24 * 7, // 7 days
 })

 return response
 } catch (error) {
 console.error('Login error:', error)
 return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
 }
}
