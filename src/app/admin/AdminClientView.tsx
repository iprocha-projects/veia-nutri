'use client'

import { useState } from 'react'
import { Users, ShieldCheck, Plus, AlertCircle, Loader2 } from 'lucide-react'

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

export function AdminClientView({ professionals, totalClients, totalNutris }: { professionals: Professional[], totalClients: number, totalNutris: number }) {
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
 window.location.reload()
 } else {
 const data = await res.json()
 setError(data.error || 'Erro ao criar nutricionista')
 }
 } catch (err) {
 setError('Erro de conexão')
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
 window.location.reload()
 } else {
 const data = await res.json()
 setError(data.error || 'Erro ao criar paciente')
 }
 } catch (err) {
 setError('Erro de conexão')
 } finally {
 setLoading(false)
 }
 }

 return (
 <>
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <h1 className="text-2xl font-bold text-[#26343B] tracking-tight">
 Visão Geral da Plataforma
 </h1>
 <p className="text-sm text-[#71808A] mt-1">
 Gestão de Contas (Multi-Tenant)
 </p>
 </div>
 <div className="flex items-center space-x-3">
 <button onClick={() => setIsNutriModalOpen(true)} className="btn-secondary text-xs flex items-center space-x-1">
 <Plus className="w-4 h-4" />
 <span>Criar Nutricionista</span>
 </button>
 <button onClick={() => setIsClientModalOpen(true)} className="btn-primary text-xs flex items-center space-x-1">
 <Plus className="w-4 h-4" />
 <span>Criar Paciente</span>
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
 <div className="card-clinical p-6">
 <div className="flex items-center justify-between mb-4">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#71808A]">Nutricionistas (Tenants)</span>
 <div className="w-10 h-10 rounded-lg bg-[#F0F4F7] text-[#7897A8] flex items-center justify-center">
 <ShieldCheck className="w-5 h-5" />
 </div>
 </div>
 <span className="text-4xl font-bold text-[#26343B]">{totalNutris}</span>
 </div>

 <div className="card-clinical p-6">
 <div className="flex items-center justify-between mb-4">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#71808A]">Pacientes Ativos</span>
 <div className="w-10 h-10 rounded-lg bg-[#F0F8F5] text-[#4A8C6F] flex items-center justify-center">
 <Users className="w-5 h-5" />
 </div>
 </div>
 <span className="text-4xl font-bold text-[#26343B]">{totalClients}</span>
 </div>
 </div>

 <div className="card-clinical overflow-hidden">
 <div className="p-5 border-b border-[#E2E8EE]">
 <h2 className="text-lg font-bold text-[#26343B]">Nutricionistas Cadastrados</h2>
 </div>
 
 <div className="divide-y divide-[#E2E8EE]">
 {professionals.length === 0 ? (
 <p className="p-8 text-center text-sm text-[#71808A]">Nenhum nutricionista cadastrado.</p>
 ) : (
 professionals.map((prof) => (
 <div key={prof.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFBFD] transition">
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
 {prof._count.clients} Pacientes
 </span>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Nutri Modal */}
 {isNutriModalOpen && (
 <div className="fixed inset-0 bg-[#26343B]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg w-full max-w-md p-6">
 <h3 className="font-bold text-lg text-[#26343B] mb-4">Nova Nutricionista</h3>
 {error && <div className="mb-4 text-xs text-[#D94949] bg-[#FFF5F5] p-2 rounded">{error}</div>}
 <form onSubmit={handleCreateNutri} className="space-y-4">
 <div>
 <label className="text-xs font-semibold text-[#26343B]">Nome</label>
 <input required type="text" value={nutriForm.name} onChange={e => setNutriForm({...nutriForm, name: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#26343B]">E-mail</label>
 <input required type="email" value={nutriForm.email} onChange={e => setNutriForm({...nutriForm, email: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#26343B]">CRN (Opcional)</label>
 <input type="text" value={nutriForm.professionalRegistration} onChange={e => setNutriForm({...nutriForm, professionalRegistration: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]" />
 </div>
 <p className="text-xs text-[#71808A]">A senha padrão será 123456</p>
 <div className="flex justify-end space-x-3 pt-4">
 <button type="button" onClick={() => setIsNutriModalOpen(false)} className="btn-secondary text-xs">Cancelar</button>
 <button type="submit" disabled={loading} className="btn-primary text-xs">{loading ? 'Salvando...' : 'Criar'}</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Client Modal */}
 {isClientModalOpen && (
 <div className="fixed inset-0 bg-[#26343B]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg w-full max-w-md p-6">
 <h3 className="font-bold text-lg text-[#26343B] mb-4">Novo Paciente</h3>
 {error && <div className="mb-4 text-xs text-[#D94949] bg-[#FFF5F5] p-2 rounded">{error}</div>}
 <form onSubmit={handleCreateClient} className="space-y-4">
 <div>
 <label className="text-xs font-semibold text-[#26343B]">Vincular à Nutricionista:</label>
 <select required value={clientForm.professionalId} onChange={e => setClientForm({...clientForm, professionalId: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] bg-white">
 <option value="">Selecione...</option>
 {professionals.map(p => (
 <option key={p.id} value={p.id}>{p.user.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="text-xs font-semibold text-[#26343B]">Nome</label>
 <input required type="text" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]" />
 </div>
 <div>
 <label className="text-xs font-semibold text-[#26343B]">E-mail</label>
 <input required type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]" />
 </div>
 <p className="text-xs text-[#71808A]">A senha padrão será 123456</p>
 <div className="flex justify-end space-x-3 pt-4">
 <button type="button" onClick={() => setIsClientModalOpen(false)} className="btn-secondary text-xs">Cancelar</button>
 <button type="submit" disabled={loading} className="btn-primary text-xs">{loading ? 'Salvando...' : 'Criar'}</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </>
 )
}
