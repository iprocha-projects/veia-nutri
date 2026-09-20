import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { areMealsDifferent } from '@/lib/meal-plans-comparator'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST' || !session.professionalId) {
    return NextResponse.json({ error: 'Somente nutricionistas podem criar ou editar planos' }, { status: 401 })
  }

  try {
    const { planId, templateId, clientId, title, meals, publish } = await req.json()

    if (!clientId || !title?.trim() || !Array.isArray(meals)) {
      return NextResponse.json({ error: 'Dados incompletos para criação ou edição do plano alimentar' }, { status: 400 })
    }

    // Verify that the client belongs to the authenticated nutritionist (tenant isolation)
    const client = await prisma.client.findFirst({
      where: { id: clientId, professionalId: session.professionalId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Paciente não encontrado ou não autorizado' }, { status: 403 })
    }

    // Determine linked base template
    let linkedTemplateId: string | null = templateId || null

    if (!linkedTemplateId && planId && planId !== 'new') {
      const existing = await prisma.mealPlan.findUnique({
        where: { id: planId },
        select: { templateId: true },
      })
      if (existing?.templateId) {
        linkedTemplateId = existing.templateId
      }
    }

    // Compute effective title according to the personalization rule:
    // "Quando um modelo base tiver sendo utilizado pelo cliente e ocorrer alguma alteração e salvar,
    // ou seja, ele ficar diferente do modelo base salvo, ele deve ter o mesmo nome com o (Personalizado) na frente.
    // Tem que ser o plano base que foi modificado."
    let effectiveTitle = title.trim()

    if (linkedTemplateId) {
      const baseTemplate = await prisma.mealPlanTemplate.findFirst({
        where: { id: linkedTemplateId, professionalId: session.professionalId },
      })

      if (baseTemplate) {
        const cleanBaseTitle = baseTemplate.title.replace(/\s*\(Personalizado\)$/i, '').trim()
        const isModified = areMealsDifferent(meals, baseTemplate.meals as any[])

        if (isModified) {
          effectiveTitle = `${cleanBaseTitle} (Personalizado)`
        } else {
          effectiveTitle = cleanBaseTitle
        }
      }
    }

    // Application-level uniqueness check per tenant/client:
    // Do NOT allow a nutritionist to create two plans with the same name for this client,
    // avoiding a global database constraint that would impact multitenancy across different nutritionists.
    const duplicatePlan = await prisma.mealPlan.findFirst({
      where: {
        clientId,
        title: { equals: effectiveTitle, mode: 'insensitive' },
        ...(planId && planId !== 'new' ? { NOT: { id: planId } } : {}),
      },
    })

    if (duplicatePlan) {
      return NextResponse.json(
        { error: `Já existe um plano alimentar com o nome "${effectiveTitle}" para este paciente. Escolha outro nome ou edite o plano existente.` },
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
            title: effectiveTitle,
            templateId: linkedTemplateId,
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
            message: `Seu nutricionista publicou o plano "${effectiveTitle}". Confira suas refeições e metas!`,
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
        templateId: linkedTemplateId,
        title: effectiveTitle,
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
        message: `Seu nutricionista publicou o plano "${effectiveTitle}". Confira suas refeições e metas!`,
        link: '/client?tab=plan',
      })
    }

    return NextResponse.json(newPlan, { status: 201 })
  } catch (error) {
    console.error('Error saving meal plan:', error)
    return NextResponse.json({ error: 'Erro ao salvar plano alimentar' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST' || !session.professionalId) {
    return NextResponse.json({ error: 'Somente nutricionistas podem excluir planos alimentares' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do plano alimentar é obrigatório' }, { status: 400 })
    }

    // Verify the plan exists and belongs to a client of this nutritionist
    const targetPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: { client: true },
    })

    if (!targetPlan) {
      return NextResponse.json({ error: 'Plano alimentar não encontrado' }, { status: 404 })
    }

    if (targetPlan.client.professionalId !== session.professionalId) {
      return NextResponse.json({ error: 'Acesso não autorizado a este plano' }, { status: 403 })
    }

    await prisma.mealPlan.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Plano alimentar excluído com sucesso' })
  } catch (error) {
    console.error('Error deleting meal plan:', error)
    return NextResponse.json({ error: 'Erro ao excluir plano alimentar' }, { status: 500 })
  }
}
