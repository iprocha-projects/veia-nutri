'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, ShieldCheck, Plus, AlertCircle, Loader2, X } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'

type Professional = {
  id: string
  professionalRegistration: string | null
  user: {
    name: string
    email: string
    avatarUrl: string | null
  }
  _count: {
    clients: number
  }
}

export function AdminClientView({
  professionals,
  totalClients,
  totalNutris,
}: {
  professionals: Professional[]
  totalClients: number
  totalNutris: number
}) {
  const router = useRouter()
  const toast = useToast()

  const [isNutriModalOpen, setIsNutriModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [nutriForm, setNutriForm] = useState({ name: '', email: '', professionalRegistration: '' })
  const [clientForm, setClientForm] = useState({ name: '', email: '', professionalId: '' })

  const handleCreateNutri = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutriForm),
      })

      if (res.ok) {
        toast.success('Nutricionista criada com sucesso!', `A conta de ${nutriForm.name} foi ativada.`)
        setNutriForm({ name: '', email: '', professionalRegistration: '' })
        setIsNutriModalOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        const msg = data.error || 'Erro ao criar nutricionista'
        setError(msg)
        toast.error('Não foi possível criar', msg)
      }
    } catch {
      const connMsg = 'Erro de conexão com o servidor'
      setError(connMsg)
      toast.error('Erro de conexão', connMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm),
      })

      if (res.ok) {
        toast.success('Paciente criado com sucesso!', `O paciente ${clientForm.name} foi cadastrado e vinculado.`)
        setClientForm({ name: '', email: '', professionalId: '' })
        setIsClientModalOpen(false)
        router.refresh()
      } else {
        const data = await res.json()
        const msg = data.error || 'Erro ao criar paciente'
        setError(msg)
        toast.error('Não foi possível cadastrar', msg)
      }
    } catch {
      const connMsg = 'Erro de conexão com o servidor'
      setError(connMsg)
      toast.error('Erro de conexão', connMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#26343B] tracking-tight">
            Visão Geral da Plataforma
          </h1>
          <p className="text-sm text-[#71808A] mt-1">
            Gestão Centralizada de Nutricionistas e Pacientes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setError('')
              setIsNutriModalOpen(true)
            }}
            className="btn-secondary text-xs flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Nutricionista</span>
          </button>
          <button
            onClick={() => {
              setError('')
              setIsClientModalOpen(true)
            }}
            className="btn-primary text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="card-clinical p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#71808A] uppercase tracking-wider">Total de Nutricionistas</span>
            <div className="text-3xl font-bold text-[#26343B] mt-2">{totalNutris}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F0F4F7] text-[#7897A8] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="card-clinical p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#71808A] uppercase tracking-wider">Total de Pacientes</span>
            <div className="text-3xl font-bold text-[#26343B] mt-2">{totalClients}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F0F8F5] text-[#4A8C6F] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Professionals List */}
      <div className="card-clinical overflow-hidden">
        <div className="p-5 border-b border-[#E2E8EE] flex justify-between items-center">
          <h2 className="font-bold text-base text-[#26343B]">Nutricionistas Cadastradas</h2>
          <span className="text-xs text-[#71808A]">{professionals.length} ativas</span>
        </div>

        <div className="divide-y divide-[#E2E8EE]">
          {professionals.length === 0 ? (
            <p className="p-8 text-center text-sm text-[#71808A]">Nenhum nutricionista cadastrado ainda.</p>
          ) : (
            professionals.map((prof) => (
              <div
                key={prof.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFBFD] transition-all"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={prof.user.avatarUrl || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'}
                    alt={prof.user.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#E2E8EE]"
                  />
                  <div>
                    <h3 className="font-semibold text-base text-[#26343B]">{prof.user.name}</h3>
                    <p className="text-xs text-[#71808A] mt-0.5">
                      {prof.user.email} • {prof.professionalRegistration || 'Sem CRN'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-[#F6F8FA] px-4 py-2 rounded-lg border border-[#E2E8EE]">
                  <Users className="w-4 h-4 text-[#7897A8]" />
                  <span className="text-sm font-bold text-[#26343B]">
                    {prof._count.clients} Paciente{prof._count.clients === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nutri Modal with smooth animations */}
      {isNutriModalOpen && (
        <div className="fixed inset-0 bg-[#26343B]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in transition-all">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-[#E2E8EE]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#26343B]">Nova Nutricionista</h3>
              <button
                onClick={() => setIsNutriModalOpen(false)}
                className="text-[#71808A] hover:text-[#26343B] p-1.5 rounded-lg hover:bg-[#F6F8FA] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 text-xs text-[#D94949] bg-[#FFF5F5] border border-[#FFD8D8] p-3 rounded-lg flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateNutri} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#26343B]">Nome Completo *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Dra. Larissa Souza"
                  value={nutriForm.name}
                  onChange={(e) => setNutriForm({ ...nutriForm, name: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#26343B]">E-mail de Acesso *</label>
                <input
                  required
                  type="email"
                  placeholder="nutri@exemplo.com"
                  value={nutriForm.email}
                  onChange={(e) => setNutriForm({ ...nutriForm, email: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#26343B]">Registro Profissional (CRN)</label>
                <input
                  type="text"
                  placeholder="Ex: CRN-3 12345"
                  value={nutriForm.professionalRegistration}
                  onChange={(e) => setNutriForm({ ...nutriForm, professionalRegistration: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                />
              </div>
              <p className="text-[11px] text-[#71808A] bg-[#F6F8FA] p-2.5 rounded-lg border border-[#E2E8EE]">
                ℹ️ A senha provisória inicial será <strong>123456</strong>. O sistema solicitará a troca no primeiro acesso.
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNutriModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs flex items-center space-x-2"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{loading ? 'Cadastrando...' : 'Cadastrar Nutricionista'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Modal with smooth animations */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-[#26343B]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in transition-all">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-[#E2E8EE]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-[#26343B]">Novo Paciente</h3>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="text-[#71808A] hover:text-[#26343B] p-1.5 rounded-lg hover:bg-[#F6F8FA] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 text-xs text-[#D94949] bg-[#FFF5F5] border border-[#FFD8D8] p-3 rounded-lg flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#26343B]">Vincular à Nutricionista: *</label>
                <select
                  required
                  value={clientForm.professionalId}
                  onChange={(e) => setClientForm({ ...clientForm, professionalId: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                >
                  <option value="">Selecione a nutricionista responsável...</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>{p.user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#26343B]">Nome Completo *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Carlos Eduardo"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#26343B]">E-mail do Paciente *</label>
                <input
                  required
                  type="email"
                  placeholder="paciente@exemplo.com"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                />
              </div>
              <p className="text-[11px] text-[#71808A] bg-[#F6F8FA] p-2.5 rounded-lg border border-[#E2E8EE]">
                ℹ️ A senha inicial do paciente será <strong>123456</strong>.
              </p>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs flex items-center space-x-2"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{loading ? 'Cadastrando...' : 'Cadastrar Paciente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
