import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { weightKg, waistCm, hipCm, armCm, thighCm } = body

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

    if (!targetClientId || !weightKg) {
      return NextResponse.json({ error: 'O peso e um cliente válido são obrigatórios' }, { status: 400 })
    }

    const measurement = await prisma.measurement.create({
      data: {
        clientId: targetClientId,
        weightKg: parseFloat(weightKg),
        waistCm: waistCm ? parseFloat(waistCm) : null,
        hipCm: hipCm ? parseFloat(hipCm) : null,
        armCm: armCm ? parseFloat(armCm) : null,
        thighCm: thighCm ? parseFloat(thighCm) : null,
      },
    })

    return NextResponse.json(measurement, { status: 201 })
  } catch (error) {
    console.error('Error saving measurement:', error)
    return NextResponse.json({ error: 'Erro ao registrar medidas' }, { status: 500 })
  }
}
