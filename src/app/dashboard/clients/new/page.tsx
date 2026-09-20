'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, UserPlus, Save, AlertCircle, Loader2 } from 'lucide-react'
import { Header } from '@/components/Header'
import { useToast } from '@/components/ui/ToastContext'

export default function NewClientPage() {
  const router = useRouter()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Paciente cadastrado com sucesso!', `Prontuário criado para ${data.user?.name || formData.name}.`)
        router.push(`/dashboard/clients/${data.id}`)
      } else {
        const errData = await res.json()
        const errMsg = errData.error || 'Erro ao cadastrar paciente'
        setError(errMsg)
        toast.error('Erro no cadastro', errMsg)
      }
    } catch {
      const connErr = 'Erro de conexão com o servidor'
      setError(connErr)
      toast.error('Erro de conexão', connErr)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] animate-fade-in">
      <Header currentUser={{ name: 'Nutricionista', role: 'NUTRITIONIST' }} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#71808A] hover:text-[#26343B] flex items-center space-x-1 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>

        <div className="card-clinical p-8 space-y-8 animate-scale-in">
          <div className="flex items-center space-x-3 border-b border-[#E2E8EE] pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#F0F4F7] text-[#7897A8] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#26343B]">Novo Paciente</h1>
              <p className="text-xs text-[#71808A]">Cadastre as informações básicas para iniciar o acompanhamento contínuo.</p>
            </div>
          </div>

          {error && (
            <div className="bg-[#FFF5F5] border border-[#FFD8D8] text-[#D94949] p-3.5 rounded-lg text-xs flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#26343B]">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#26343B]">E-mail *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-sm p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                  placeholder="paciente@exemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#26343B]">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-sm p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#26343B]">Data de Nascimento</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full text-sm p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#26343B]">Objetivo Clínico / Observações Iniciais</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-sm p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                placeholder="Ex: Paciente busca hipertrofia, intolerante à lactose..."
              />
            </div>

            <div className="pt-4 border-t border-[#E2E8EE] flex justify-end space-x-3">
              <Link
                href="/dashboard"
                className="btn-secondary text-xs flex items-center space-x-1"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-xs flex items-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{loading ? 'Cadastrando...' : 'Cadastrar Paciente'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
