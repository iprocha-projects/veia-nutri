import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const requestedClientId = formData.get('clientId') as string
    const mealId = formData.get('mealId') as string
    const notes = formData.get('notes') as string
    const photo = formData.get('photo') as File | null

    let targetClientId: string | undefined

    if (session.role === 'CLIENT') {
      targetClientId = session.clientId
    } else if (session.role === 'NUTRITIONIST') {
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
      targetClientId = requestedClientId
    }

    if (!targetClientId) {
      return NextResponse.json({ error: 'Cliente não especificado ou inválido' }, { status: 400 })
    }

    let photoUrl: string | undefined

    if (photo && photo.size > 0) {
      if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
        return NextResponse.json({ error: 'Formato de foto inválido. Permitidos: JPG, PNG, WEBP.' }, { status: 400 })
      }
      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'A foto excede o limite de 10MB.' }, { status: 400 })
      }

      const bytes = await photo.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'meals')
      await mkdir(uploadsDir, { recursive: true })

      const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`
      const filePath = path.join(uploadsDir, filename)
      await writeFile(filePath, buffer)
      photoUrl = `/uploads/meals/${filename}`
    }

    const log = await prisma.mealLog.create({
      data: {
        clientId: targetClientId,
        mealId: mealId && mealId !== 'null' ? mealId : null,
        notes,
        photoUrl,
      },
      include: { meal: true },
    })

    // Notify professional if logged by client
    if (session.role === 'CLIENT') {
      const clientInfo = await prisma.client.findUnique({
        where: { id: targetClientId },
        include: { user: true, professional: true },
      })

      if (clientInfo?.professional?.userId) {
        const mealLabel = log.meal?.name || 'refeição'
        const desc = notes ? ` (${notes.slice(0, 40)})` : ''
        await createNotification({
          userId: clientInfo.professional.userId,
          type: 'MEAL_LOG',
          title: '🍽️ Nova Refeição Registrada',
          message: `${clientInfo.user.name} registrou ${mealLabel}${desc}${photoUrl ? ' com foto' : ''}.`,
          link: `/dashboard/clients/${targetClientId}?tab=logs`,
        })
      }
    }

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Error logging meal:', error)
    return NextResponse.json({ error: 'Erro ao registrar refeição' }, { status: 500 })
  }
}
