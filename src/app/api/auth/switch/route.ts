import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(req: Request) {
 try {
 const { targetRole } = await req.json()

 const targetEmail = targetRole === 'NUTRITIONIST' ? 'nutri@exemplo.com' : 'camila@exemplo.com'

 const user = await prisma.user.findUnique({
 where: { email: targetEmail },
 include: { professional: true, client: true },
 })

 if (!user) {
 return NextResponse.json({ error: 'Usuário de teste não encontrado' }, { status: 404 })
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
 maxAge: 60 * 60 * 24 * 7,
 })

 return response
 } catch (error) {
 console.error('Switch role error:', error)
 return NextResponse.json({ error: 'Erro ao alternar perfil' }, { status: 500 })
 }
}
