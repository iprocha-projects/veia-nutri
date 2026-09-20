import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(req: Request) {
 const session = await getSession()
 if (!session || session.role !== 'NUTRITIONIST') {
 return NextResponse.json({ error: 'Somente nutricionistas podem criar ou editar planos' }, { status: 401 })
 }

 try {
 const { clientId, title, meals, publish } = await req.json()

 if (!clientId || !title || !Array.isArray(meals)) {
 return NextResponse.json({ error: 'Dados incompletos para criação do plano alimentar' }, { status: 400 })
 }

 // Verify that the client belongs to the authenticated nutritionist
 const client = await prisma.client.findFirst({
 where: { id: clientId, professionalId: session.professionalId },
 })

 if (!client) {
 return NextResponse.json({ error: 'Paciente não encontrado ou não autorizado' }, { status: 403 })
 }

 // Get current version count for this client
 const existingPlans = await prisma.mealPlan.findMany({
 where: { clientId },
 orderBy: { version: 'desc' },
 })

 const nextVersion = existingPlans.length > 0 ? existingPlans[0].version + 1 : 1

 // If publishing, unpublish previous plans
 if (publish) {
 await prisma.mealPlan.updateMany({
 where: { clientId, status: 'PUBLISHED' },
 data: { status: 'DRAFT' },
 })
 }

 const newPlan = await prisma.mealPlan.create({
 data: {
 clientId,
 title,
 status: publish ? 'PUBLISHED' : 'DRAFT',
 version: nextVersion,
 meals: {
 create: meals.map((m: any, index: number) => ({
 name: m.name,
 time: m.time,
 instructions: m.instructions,
 sortOrder: index + 1,
 items: {
 create: (m.items || []).map((item: any) => ({
 foodName: item.foodName,
 quantity: parseFloat(item.quantity) || 1,
 unit: item.unit || 'g',
 notes: item.notes || null,
 })),
 },
 })),
 },
 },
 include: {
 meals: { include: { items: true } },
 },
 })

 // Notify client if published
 if (publish && client.userId) {
 await createNotification({
 userId: client.userId,
 type: 'MEAL_PLAN',
 title: '🥗 Novo Plano Alimentar Disponível!',
 message: `Seu nutricionista publicou o plano "${title}". Confira suas refeições e metas!`,
 link: '/client?tab=plan',
 })
 }

 return NextResponse.json(newPlan, { status: 201 })
 } catch (error) {
 console.error('Error creating meal plan:', error)
 return NextResponse.json({ error: 'Erro ao criar plano alimentar' }, { status: 500 })
 }
}
