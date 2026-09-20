import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
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
    const category = (formData.get('category') as string) || 'front'
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

    if (!targetClientId || !photo) {
      return NextResponse.json({ error: 'Foto e cliente válido são obrigatórios' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(photo.type)) {
      return NextResponse.json({ error: 'Formato de imagem inválido. Formatos permitidos: JPG, PNG, WEBP.' }, { status: 400 })
    }

    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'O tamanho da imagem excede o limite de 10MB.' }, { status: 400 })
    }

    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'progress')
    await mkdir(uploadsDir, { recursive: true })

    const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`
    const filePath = path.join(uploadsDir, filename)
    await writeFile(filePath, buffer)
    const photoUrl = `/uploads/progress/${filename}`

    const progressPhoto = await prisma.progressPhoto.create({
      data: {
        clientId: targetClientId,
        category,
        photoUrl,
        visibility: 'private',
      },
    })

    return NextResponse.json(progressPhoto, { status: 201 })
  } catch (error) {
    console.error('Error uploading progress photo:', error)
    return NextResponse.json({ error: 'Erro ao salvar foto de evolução' }, { status: 500 })
  }
}
