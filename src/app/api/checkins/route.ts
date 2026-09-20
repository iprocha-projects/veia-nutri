import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { hungerScore, energyScore, difficultyScore, notes } = body

    let targetClientId: string | undefined

    if (session.role === 'CLIENT') {
      targetClientId = session.clientId
    } else if (session.role === 'NUTRITIONIST') {
      const requestedClientId = body.clientId
      if (!requestedClientId) {
        return NextResponse.json({ error: 'Cliente não especificado' }, { status: 400 })
      }
      const client = await prisma.client.findFirst({
        where: { id: requestedClientId, professionalId: session.professionalId },
      })
      if (!client) {
        return NextResponse.json({ error: 'Acesso não autorizado ao cliente' }, { status: 403 })
      }
      targetClientId = requestedClientId
    } else if (session.role === 'ADMIN') {
      targetClientId = body.clientId
    }

    if (!targetClientId || hungerScore === undefined || energyScore === undefined || difficultyScore === undefined) {
      return NextResponse.json({ error: 'Preencha todos os campos de avaliação' }, { status: 400 })
    }

    const checkin = await prisma.checkin.create({
      data: {
        clientId: targetClientId,
        hungerScore: parseInt(hungerScore, 10),
        energyScore: parseInt(energyScore, 10),
        difficultyScore: parseInt(difficultyScore, 10),
        notes,
      },
    })

    // Notify professional if logged by client
    if (session.role === 'CLIENT') {
      const clientInfo = await prisma.client.findUnique({
        where: { id: targetClientId },
        include: { user: true, professional: true },
      })

      if (clientInfo?.professional?.userId) {
        await createNotification({
          userId: clientInfo.professional.userId,
          type: 'CHECKIN',
          title: '📝 Novo Check-in Semanal',
          message: `${clientInfo.user.name} enviou um novo check-in de acompanhamento.`,
          link: `/dashboard/clients/${targetClientId}?tab=checkins`,
        })
      }
    }

    return NextResponse.json(checkin, { status: 201 })
  } catch (error) {
    console.error('Error submitting checkin:', error)
    return NextResponse.json({ error: 'Erro ao enviar check-in' }, { status: 500 })
  }
}
