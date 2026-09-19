import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
 const session = await getSession()
 if (!session || session.role !== 'NUTRITIONIST') {
 return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
 }

 const clients = await prisma.client.findMany({
 where: { professionalId: session.professionalId },
 include: {
 user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
 mealPlans: { orderBy: { createdAt: 'desc' }, take: 1 },
 measurements: { orderBy: { measuredAt: 'desc' }, take: 1 },
 checkins: { orderBy: { submittedAt: 'desc' }, take: 1 },
 mealLogs: { orderBy: { loggedAt: 'desc' }, take: 1 },
 },
 orderBy: { createdAt: 'desc' },
 })

 return NextResponse.json(clients)
}

export async function POST(req: Request) {
 const session = await getSession()
 if (!session || (session.role !== 'NUTRITIONIST' && session.role !== 'ADMIN')) {
 return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
 }

 try {
 const { name, email, phone, birthDate, notes, professionalId } = await req.json()

 if (!name || !email) {
 return NextResponse.json({ error: 'Nome e E-mail são obrigatórios' }, { status: 400 })
 }

 // Determine target professional ID
 const targetProfessionalId = session.role === 'NUTRITIONIST' ? session.professionalId : professionalId

 if (!targetProfessionalId) {
 return NextResponse.json({ error: 'ID do Nutricionista não fornecido' }, { status: 400 })
 }

 const existing = await prisma.user.findUnique({ where: { email } })
 if (existing) {
 return NextResponse.json({ error: 'Já existe um usuário cadastrado com este e-mail' }, { status: 400 })
 }

 const passwordHash = await bcrypt.hash('123456', 10)

 const user = await prisma.user.create({
 data: {
 email,
 passwordHash,
 name,
 phone,
 role: 'CLIENT',
 },
 })

 const client = await prisma.client.create({
 data: {
 professionalId: targetProfessionalId,
 userId: user.id,
 birthDate: birthDate ? new Date(birthDate) : null,
 notes,
 },
 include: { user: true },
 })

 return NextResponse.json(client, { status: 201 })
 } catch (error) {
 console.error('Error creating client:', error)
 return NextResponse.json({ error: 'Erro ao cadastrar cliente' }, { status: 500 })
 }
}
