'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EditProfileModalProps {
  client: any
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedClient: any) => void
}

export function EditProfileModal({ client, isOpen, onClose, onSuccess }: EditProfileModalProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: client.user.name,
    phone: client.user.phone || '',
    status: client.status,
    notes: client.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        onSuccess(data)
        router.refresh()
        onClose()
      } else {
        const err = await res.json()
        setError(err.error || 'Erro ao atualizar dados')
      }
    } catch (e) {
      setError('Erro de conexão ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#26343B]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-[#E2E8EE] flex justify-between items-center">
          <h3 className="font-bold text-[#26343B]">Editar Informações do Paciente</h3>
          <button onClick={onClose} className="text-[#71808A] hover:text-[#26343B]">✕</button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-[#FFF5F5] border border-[#FFD8D8] text-[#D94949] rounded-lg text-xs">
            {error}
          </div>
        )}

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#26343B]">Nome Completo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#26343B]">Telefone</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#26343B]">Status</label>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as any })}
              className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] bg-white"
            >
              <option value="ACTIVE">Ativo</option>
              <option value="PAUSED">Pausado</option>
              <option value="CLOSED">Alta</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#26343B]">Observações</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]"
            />
          </div>
        </div>
        <div className="p-5 bg-[#F6F8FA] border-t border-[#E2E8EE] flex justify-end space-x-3">
          <button onClick={onClose} className="btn-secondary text-xs">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-xs">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
