import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
 const session = await getSession()
 if (!session || session.role !== 'ADMIN') {
 return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
 }

 try {
 const { name, email, professionalRegistration } = await req.json()

 if (!name || !email) {
 return NextResponse.json({ error: 'Nome e E-mail são obrigatórios' }, { status: 400 })
 }

 const existing = await prisma.user.findUnique({ where: { email } })
 if (existing) {
 return NextResponse.json({ error: 'Já existe um usuário cadastrado com este e-mail' }, { status: 400 })
 }

 // Default password for new nutritionists
 const passwordHash = await bcrypt.hash('123456', 10)

 const user = await prisma.user.create({
 data: {
 email,
 passwordHash,
 name,
 role: 'NUTRITIONIST',
 },
 })

 const professional = await prisma.professional.create({
 data: {
 userId: user.id,
 professionalRegistration,
 },
 include: { user: true },
 })

 return NextResponse.json(professional, { status: 201 })
 } catch (error) {
 console.error('Error creating professional:', error)
 return NextResponse.json({ error: 'Erro ao cadastrar nutricionista' }, { status: 500 })
 }
}
