'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
 Calendar,
 Sparkles,
 FileText,
 Activity,
 CheckCircle,
 Plus,
 Send,
 Trash2,
 Edit,
 Clock,
 User,
 Utensils,
 TrendingDown,
 Camera,
 AlertCircle,
 ChevronLeft,
 Share2,
} from 'lucide-react'
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
} from 'recharts'

export function ClientProfileClient({ client }: { client: any }) {
 const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'logs' | 'evolution' | 'checkins' | 'summary'>('overview')
 const [summaryLoading, setSummaryLoading] = useState(false)
 const [currentSummary, setCurrentSummary] = useState<any>(client.aiSummaries[0] || null)
 const [editedSummaryText, setEditedSummaryText] = useState('')
 const [isEditingSummary, setIsEditingSummary] = useState(false)
 const [savingSummary, setSavingSummary] = useState(false)

 // Profile Edit State
 const [isEditingProfile, setIsEditingProfile] = useState(false)
 const [editProfileForm, setEditProfileForm] = useState({
 name: client.user.name,
 phone: client.user.phone || '',
 status: client.status,
 notes: client.notes || '',
 })
 const [savingProfile, setSavingProfile] = useState(false)

 const activePlan = client.mealPlans?.find((p: any) => p.status === 'PUBLISHED') || client.mealPlans?.[0]

 // Meal Plan Form State
 const [planTitle, setPlanTitle] = useState(activePlan?.title || 'Plano Alimentar Personalizado')
 
 const initialMeals = activePlan?.meals?.length > 0 
 ? activePlan.meals.map((m: any) => ({
 name: m.name,
 time: m.time,
 instructions: m.instructions || '',
 items: m.items.map((i: any) => ({ foodName: i.foodName, quantity: i.quantity, unit: i.unit, notes: i.notes || '' }))
 }))
 : [
 {
 name: 'Café da Manhã',
 time: '08:00',
 instructions: '',
 items: [{ foodName: 'Ex: Aveia', quantity: '30', unit: 'g', notes: '' }],
 }
 ]
 
 const [meals, setMeals] = useState(initialMeals)

 const [savingPlan, setSavingPlan] = useState(false)

 const handleSaveProfile = async () => {
 setSavingProfile(true)
 try {
 const res = await fetch(`/api/clients/${client.id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(editProfileForm),
 })
 if (res.ok) {
 window.location.reload()
 }
 } catch (e) {
 console.error(e)
 } finally {
 setSavingProfile(false)
 }
 }

 // Handlers for Meal Plan builder
 const addMeal = () => {
 setMeals([
 ...meals,
 { name: 'Lanche', time: '16:00', instructions: '', items: [{ foodName: '', quantity: '1', unit: 'porção', notes: '' }] },
 ])
 }

 const addMealItem = (mealIndex: number) => {
 const updated = [...meals]
 updated[mealIndex].items.push({ foodName: '', quantity: '1', unit: 'g', notes: '' })
 setMeals(updated)
 }

 const handleSavePlan = async (publish: boolean) => {
 setSavingPlan(true)
 try {
 const res = await fetch('/api/meal-plans', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 clientId: client.id,
 title: planTitle,
 meals,
 publish,
 }),
 })
 if (res.ok) {
 alert(publish ? 'Plano publicado com sucesso!' : 'Rascunho salvo com sucesso!')
 window.location.reload()
 }
 } catch (e) {
 console.error(e)
 } finally {
 setSavingPlan(false)
 }
 }

 // Handle AI Summary Generation
 const handleGenerateAISummary = async () => {
 setSummaryLoading(true)
 try {
 const res = await fetch('/api/ai-summary', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ clientId: client.id }),
 })
 if (res.ok) {
 const data = await res.json()
 setCurrentSummary(data)
 setEditedSummaryText(data.summary)
 }
 } catch (e) {
 console.error(e)
 } finally {
 setSummaryLoading(false)
 }
 }

 const handleSaveSummaryEdit = async () => {
 if (!currentSummary) return
 setSavingSummary(true)
 try {
 const res = await fetch('/api/ai-summary', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 summaryId: currentSummary.id,
 updatedSummary: editedSummaryText,
 }),
 })
 if (res.ok) {
 const updated = await res.json()
 setCurrentSummary(updated)
 setIsEditingSummary(false)
 alert('Resumo atualizado e salvo no histórico auditado!')
 }
 } catch (e) {
 console.error(e)
 } finally {
 setSavingSummary(false)
 }
 }

 // Prepare Chart Data
 const chartData = client.measurements.map((m: any) => ({
 date: new Date(m.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
 peso: m.weightKg,
 cintura: m.waistCm,
 }))

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
 {/* Back Link & Header info */}
 <div className="flex items-center justify-between">
 <Link
 href="/dashboard"
 className="text-xs font-semibold text-[#71808A] hover:text-[#26343B] flex items-center space-x-1"
 >
 <ChevronLeft className="w-4 h-4" />
 <span>Voltar ao Dashboard</span>
 </Link>
 </div>

 {/* Patient Profile Card */}
 <div className="card-clinical p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="flex items-center space-x-5">
 <img
 src={client.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
 alt={client.user.name}
 className="w-16 h-16 rounded-lg object-cover border-2 border-[#E2E8EE]"
 />
 <div>
 <div className="flex items-center space-x-3">
 <h1 className="text-xl font-bold text-[#26343B]">{client.user.name}</h1>
 <span className={client.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}>
 {client.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
 </span>
 </div>
 <p className="text-xs text-[#71808A] mt-1">
 E-mail: {client.user.email} • Tel: {client.user.phone || 'Não informado'} • Nasc:{' '}
 {client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR') : 'N/I'}
 </p>
 {client.notes && (
 <p className="text-xs text-[#26343B] bg-[#F6F8FA] px-3 py-1.5 rounded-lg border border-[#E2E8EE] mt-2 italic">
 "{client.notes}"
 </p>
 )}
 </div>
 </div>

 <div className="flex items-center space-x-3 border-t md:border-t-0 pt-4 md:pt-0 border-[#E2E8EE]">
 <button
 onClick={() => setIsEditingProfile(true)}
 className="btn-secondary flex items-center space-x-2 text-xs"
 >
 <Edit className="w-4 h-4" />
 <span>Editar</span>
 </button>
 <button
 onClick={handleGenerateAISummary}
 disabled={summaryLoading}
 className="btn-primary flex items-center space-x-2 text-xs"
 >
 <Sparkles className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
 <span>{summaryLoading ? 'Gerando...' : 'Resumo Semanal IA'}</span>
 </button>
 </div>
 </div>

 {/* Edit Profile Modal */}
 {isEditingProfile && (
 <div className="fixed inset-0 bg-[#26343B]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
 <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
 <div className="p-5 border-b border-[#E2E8EE] flex justify-between items-center">
 <h3 className="font-bold text-[#26343B]">Editar Informações do Paciente</h3>
 <button onClick={() => setIsEditingProfile(false)} className="text-[#71808A] hover:text-[#26343B]">✕</button>
 </div>
 <div className="p-5 space-y-4">
 <div className="space-y-1">
 <label className="text-xs font-semibold text-[#26343B]">Nome Completo</label>
 <input type="text" value={editProfileForm.name} onChange={e => setEditProfileForm({...editProfileForm, name: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]" />
 </div>
 <div className="space-y-1">
 <label className="text-xs font-semibold text-[#26343B]">Telefone</label>
 <input type="text" value={editProfileForm.phone} onChange={e => setEditProfileForm({...editProfileForm, phone: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]" />
 </div>
 <div className="space-y-1">
 <label className="text-xs font-semibold text-[#26343B]">Status</label>
 <select value={editProfileForm.status} onChange={e => setEditProfileForm({...editProfileForm, status: e.target.value as any})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] bg-white">
 <option value="ACTIVE">Ativo</option>
 <option value="PAUSED">Pausado</option>
 <option value="CLOSED">Alta</option>
 </select>
 </div>
 <div className="space-y-1">
 <label className="text-xs font-semibold text-[#26343B]">Observações</label>
 <textarea rows={3} value={editProfileForm.notes} onChange={e => setEditProfileForm({...editProfileForm, notes: e.target.value})} className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE]" />
 </div>
 </div>
 <div className="p-5 bg-[#F6F8FA] border-t border-[#E2E8EE] flex justify-end space-x-3">
 <button onClick={() => setIsEditingProfile(false)} className="btn-secondary text-xs">Cancelar</button>
 <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary text-xs">{savingProfile ? 'Salvando...' : 'Salvar Alterações'}</button>
 </div>
 </div>
 </div>
 )}

 {/* Tab Navigation */}
 <div className="flex space-x-1 border-b border-[#E2E8EE] overflow-x-auto pb-1">
 {[
 { id: 'overview', label: 'Visão Geral & Timeline', icon: Activity },
 { id: 'plan', label: 'Plano Alimentar', icon: Utensils },
 { id: 'logs', label: 'Registros de Refeições', icon: Camera },
 { id: 'evolution', label: 'Evolução & Fotos', icon: TrendingDown },
 { id: 'checkins', label: 'Check-ins', icon: Calendar },
 { id: 'summary', label: 'Resumo IA Auditado', icon: Sparkles },
 ].map((tab) => {
 const Icon = tab.icon
 const isActive = activeTab === tab.id
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap ${
 isActive
 ? 'border-[#7897A8] text-[#7897A8] bg-white'
 : 'border-transparent text-[#71808A] hover:text-[#26343B]'
 }`}
 >
 <Icon className="w-4 h-4" />
 <span>{tab.label}</span>
 </button>
 )}
 )}
 </div>

 {/* TAB CONTENT 1: OVERVIEW */}
 {activeTab === 'overview' && (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Recent Summary Highlight */}
 <div className="lg:col-span-2 space-y-6">
 <div className="card-clinical p-5 space-y-4">
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-base text-[#26343B] flex items-center space-x-2">
 <Sparkles className="w-5 h-5 text-[#7897A8]" />
 <span>Último Resumo da Semana (IA)</span>
 </h3>
 {currentSummary && (
 <span className="text-xs text-[#71808A]">
 Modelo: {currentSummary.model} • {new Date(currentSummary.createdAt).toLocaleDateString('pt-BR')}
 </span>
 )}
 </div>

 {currentSummary ? (
 <div className="bg-[#F6F8FA] p-4 rounded-lg border border-[#E2E8EE] text-sm text-[#26343B] whitespace-pre-line leading-relaxed">
 {currentSummary.summary}
 </div>
 ) : (
 <div className="text-center py-8 text-[#71808A] text-xs">
 Nenhum resumo gerado nesta semana. Clique no botão acima para consolidar com IA!
 </div>
 )}
 </div>

 {/* Timeline of patient activity */}
 <div className="card-clinical p-5 space-y-4">
 <h3 className="font-bold text-base text-[#26343B]">Linha do Tempo de Acompanhamento</h3>
 <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E2E8EE]">
 {client.mealLogs.slice(0, 5).map((log: any) => (
 <div key={log.id} className="relative pl-8 flex flex-col space-y-1">
 <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-[#7897A8] text-white text-[10px] flex items-center justify-center font-bold">
 ✓
 </div>
 <div className="flex items-center justify-between text-xs text-[#71808A]">
 <span className="font-semibold text-[#26343B]">
 Registro de Refeição: {log.meal?.name || 'Refeição'}
 </span>
 <span>{new Date(log.loggedAt).toLocaleString('pt-BR')}</span>
 </div>
 {log.notes && <p className="text-xs text-[#26343B]">"{log.notes}"</p>}
 {log.photoUrl && (
 <img
 src={log.photoUrl}
 alt="Foto da refeição"
 className="w-24 h-24 rounded-lg object-cover border border-[#E2E8EE] mt-1"
 />
 )}
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Quick Metrics & Current Plan Summary */}
 <div className="space-y-6">
 <div className="card-clinical p-5 space-y-3">
 <h3 className="font-bold text-sm text-[#26343B]">Métricas de Evolução</h3>
 <div className="divide-y divide-[#E2E8EE]">
 <div className="py-2 flex justify-between text-xs">
 <span className="text-[#71808A]">Último Peso:</span>
 <span className="font-bold text-[#26343B]">
 {client.measurements[client.measurements.length - 1]?.weightKg || 'N/I'} kg
 </span>
 </div>
 <div className="py-2 flex justify-between text-xs">
 <span className="text-[#71808A]">Variação de Peso:</span>
 <span className="font-bold text-[#4A8C6F]">
 {client.measurements.length > 1
 ? `${(
 client.measurements[client.measurements.length - 1].weightKg -
 client.measurements[0].weightKg
 ).toFixed(1)} kg`
 : 'Sem histórico'}
 </span>
 </div>
 <div className="py-2 flex justify-between text-xs">
 <span className="text-[#71808A]">Última Cintura:</span>
 <span className="font-bold text-[#26343B]">
 {client.measurements[client.measurements.length - 1]?.waistCm || 'N/I'} cm
 </span>
 </div>
 </div>
 </div>

 {/* Current Active Plan Card */}
 <div className="card-clinical p-5 space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-sm text-[#26343B]">Plano Alimentar Vigente</h3>
 <span className="badge-active">Publicado v{activePlan?.version || 1}</span>
 </div>
 <p className="text-xs font-medium text-[#26343B]">{activePlan?.title || 'Sem plano'}</p>
 <div className="text-xs text-[#71808A] space-y-1">
 {activePlan?.meals?.map((m: any) => (
 <div key={m.id} className="flex justify-between py-1 border-b border-[#F6F8FA]">
 <span>{m.name} ({m.time})</span>
 <span className="text-[#26343B] font-medium">{m.items.length} itens</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAB CONTENT 2: MEAL PLAN BUILDER */}
 {activeTab === 'plan' && (
 <div className="space-y-6">
 <div className="card-clinical p-6 space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h2 className="text-lg font-bold text-[#26343B]">Criar / Editar Plano Alimentar</h2>
 <p className="text-xs text-[#71808A]">
 As alterações publicadas geram uma nova versão visível imediatamente para o paciente.
 </p>
 </div>

 <div className="flex items-center space-x-3">
 <button
 onClick={() => handleSavePlan(false)}
 disabled={savingPlan}
 className="btn-secondary text-xs"
 >
 Salvar Rascunho
 </button>
 <button
 onClick={() => handleSavePlan(true)}
 disabled={savingPlan}
 className="btn-primary text-xs flex items-center space-x-1.5"
 >
 <Send className="w-3.5 h-3.5" />
 <span>Publicar Nova Versão</span>
 </button>
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-semibold text-[#26343B] mb-1">Título do Plano</label>
 <input
 type="text"
 value={planTitle}
 onChange={(e) => setPlanTitle(e.target.value)}
 className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none"
 />
 </div>

 {/* Meals List Builder */}
 <div className="space-y-4">
 <label className="block text-xs font-semibold text-[#26343B]">Refeições e Horários</label>
 {meals.map((meal: any, mIdx: number) => (
 <div key={mIdx} className="p-4 rounded-lg border border-[#E2E8EE] bg-[#F6F8FA] space-y-3">
 <div className="flex items-center space-x-3">
 <input
 type="text"
 placeholder="Nome da refeição (ex: Café da Manhã)"
 value={meal.name}
 onChange={(e) => {
 const copy = [...meals]
 copy[mIdx].name = e.target.value
 setMeals(copy)
 }}
 className="flex-1 text-sm font-bold p-2 rounded-lg border border-[#E2E8EE]"
 />
 <input
 type="text"
 placeholder="Horário (ex: 08:00)"
 value={meal.time}
 onChange={(e) => {
 const copy = [...meals]
 copy[mIdx].time = e.target.value
 setMeals(copy)
 }}
 className="w-24 text-sm p-2 rounded-lg border border-[#E2E8EE] text-center"
 />
 </div>

 {/* Items */}
 <div className="space-y-2 pl-2">
 {meal.items.map((item: any, iIdx: number) => (
 <div key={iIdx} className="flex items-center space-x-2">
 <input
 type="text"
 placeholder="Alimento (ex: Ovos mexidos)"
 value={item.foodName}
 onChange={(e) => {
 const copy = [...meals]
 copy[mIdx].items[iIdx].foodName = e.target.value
 setMeals(copy)
 }}
 className="flex-1 text-xs p-2 rounded-lg border border-[#E2E8EE]"
 />
 <input
 type="text"
 placeholder="Qtd"
 value={item.quantity}
 onChange={(e) => {
 const copy = [...meals]
 copy[mIdx].items[iIdx].quantity = e.target.value
 setMeals(copy)
 }}
 className="w-16 text-xs p-2 rounded-lg border border-[#E2E8EE]"
 />
 <input
 type="text"
 placeholder="Unid (ex: g, unid)"
 value={item.unit}
 onChange={(e) => {
 const copy = [...meals]
 copy[mIdx].items[iIdx].unit = e.target.value
 setMeals(copy)
 }}
 className="w-20 text-xs p-2 rounded-lg border border-[#E2E8EE]"
 />
 </div>
 ))}
 <button
 onClick={() => addMealItem(mIdx)}
 className="text-xs font-semibold text-[#7897A8] hover:underline flex items-center space-x-1 pt-1"
 >
 <Plus className="w-3 h-3" />
 <span>Adicionar Alimento</span>
 </button>
 </div>
 </div>
 ))}

 <button
 onClick={addMeal}
 className="btn-secondary text-xs flex items-center space-x-1 w-full justify-center py-2.5"
 >
 <Plus className="w-4 h-4" />
 <span>Adicionar Nova Refeição ao Plano</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* TAB CONTENT 3: MEAL LOGS */}
 {activeTab === 'logs' && (
 <div className="card-clinical p-6 space-y-4">
 <h2 className="text-lg font-bold text-[#26343B]">Registros de Refeições Enviados</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {client.mealLogs.length === 0 ? (
 <p className="text-xs text-[#71808A] col-span-3 text-center py-8">
 Nenhum registro de refeição enviado até o momento.
 </p>
 ) : (
 client.mealLogs.map((log: any) => (
 <div key={log.id} className="card-clinical p-4 space-y-3">
 {log.photoUrl && (
 <img
 src={log.photoUrl}
 alt="Refeição"
 className="w-full h-44 rounded-lg object-cover border border-[#E2E8EE]"
 />
 )}
 <div>
 <div className="flex justify-between items-center text-xs text-[#71808A]">
 <span className="font-bold text-[#26343B]">{log.meal?.name || 'Refeição Registrada'}</span>
 <span>{new Date(log.loggedAt).toLocaleDateString('pt-BR')}</span>
 </div>
 {log.notes && <p className="text-xs text-[#26343B] mt-2 italic">"{log.notes}"</p>}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )}

 {/* TAB CONTENT 4: EVOLUTION CHARTS & PHOTOS */}
 {activeTab === 'evolution' && (
 <div className="space-y-6">
 <div className="card-clinical p-6 space-y-4">
 <h2 className="text-lg font-bold text-[#26343B]">Evolução do Peso (kg) e Cintura (cm)</h2>
 <div className="h-72 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#E2E8EE" />
 <XAxis dataKey="date" stroke="#71808A" fontSize={12} />
 <YAxis stroke="#71808A" fontSize={12} />
 <Tooltip />
 <Line type="monotone" dataKey="peso" stroke="#7897A8" strokeWidth={3} name="Peso (kg)" />
 <Line type="monotone" dataKey="cintura" stroke="#B8C9C1" strokeWidth={3} name="Cintura (cm)" />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Progress Photos Gallery */}
 <div className="card-clinical p-6 space-y-4">
 <h2 className="text-lg font-bold text-[#26343B]">Galeria de Fotos de Evolução (Antes / Depois)</h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
 {client.progressPhotos.length === 0 ? (
 <p className="text-xs text-[#71808A] col-span-3 text-center py-6">
 Nenhuma foto de evolução cadastrada ainda.
 </p>
 ) : (
 client.progressPhotos.map((photo: any) => (
 <div key={photo.id} className="card-clinical p-3 space-y-2">
 <img
 src={photo.photoUrl}
 alt="Evolução"
 className="w-full h-56 rounded-lg object-cover border border-[#E2E8EE]"
 />
 <div className="flex justify-between text-xs text-[#71808A]">
 <span className="capitalize font-semibold text-[#26343B]">Visão: {photo.category}</span>
 <span>{new Date(photo.takenAt).toLocaleDateString('pt-BR')}</span>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 )}

 {/* TAB CONTENT 5: CHECKINS */}
 {activeTab === 'checkins' && (
 <div className="card-clinical p-6 space-y-4">
 <h2 className="text-lg font-bold text-[#26343B]">Histórico de Check-ins do Paciente</h2>
 <div className="space-y-3">
 {client.checkins.length === 0 ? (
 <p className="text-xs text-[#71808A] text-center py-6">Nenhum check-in enviado.</p>
 ) : (
 client.checkins.map((chk: any) => (
 <div key={chk.id} className="card-clinical p-4 flex flex-col md:flex-row justify-between gap-4">
 <div className="space-y-1">
 <span className="text-xs font-semibold text-[#71808A]">
 Enviado em: {new Date(chk.submittedAt).toLocaleString('pt-BR')}
 </span>
 {chk.notes && <p className="text-sm font-medium text-[#26343B]">"{chk.notes}"</p>}
 </div>
 <div className="flex space-x-4 text-xs">
 <div className="bg-[#F6F8FA] p-2.5 rounded-lg border border-[#E2E8EE]">
 <span className="text-[#71808A] block">Fome</span>
 <strong className="text-sm text-[#26343B]">{chk.hungerScore}/5</strong>
 </div>
 <div className="bg-[#F6F8FA] p-2.5 rounded-lg border border-[#E2E8EE]">
 <span className="text-[#71808A] block">Energia</span>
 <strong className="text-sm text-[#26343B]">{chk.energyScore}/5</strong>
 </div>
 <div className="bg-[#F6F8FA] p-2.5 rounded-lg border border-[#E2E8EE]">
 <span className="text-[#71808A] block">Dificuldade</span>
 <strong className="text-sm text-[#D94949]">{chk.difficultyScore}/5</strong>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )}

 {/* TAB CONTENT 6: AI SUMMARY AUDITED */}
 {activeTab === 'summary' && (
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
 onClick={handleGenerateAISummary}
 disabled={summaryLoading}
 className="btn-primary flex items-center space-x-2 text-xs"
 >
 <Sparkles className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
 <span>{summaryLoading ? 'Processando...' : 'Gerar Novo Resumo'}</span>
 </button>
 </div>

 {currentSummary ? (
 <div className="space-y-4">
 <div className="bg-[#FAFBFD] p-5 rounded-lg border border-[#E2E8EE] space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-[#7897A8]">
 ID de Auditoria: {currentSummary.id} • Modelo: {currentSummary.model}
 </span>
 {!isEditingSummary && (
 <button
 onClick={() => {
 setEditedSummaryText(currentSummary.summary)
 setIsEditingSummary(true)
 }}
 className="text-xs text-[#7897A8] font-semibold hover:underline flex items-center space-x-1"
 >
 <Edit className="w-3.5 h-3.5" />
 <span>Revisar / Editar Texto</span>
 </button>
 )}
 </div>

 {isEditingSummary ? (
 <div className="space-y-3">
 <textarea
 rows={8}
 value={editedSummaryText}
 onChange={(e) => setEditedSummaryText(e.target.value)}
 className="w-full text-sm p-3 rounded-lg border border-[#7897A8] focus:ring-2 focus:ring-[#7897A8] outline-none"
 />
 <div className="flex justify-end space-x-2">
 <button
 onClick={() => setIsEditingSummary(false)}
 className="btn-secondary text-xs"
 >
 Cancelar
 </button>
 <button
 onClick={handleSaveSummaryEdit}
 disabled={savingSummary}
 className="btn-primary text-xs"
 >
 Salvar Revisão Auditada
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
 )}
 </div>
 )
}
