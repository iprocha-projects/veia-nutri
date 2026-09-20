import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { parseNotification } from '@/lib/notifications'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const [rawNotifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: session.userId,
          ...(unreadOnly ? { readAt: null } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      prisma.notification.count({
        where: {
          userId: session.userId,
          readAt: null,
        },
      }),
    ])

    const notifications = rawNotifications.map(parseNotification)

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Erro ao carregar notificações' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id, markAllAsRead } = await req.json()

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, message: 'Todas as notificações marcadas como lidas' })
    }

    if (id) {
      const updated = await prisma.notification.updateMany({
        where: {
          id,
          userId: session.userId,
        },
        data: {
          readAt: new Date(),
        },
      })

      if (updated.count === 0) {
        return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: 'Notificação marcada como lida' })
    }

    return NextResponse.json({ error: 'Parâmetro id ou markAllAsRead obrigatório' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
    }

    const deleted = await prisma.notification.deleteMany({
      where: {
        id,
        userId: session.userId,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Notificação excluída com sucesso' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Erro ao excluir notificação' }, { status: 500 })
  }
}
