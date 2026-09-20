import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function PUT(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 const session = await getSession()
 if (!session || session.role !== 'NUTRITIONIST') {
 return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 })
 }

 try {
 const { id } = await params
 const { name, phone, notes, status } = await req.json()

 // Find client to ensure they belong to this professional
 const existingClient = await prisma.client.findUnique({
 where: { id },
 include: { user: true },
 })

 if (!existingClient || existingClient.professionalId !== session.professionalId) {
 return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
 }

 // Update User for name/phone
 await prisma.user.update({
 where: { id: existingClient.userId },
 data: { name, phone },
 })

 // Update Client for notes/status
 const updatedClient = await prisma.client.update({
 where: { id },
 data: {
 notes,
 status: status || existingClient.status,
 },
 include: { user: true },
 })

 // Notify client if notes updated
 if (existingClient.userId && notes && notes !== existingClient.notes) {
 await createNotification({
 userId: existingClient.userId,
 type: 'PROFILE',
 title: '📋 Prontuário Atualizado',
 message: 'Seu nutricionista atualizou as observações e diretrizes do seu acompanhamento clínico.',
 link: '/client',
 })
 }

 return NextResponse.json(updatedClient)
 } catch (error) {
 console.error('Error updating client:', error)
 return NextResponse.json({ error: 'Erro ao atualizar paciente' }, { status: 500 })
 }
}
