import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST' || !session.professionalId) {
    return NextResponse.json({ error: 'Somente nutricionistas podem ativar planos' }, { status: 401 })
  }

  try {
    const { id } = await params

    const targetPlan = await prisma.mealPlan.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!targetPlan) {
      return NextResponse.json({ error: 'Plano alimentar não encontrado' }, { status: 404 })
    }

    if (targetPlan.client.professionalId !== session.professionalId) {
      return NextResponse.json({ error: 'Acesso não autorizado ao plano deste paciente' }, { status: 403 })
    }

    // Unpublish all other plans for this client
    await prisma.mealPlan.updateMany({
      where: {
        clientId: targetPlan.clientId,
        status: 'PUBLISHED',
      },
      data: {
        status: 'DRAFT',
      },
    })

    // Set the target plan as PUBLISHED (vigente)
    const activatedPlan = await prisma.mealPlan.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
      },
      include: {
        meals: {
          include: { items: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    // Notify the client
    if (targetPlan.client.userId) {
      await createNotification({
        userId: targetPlan.client.userId,
        type: 'MEAL_PLAN',
        title: '🥗 Seu Plano Alimentar foi Atualizado!',
        message: `Seu nutricionista ativou a versão "${targetPlan.title}" como sua dieta oficial. Confira suas refeições!`,
        link: '/client?tab=plan',
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Plano ativado como vigente com sucesso!',
      plan: activatedPlan,
    })
  } catch (error) {
    console.error('Error activating meal plan:', error)
    return NextResponse.json({ error: 'Erro ao ativar versão do plano alimentar' }, { status: 500 })
  }
}
