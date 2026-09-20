import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST' || !session.professionalId) {
    return NextResponse.json({ error: 'Somente nutricionistas têm acesso aos modelos base' }, { status: 401 })
  }

  try {
    const templates = await prisma.mealPlanTemplate.findMany({
      where: { professionalId: session.professionalId },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching meal plan templates:', error)
    return NextResponse.json({ error: 'Erro ao carregar modelos base' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST' || !session.professionalId) {
    return NextResponse.json({ error: 'Somente nutricionistas podem criar modelos base' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { title, description, category, meals } = body

    if (!title || !Array.isArray(meals) || meals.length === 0) {
      return NextResponse.json(
        { error: 'Título e ao menos uma refeição são obrigatórios para criar um modelo base' },
        { status: 400 }
      )
    }

    // Sanitize meals structure
    const sanitizedMeals = meals.map((m: any, index: number) => ({
      name: m.name || `Refeição ${index + 1}`,
      time: m.time || '08:00',
      instructions: m.instructions || '',
      sortOrder: index + 1,
      items: Array.isArray(m.items)
        ? m.items.map((i: any) => ({
            foodName: i.foodName || '',
            quantity: parseFloat(i.quantity) || 1,
            unit: i.unit || 'g',
            notes: i.notes || '',
          }))
        : [],
    }))

    const template = await prisma.mealPlanTemplate.create({
      data: {
        professionalId: session.professionalId,
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || 'Geral',
        meals: sanitizedMeals,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating meal plan template:', error)
    return NextResponse.json({ error: 'Erro ao salvar modelo base' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST' || !session.professionalId) {
    return NextResponse.json({ error: 'Somente nutricionistas podem remover modelos base' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do modelo é obrigatório' }, { status: 400 })
    }

    const deleted = await prisma.mealPlanTemplate.deleteMany({
      where: {
        id,
        professionalId: session.professionalId,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Modelo base não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Modelo base removido com sucesso' })
  } catch (error) {
    console.error('Error deleting meal plan template:', error)
    return NextResponse.json({ error: 'Erro ao excluir modelo base' }, { status: 500 })
  }
}
