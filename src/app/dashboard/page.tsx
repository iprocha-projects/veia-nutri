import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/Header'
import Link from 'next/link'
import { Users, AlertCircle, Clock, CheckCircle2, ChevronRight, FileText, Activity, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
 const session = await getSession()

 if (!session || session.role !== 'NUTRITIONIST') {
 return <div>Acesso negado.</div>
 }

 // Fetch all clients for the active professional
 const professional = await prisma.professional.findUnique({
 where: { id: session.professionalId },
 include: {
 user: true,
 clients: {
 include: {
 user: true,
 mealPlans: { orderBy: { createdAt: 'desc' }, take: 1 },
 measurements: { orderBy: { measuredAt: 'desc' }, take: 1 },
 checkins: { orderBy: { submittedAt: 'desc' }, take: 1 },
 mealLogs: { orderBy: { loggedAt: 'desc' }, take: 1 },
 },
 orderBy: { createdAt: 'desc' },
 },
 },
 })

 const clients = (professional?.clients || []) as any[]

 // Metrics Calculations
 const activeClients = clients.filter((c: any) => c.status === 'ACTIVE')
 
 const now = new Date()
 const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
 const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)

 // Clients without recent meal log (>3 days)
 const noRecentLogs = activeClients.filter((c: any) => {
 const lastLog = c.mealLogs[0]
 return !lastLog || new Date(lastLog.loggedAt) < threeDaysAgo
 })

 // Clients with pending checkin (>5 days since last checkin or checkin rating showing difficulty)
 const pendingCheckins = activeClients.filter((c: any) => {
 const lastCheckin = c.checkins[0]
 return !lastCheckin || new Date(lastCheckin.submittedAt) < fiveDaysAgo
 })

 // Recent activity (logs/checkins in last 24h)
 const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
 const recentUpdates = activeClients.filter((c: any) => {
 const lastLog = c.mealLogs[0]
 const lastCheckin = c.checkins[0]
 return (
 (lastLog && new Date(lastLog.loggedAt) >= oneDayAgo) ||
 (lastCheckin && new Date(lastCheckin.submittedAt) >= oneDayAgo)
 )
 })

 // Smart "Attention Needed" List: High difficulty, inactive log, or pending check-in
 const attentionList = activeClients.filter((c: any) => {
 const lastCheckin = c.checkins[0]
 const lastLog = c.mealLogs[0]
 const highDifficulty = lastCheckin && lastCheckin.difficultyScore >= 4
 const noLog = !lastLog || new Date(lastLog.loggedAt) < threeDaysAgo
 return highDifficulty || noLog
 })

 return (
 <div className="min-h-screen bg-[#F6F8FA]">
 <Header currentUser={professional?.user as any} />

 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
 {/* Top Header & Greeting */}
 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-[#26343B] tracking-tight">
 Olá, {session.name} 👋
 </h1>
 <p className="text-sm text-[#71808A] mt-1">
 Sua consulta termina. O acompanhamento continua. Aqui está o resumo de hoje dos seus pacientes.
 </p>
 </div>

 <div className="flex items-center space-x-3">
 <Link
 href="/dashboard/clients/new"
 className="btn-primary flex items-center space-x-2 text-sm"
 >
 <Plus className="w-4 h-4" />
 <span>Novo Paciente</span>
 </Link>
 </div>
 </div>

 {/* 4 Cards Section */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
 {/* Card 1: Active Clients */}
 <div className="card-clinical p-5">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#71808A]">Clientes Ativos</span>
 <div className="w-9 h-9 rounded-lg bg-[#F0F4F7] text-[#7897A8] flex items-center justify-center">
 <Users className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-3 flex items-baseline justify-between">
 <span className="text-3xl font-bold text-[#26343B]">{activeClients.length}</span>
 <span className="text-xs text-[#71808A]">Em acompanhamento</span>
 </div>
 </div>

 {/* Card 2: Sem Registro Recente */}
 <div className="card-clinical p-5">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#71808A]">Sem Registro (+3d)</span>
 <div className="w-9 h-9 rounded-lg bg-[#FFF5F5] text-[#D94949] flex items-center justify-center">
 <Clock className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-3 flex items-baseline justify-between">
 <span className="text-3xl font-bold text-[#26343B]">{noRecentLogs.length}</span>
 <span className="text-xs text-[#D94949] font-medium">Requer lembrete</span>
 </div>
 </div>

 {/* Card 3: Check-in Pendente */}
 <div className="card-clinical p-5">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#71808A]">Check-in Pendente</span>
 <div className="w-9 h-9 rounded-lg bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
 <AlertCircle className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-3 flex items-baseline justify-between">
 <span className="text-3xl font-bold text-[#26343B]">{pendingCheckins.length}</span>
 <span className="text-xs text-[#D97706] font-medium">Aguardando envio</span>
 </div>
 </div>

 {/* Card 4: Atualização Recente */}
 <div className="card-clinical p-5">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold uppercase tracking-wider text-[#71808A]">Atualização Recente</span>
 <div className="w-9 h-9 rounded-lg bg-[#F0F8F5] text-[#4A8C6F] flex items-center justify-center">
 <CheckCircle2 className="w-5 h-5" />
 </div>
 </div>
 <div className="mt-3 flex items-baseline justify-between">
 <span className="text-3xl font-bold text-[#26343B]">{recentUpdates.length}</span>
 <span className="text-xs text-[#4A8C6F] font-medium">Nas últimas 24h</span>
 </div>
 </div>
 </div>

 {/* Main Grid: Attention Needed + All Clients List */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Attention Needed Column (1 col) */}
 <div className="lg:col-span-1 space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-[#26343B] flex items-center space-x-2">
 <AlertCircle className="w-5 h-5 text-[#D94949]" />
 <span>Precisa da Sua Atenção</span>
 </h2>
 <span className="badge-attention">{attentionList.length} Pacientes</span>
 </div>

 <div className="space-y-3">
 {attentionList.length === 0 ? (
 <div className="card-clinical p-6 text-center text-[#71808A] text-sm">
 Nenhum paciente necessitando atenção imediata no momento! 🎉
 </div>
 ) : (
 attentionList.map((client: any) => {
 const lastLog = client.mealLogs[0]
 const lastCheckin = client.checkins[0]
 const highDifficulty = lastCheckin && lastCheckin.difficultyScore >= 4

 return (
 <div key={client.id} className="card-clinical p-4 space-y-3 border-l-4 border-l-[#D94949]">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <img
 src={client.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
 alt={client.user.name}
 className="w-10 h-10 rounded-full object-cover border border-[#E2E8EE]"
 />
 <div>
 <h3 className="font-semibold text-sm text-[#26343B]">{client.user.name}</h3>
 <span className="text-xs text-[#71808A]">
 Último registro:{' '}
 {lastLog ? new Date(lastLog.loggedAt).toLocaleDateString('pt-BR') : 'Sem registros'}
 </span>
 </div>
 </div>

 <Link
 href={`/dashboard/clients/${client.id}`}
 className="p-1.5 rounded-lg text-[#7897A8] hover:bg-[#F0F4F7] transition"
 >
 <ChevronRight className="w-5 h-5" />
 </Link>
 </div>

 <div className="bg-[#FFF5F5] p-2.5 rounded-lg text-xs text-[#26343B] space-y-1">
 {highDifficulty && (
 <div className="text-[#D94949] font-medium flex items-center space-x-1">
 <span>• Alta dificuldade relatada no check-in ({lastCheckin.difficultyScore}/5)</span>
 </div>
 )}
 {!lastLog && (
 <div className="text-[#D97706] font-medium">
 • Sem registros de refeições na última semana
 </div>
 )}
 {client.notes && (
 <p className="text-[#71808A] italic">"{client.notes.slice(0, 70)}..."</p>
 )}
 </div>

 <div className="flex items-center justify-between pt-1 text-xs">
 <Link
 href={`/dashboard/clients/${client.id}?tab=summary`}
 className="text-[#7897A8] font-medium hover:underline flex items-center space-x-1"
 >
 <FileText className="w-3.5 h-3.5" />
 <span>Gerar Resumo IA</span>
 </Link>
 <Link
 href={`/dashboard/clients/${client.id}`}
 className="text-[#26343B] font-medium hover:underline"
 >
 Ver perfil completo →
 </Link>
 </div>
 </div>
 )
 })
 )}
 </div>
 </div>

 {/* All Patients List Column (2 cols) */}
 <div className="lg:col-span-2 space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-bold text-[#26343B] flex items-center space-x-2">
 <Users className="w-5 h-5 text-[#7897A8]" />
 <span>Lista de Pacientes</span>
 </h2>
 <span className="text-xs text-[#71808A]">{clients.length} cadastrados</span>
 </div>

 <div className="card-clinical overflow-hidden">
 <div className="divide-y divide-[#E2E8EE]">
 {clients.map((client: any) => {
 const latestPlan = client.mealPlans[0]
 const latestMeasurement = client.measurements[0]
 const lastLog = client.mealLogs[0]

 return (
 <div
 key={client.id}
 className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFBFD] transition"
 >
 <div className="flex items-center space-x-4">
 <img
 src={client.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
 alt={client.user.name}
 className="w-12 h-12 rounded-full object-cover border border-[#E2E8EE]"
 />
 <div>
 <div className="flex items-center space-x-2">
 <h3 className="font-semibold text-base text-[#26343B]">{client.user.name}</h3>
 <span className={client.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}>
 {client.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
 </span>
 </div>
 <div className="flex items-center space-x-4 text-xs text-[#71808A] mt-1">
 <span>
 Plano:{' '}
 <strong className="text-[#26343B]">
 {latestPlan ? `v${latestPlan.version} (${latestPlan.status})` : 'Sem plano'}
 </strong>
 </span>
 <span>•</span>
 <span>
 Último peso:{' '}
 <strong className="text-[#26343B]">
 {latestMeasurement ? `${latestMeasurement.weightKg} kg` : 'N/I'}
 </strong>
 </span>
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#E2E8EE]">
 <span className="text-xs text-[#71808A] block sm:hidden">
 Última ativ: {lastLog ? new Date(lastLog.loggedAt).toLocaleDateString('pt-BR') : 'Nenhum'}
 </span>
 <Link
 href={`/dashboard/clients/${client.id}`}
 className="btn-secondary text-xs flex items-center space-x-1 py-2 px-3"
 >
 <Activity className="w-3.5 h-3.5" />
 <span>Acompanhar</span>
 </Link>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 </div>
 </div>
 </main>
 </div>
 )
}
