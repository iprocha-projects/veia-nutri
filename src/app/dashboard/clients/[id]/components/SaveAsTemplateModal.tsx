'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2, Save, Utensils } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'

interface SaveAsTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  currentTitle: string
  meals: any[]
}

const COMMON_CATEGORIES = [
  'Hipertrofia',
  'Emagrecimento',
  'Reeducação Alimentar',
  'Low Carb',
  'Vegetariano',
  'Geral',
]

export function SaveAsTemplateModal({
  isOpen,
  onClose,
  currentTitle,
  meals,
}: SaveAsTemplateModalProps) {
  const toast = useToast()
  const [title, setTitle] = useState(currentTitle || 'Novo Modelo de Dieta Base')
  const [category, setCategory] = useState('Hipertrofia')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Título obrigatório', 'Informe um nome para o seu modelo base.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/meal-plan-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          description,
          meals,
        }),
      })

      if (res.ok) {
        toast.success(
          'Modelo Base Criado!',
          `"${title}" foi salvo na sua biblioteca e já pode ser aplicado a outros pacientes.`
        )
        onClose()
      } else {
        const data = await res.json()
        toast.error('Erro ao salvar modelo', data.error || 'Tente novamente.')
      }
    } catch {
      toast.error('Erro de conexão', 'Não foi possível salvar o modelo base.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#262D31]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8EE] w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8EE] bg-gradient-to-r from-[#F6F8FA] to-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#26343B]">Salvar como Modelo Base</h3>
              <p className="text-xs text-[#71808A]">
                Transforme esta dieta em um modelo reutilizável para outros pacientes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71808A] hover:text-[#26343B] rounded-lg hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">
              Nome do Modelo Base
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Protocolo Hipertrofia 2500kcal"
              className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">
              Categoria / Objetivo
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    category === cat
                      ? 'bg-[#26343B] text-white'
                      : 'bg-[#F6F8FA] text-[#71808A] hover:bg-[#E8EEF3]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ou digite outra categoria..."
              className="w-full text-xs p-2 rounded-xl border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">
              Descrição / Observações do Modelo (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Dieta rica em proteínas para fase de ganho de massa magra, 5 refeições diárias..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none resize-none"
            />
          </div>

          {/* Summary pill */}
          <div className="p-3 rounded-xl bg-[#F0F6F9] border border-[#D0E2EB] flex items-center justify-between text-xs text-[#26343B]">
            <span className="flex items-center space-x-1.5 font-medium">
              <Utensils className="w-4 h-4 text-[#7897A8]" />
              <span>Conteúdo a ser salvo:</span>
            </span>
            <span className="font-bold">{meals.length} refeições estruturadas</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#71808A] hover:text-[#26343B] rounded-xl hover:bg-[#F6F8FA] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs flex items-center space-x-1.5 px-4 py-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Salvando...' : 'Confirmar e Salvar Modelo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
