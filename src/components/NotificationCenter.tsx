'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Trash2,
  Utensils,
  Camera,
  Calendar,
  Sparkles,
  FileText,
  Activity,
  CheckCheck,
  X,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import { FormattedNotification } from '@/lib/notifications'

export function NotificationCenter() {
  const router = useRouter()
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<FormattedNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const previousCountRef = useRef<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        const newNotifs: FormattedNotification[] = data.notifications || []
        const newCount: number = data.unreadCount || 0

        // If new notifications arrived while user is active on the page, show a friendly toast
        if (
          previousCountRef.current !== null &&
          newCount > previousCountRef.current &&
          newNotifs.length > 0
        ) {
          const newest = newNotifs[0]
          toast.info(newest.title, newest.message)
        }

        previousCountRef.current = newCount
        setNotifications(newNotifs)
        setUnreadCount(newCount)
      }
    } catch (err) {
      console.error('Failed to poll notifications:', err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(true)

    // Poll every 25 seconds for new notifications
    const interval = setInterval(() => {
      fetchNotifications(false)
    }, 25000)

    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMarkAsRead = async (id: string, link?: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (link) {
        setIsOpen(false)
        router.push(link)
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date() })))
      setUnreadCount(0)

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      })

      toast.success('Notificações atualizadas', 'Todas as notificações foram marcadas como lidas.')
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const target = notifications.find((n) => n.id === id)
      if (target && !target.readAt) {
        setUnreadCount((c) => Math.max(0, c - 1))
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id))

      await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      })
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MEAL_PLAN':
        return <Utensils className="w-4 h-4 text-emerald-600" />
      case 'MEAL_LOG':
        return <Utensils className="w-4 h-4 text-sky-600" />
      case 'MEASUREMENT':
        return <Activity className="w-4 h-4 text-purple-600" />
      case 'PHOTO':
        return <Camera className="w-4 h-4 text-amber-600" />
      case 'CHECKIN':
        return <Calendar className="w-4 h-4 text-rose-600" />
      case 'AI_SUMMARY':
        return <Sparkles className="w-4 h-4 text-indigo-600" />
      case 'PROFILE':
        return <FileText className="w-4 h-4 text-teal-600" />
      default:
        return <Bell className="w-4 h-4 text-slate-600" />
    }
  }

  const formatRelativeTime = (dateInput: Date | string) => {
    const date = new Date(dateInput)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `há ${diffMins} min`
    if (diffHours < 24) return `há ${diffHours}h`
    if (diffDays === 1) return 'ontem'
    if (diffDays < 7) return `há ${diffDays} dias`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.readAt
    return true
  })

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[#71808A] hover:text-[#26343B] hover:bg-[#F0F4F7] transition active:scale-95"
        title="Central de Notificações"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#D94949] text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-scale-in shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E2E8EE] overflow-hidden z-50 animate-scale-in">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#F6F8FA] to-white border-b border-[#E2E8EE] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-[#26343B]">Notificações</span>
              {unreadCount > 0 && (
                <span className="bg-[#7897A8]/15 text-[#26343B] text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#7897A8] hover:text-[#26343B] font-medium flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-white transition"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Marcar lidas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#71808A] hover:text-[#26343B] rounded-lg hover:bg-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex border-b border-[#E2E8EE] bg-white px-3 pt-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`pb-2 px-3 text-xs font-semibold transition border-b-2 ${
                filter === 'all'
                  ? 'border-[#26343B] text-[#26343B]'
                  : 'border-transparent text-[#71808A] hover:text-[#26343B]'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`pb-2 px-3 text-xs font-semibold transition border-b-2 ${
                filter === 'unread'
                  ? 'border-[#26343B] text-[#26343B]'
                  : 'border-transparent text-[#71808A] hover:text-[#26343B]'
              }`}
            >
              Não lidas ({unreadCount})
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F0F4F7]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#71808A]">Carregando notificações...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#F6F8FA] mx-auto flex items-center justify-center text-[#71808A]">
                  <Bell className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-xs font-semibold text-[#26343B]">
                  {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação por enquanto'}
                </p>
                <p className="text-[11px] text-[#71808A]">
                  As atualizações de planos, refeições, pesos e fotos aparecerão aqui.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !notif.readAt
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id, notif.link)}
                    className={`p-3.5 flex items-start space-x-3 transition cursor-pointer hover:bg-[#F9FBFC] group ${
                      isUnread ? 'bg-[#F0F6F9]/50' : 'bg-white'
                    }`}
                  >
                    {/* Icon Container */}
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8EE] shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs truncate ${
                            isUnread ? 'font-bold text-[#26343B]' : 'font-medium text-[#71808A]'
                          }`}
                        >
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-[#71808A] shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-[#26343B] line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread indicator / Actions */}
                    <div className="flex flex-col items-center space-y-1.5 shrink-0 pt-1">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#7897A8]" title="Não lida" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#71808A] hover:text-[#D94949] rounded transition"
                        title="Excluir notificação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
