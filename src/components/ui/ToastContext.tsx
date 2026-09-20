'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string) => void
    error: (title: string, message?: string) => void
    info: (title: string, message?: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = { id, type, title, message, duration }

    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const toast = {
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message, 5000),
    info: (title: string, message?: string) => addToast('info', title, message),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Animated Popups Container */}
      <div
        aria-live="assertive"
        className="fixed top-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none sm:max-w-md px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full p-4 rounded-xl border backdrop-blur-md shadow-xl animate-toast-in transition-all flex items-start space-x-3.5 ${
              t.type === 'success'
                ? 'bg-white/95 border-[#D2EBDC] text-[#26343B]'
                : t.type === 'error'
                ? 'bg-white/95 border-[#FFD8D8] text-[#26343B]'
                : 'bg-white/95 border-[#E2E8EE] text-[#26343B]'
            }`}
          >
            {/* Icon Variant */}
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && (
                <div className="w-8 h-8 rounded-full bg-[#F0F8F5] text-[#4A8C6F] flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
              {t.type === 'error' && (
                <div className="w-8 h-8 rounded-full bg-[#FFF5F5] text-[#D94949] flex items-center justify-center animate-shake">
                  <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
              {t.type === 'info' && (
                <div className="w-8 h-8 rounded-full bg-[#F0F4F7] text-[#7897A8] flex items-center justify-center">
                  <Info className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-0.5">
              <h4 className="text-sm font-bold tracking-tight text-[#26343B]">{t.title}</h4>
              {t.message && <p className="text-xs text-[#71808A] leading-relaxed">{t.message}</p>}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#71808A] hover:text-[#26343B] p-1 rounded-md transition hover:bg-[#F6F8FA] shrink-0"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context.toast
}
