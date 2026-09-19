import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, avatarUrl: true, description: true, role: true }
  })
  return NextResponse.json({ user })
}

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { name, avatarUrl, description } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'O nome é obrigatório' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        avatarUrl,
        description,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        description: true,
      }
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
