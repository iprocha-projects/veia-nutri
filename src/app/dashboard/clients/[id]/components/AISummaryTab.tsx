'use client'

import { useState } from 'react'
import { Sparkles, Edit, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'

interface AISummaryTabProps {
  clientId: string
  currentSummary: any
  summaryLoading: boolean
  onGenerateSummary: () => void
  onUpdateSummary: (updated: any) => void
}

export function AISummaryTab({
  clientId,
  currentSummary,
  summaryLoading,
  onGenerateSummary,
  onUpdateSummary,
}: AISummaryTabProps) {
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleStartEditing = () => {
    if (currentSummary) {
      setEditedText(currentSummary.summary)
      setIsEditing(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!currentSummary) return
    setSaving(true)
    try {
      const res = await fetch('/api/ai-summary', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: currentSummary.id,
          updatedSummary: editedText,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        onUpdateSummary(updated)
        setIsEditing(false)
        toast.success('Revisão auditada salva!', 'O resumo clínico semanal foi atualizado com sucesso no histórico.')
      } else {
        const err = await res.json()
        toast.error('Erro ao salvar revisão', err.error || 'Não foi possível salvar as alterações.')
      }
    } catch {
      toast.error('Erro de conexão', 'Falha ao se comunicar com o servidor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card-clinical p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#26343B] flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#7897A8]" />
            <span>Resumo Semanal Gerado com IA (Auditado)</span>
          </h2>
          <p className="text-xs text-[#71808A]">
            Conforme a diretriz clínica, o resumo serve para agilizar a revisão manual pelo nutricionista sem realizar diagnósticos automáticos.
          </p>
        </div>

        <button
          onClick={onGenerateSummary}
          disabled={summaryLoading}
          className="btn-primary flex items-center space-x-2 text-xs self-start sm:self-auto"
        >
          {summaryLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{summaryLoading ? 'Processando com IA...' : 'Gerar Novo Resumo'}</span>
        </button>
      </div>

      {currentSummary ? (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-[#FAFBFD] p-5 rounded-xl border border-[#E2E8EE] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7897A8]">
                ID de Auditoria: {currentSummary.id} • Modelo: {currentSummary.model}
              </span>
              {!isEditing && (
                <button
                  onClick={handleStartEditing}
                  className="text-xs text-[#7897A8] font-semibold hover:underline flex items-center space-x-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Revisar / Editar Texto</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 animate-fade-in">
                <textarea
                  rows={8}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full text-sm p-3.5 rounded-lg border border-[#7897A8] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="btn-primary text-xs flex items-center space-x-1.5"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{saving ? 'Salvando...' : 'Salvar Revisão Auditada'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#26343B] whitespace-pre-line leading-relaxed animate-fade-in">
                {currentSummary.summary}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F0F4F7] text-[#7897A8] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-xs text-[#71808A]">
            Nenhum resumo gerado para este paciente ainda. Clique em "Gerar Novo Resumo" para processar com IA.
          </p>
        </div>
      )}
    </div>
  )
}
