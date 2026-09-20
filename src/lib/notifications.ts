import { prisma } from '@/lib/prisma'

export type NotificationType =
  | 'MEAL_PLAN'
  | 'MEAL_LOG'
  | 'MEASUREMENT'
  | 'PHOTO'
  | 'CHECKIN'
  | 'AI_SUMMARY'
  | 'PROFILE'
  | string

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

export interface FormattedNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  readAt: Date | null
  createdAt: Date
}

/**
 * Creates a notification in the database with structured payload in body
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams): Promise<FormattedNotification> {
  const body = JSON.stringify({
    message,
    link: link || null,
  })

  const notif = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
    },
  })

  return parseNotification(notif)
}

/**
 * Parses notification body into clean human-readable message and link
 */
export function parseNotification(notif: any): FormattedNotification {
  let message = notif.body
  let link: string | undefined = undefined

  try {
    const parsed = JSON.parse(notif.body)
    if (parsed && typeof parsed === 'object') {
      message = parsed.message || parsed.text || notif.body
      link = parsed.link || undefined
    }
  } catch {
    // Fallback if plain text body
    message = notif.body
  }

  return {
    id: notif.id,
    userId: notif.userId,
    type: notif.type,
    title: notif.title,
    message,
    link,
    readAt: notif.readAt,
    createdAt: notif.createdAt,
  }
}
