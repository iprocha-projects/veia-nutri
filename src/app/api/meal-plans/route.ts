import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST' || !session.professionalId) {
    return NextResponse.json({ error: 'Somente nutricionistas podem criar ou editar planos' }, { status: 401 })
  }

  try {
    const { planId, clientId, title, meals, publish } = await req.json()

    if (!clientId || !title?.trim() || !Array.isArray(meals)) {
      return NextResponse.json({ error: 'Dados incompletos para criação ou edição do plano alimentar' }, { status: 400 })
    }

    const trimmedTitle = title.trim()

    // Verify that the client belongs to the authenticated nutritionist (tenant isolation)
    const client = await prisma.client.findFirst({
      where: { id: clientId, professionalId: session.professionalId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Paciente não encontrado ou não autorizado' }, { status: 403 })
    }

    // Application-level uniqueness check per tenant/client:
    // Do NOT allow a nutritionist to create two plans with the same name for this client,
    // avoiding a global database constraint that would impact multitenancy across different nutritionists.
    const duplicatePlan = await prisma.mealPlan.findFirst({
      where: {
        clientId,
        title: { equals: trimmedTitle, mode: 'insensitive' },
        ...(planId && planId !== 'new' ? { NOT: { id: planId } } : {}),
      },
    })

    if (duplicatePlan) {
      return NextResponse.json(
        { error: `Já existe um plano alimentar com o nome "${trimmedTitle}" para este paciente. Escolha outro nome ou edite o plano existente.` },
        { status: 400 }
      )
    }

    // Format meals
    const formattedMeals = meals.map((m: any, index: number) => ({
      name: m.name || `Refeição ${index + 1}`,
      time: m.time || '08:00',
      instructions: m.instructions || '',
      sortOrder: index + 1,
      items: {
        create: (m.items || []).map((item: any) => ({
          foodName: item.foodName || '',
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit || 'g',
          notes: item.notes || null,
        })),
      },
    }))

    // If updating an existing plan in-place
    if (planId && planId !== 'new') {
      const existingPlan = await prisma.mealPlan.findFirst({
        where: { id: planId, clientId },
      })

      if (existingPlan) {
        // If publishing, unpublish other plans
        if (publish) {
          await prisma.mealPlan.updateMany({
            where: { clientId, status: 'PUBLISHED', NOT: { id: planId } },
            data: { status: 'DRAFT' },
          })
        }

        // Delete previous meals to replace them
        await prisma.meal.deleteMany({
          where: { mealPlanId: planId },
        })

        const updatedPlan = await prisma.mealPlan.update({
          where: { id: planId },
          data: {
            title: trimmedTitle,
            status: publish ? 'PUBLISHED' : existingPlan.status,
            meals: {
              create: formattedMeals,
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
            title: '🥗 Plano Alimentar Atualizado!',
            message: `Seu nutricionista publicou o plano "${trimmedTitle}". Confira suas refeições e metas!`,
            link: '/client?tab=plan',
          })
        }

        return NextResponse.json(updatedPlan, { status: 200 })
      }
    }

    // Otherwise, create a new MealPlan
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
        title: trimmedTitle,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        version: nextVersion,
        meals: {
          create: formattedMeals,
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
        message: `Seu nutricionista publicou o plano "${trimmedTitle}". Confira suas refeições e metas!`,
        link: '/client?tab=plan',
      })
    }

    return NextResponse.json(newPlan, { status: 201 })
  } catch (error) {
    console.error('Error saving meal plan:', error)
    return NextResponse.json({ error: 'Erro ao salvar plano alimentar' }, { status: 500 })
  }
}
