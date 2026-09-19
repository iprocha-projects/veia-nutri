import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

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

 return NextResponse.json(newPlan, { status: 201 })
 } catch (error) {
 console.error('Error creating meal plan:', error)
 return NextResponse.json({ error: 'Erro ao criar plano alimentar' }, { status: 500 })
 }
}
