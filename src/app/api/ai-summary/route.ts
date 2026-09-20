import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { buildClientSummarySnapshot, generateAISummary } from '@/lib/ai-summary'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST') {
    return NextResponse.json({ error: 'Somente nutricionistas podem gerar resumos com IA' }, { status: 401 })
  }

  try {
    const { clientId, days = 7 } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório' }, { status: 400 })
    }

    // Verify tenant ownership
    const client = await prisma.client.findFirst({
      where: { id: clientId, professionalId: session.professionalId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Paciente não encontrado ou não autorizado' }, { status: 403 })
    }

    const snapshot = await buildClientSummarySnapshot(clientId, days)
    const { summary, model } = await generateAISummary(snapshot)

    // Save audit log to database
    const savedSummary = await prisma.aISummary.create({
      data: {
        clientId,
        periodStart: new Date(snapshot.periodStart),
        periodEnd: new Date(snapshot.periodEnd),
        inputSnapshot: JSON.stringify(snapshot),
        summary,
        model,
      },
    })

    return NextResponse.json(savedSummary, { status: 201 })
  } catch (error) {
    console.error('Error generating AI summary:', error)
    return NextResponse.json({ error: 'Erro ao gerar resumo da semana' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST') {
    return NextResponse.json({ error: 'Somente nutricionistas podem editar resumos' }, { status: 401 })
  }

  try {
    const { summaryId, updatedSummary } = await req.json()

    if (!summaryId || !updatedSummary) {
      return NextResponse.json({ error: 'ID e conteúdo do resumo são obrigatórios' }, { status: 400 })
    }

    // Verify ownership
    const existingSummary = await prisma.aISummary.findUnique({
      where: { id: summaryId },
      include: { client: true },
    })

    if (!existingSummary || existingSummary.client.professionalId !== session.professionalId) {
      return NextResponse.json({ error: 'Resumo não encontrado ou não autorizado' }, { status: 403 })
    }

    const updated = await prisma.aISummary.update({
      where: { id: summaryId },
      data: { summary: updatedSummary },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating AI summary:', error)
    return NextResponse.json({ error: 'Erro ao atualizar resumo' }, { status: 500 })
  }
}
