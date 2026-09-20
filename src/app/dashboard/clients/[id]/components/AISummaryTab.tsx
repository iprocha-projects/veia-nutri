'use client'

import { useState } from 'react'
import { Sparkles, Edit, CheckCircle2, AlertCircle } from 'lucide-react'

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
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleStartEditing = () => {
    if (currentSummary) {
      setEditedText(currentSummary.summary)
      setIsEditing(true)
      setFeedback(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!currentSummary) return
    setSaving(true)
    setFeedback(null)
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
        setFeedback('Resumo atualizado e salvo no histórico auditado com sucesso!')
      } else {
        setFeedback('Erro ao salvar edição do resumo.')
      }
    } catch (e) {
      setFeedback('Erro de comunicação com o servidor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card-clinical p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#26343B] flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#7897A8]" />
            <span>Resumo Semanal Gerado com IA (Auditado)</span>
          </h2>
          <p className="text-xs text-[#71808A]">
            Conforme a diretriz clínica, o resumo serve apenas para agilizar a revisão manual pelo nutricionista sem realizar diagnósticos automáticos.
          </p>
        </div>

        <button
          onClick={onGenerateSummary}
          disabled={summaryLoading}
          className="btn-primary flex items-center space-x-2 text-xs self-start sm:self-auto"
        >
          <Sparkles className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
          <span>{summaryLoading ? 'Processando...' : 'Gerar Novo Resumo'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-[#F0F8F5] border border-[#D2EBDC] text-[#4A8C6F] text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {currentSummary ? (
        <div className="space-y-4">
          <div className="bg-[#FAFBFD] p-5 rounded-lg border border-[#E2E8EE] space-y-3">
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
              <div className="space-y-3">
                <textarea
                  rows={8}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full text-sm p-3 rounded-lg border border-[#7897A8] focus:ring-2 focus:ring-[#7897A8] outline-none"
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
                    className="btn-primary text-xs"
                  >
                    {saving ? 'Salvando...' : 'Salvar Revisão Auditada'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#26343B] whitespace-pre-line leading-relaxed">
                {currentSummary.summary}
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#71808A] text-center py-6">
          Nenhum resumo gerado. Clique em "Gerar Novo Resumo" para processar com IA.
        </p>
      )}
    </div>
  )
}
