'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Sparkles,
  Activity,
  Edit,
  Utensils,
  TrendingDown,
  Camera,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'

import { EditProfileModal } from './components/EditProfileModal'
import { OverviewTab } from './components/OverviewTab'
import { MealPlanTab } from './components/MealPlanTab'
import { MealLogsTab } from './components/MealLogsTab'
import { EvolutionTab } from './components/EvolutionTab'
import { CheckinsTab } from './components/CheckinsTab'
import { AISummaryTab } from './components/AISummaryTab'

export function ClientProfileClient({ client: initialClient }: { client: any }) {
  const toast = useToast()
  const [client, setClient] = useState(initialClient)
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'logs' | 'evolution' | 'checkins' | 'summary'>('overview')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [currentSummary, setCurrentSummary] = useState<any>(client.aiSummaries?.[0] || null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const activePlan = client.mealPlans?.find((p: any) => p.status === 'PUBLISHED') || client.mealPlans?.[0]

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
        setActiveTab('summary')
        toast.success('Resumo gerado com sucesso!', 'Os dados clínicos semanais foram consolidados com IA.')
      } else {
        const err = await res.json()
        toast.error('Erro ao gerar resumo', err.error || 'Não foi possível processar o resumo semanal.')
      }
    } catch {
      toast.error('Erro de conexão', 'Falha ao se comunicar com o servidor de IA.')
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleProfileUpdated = (updatedClient: any) => {
    setClient((prev: any) => ({
      ...prev,
      ...updatedClient,
      user: {
        ...prev.user,
        ...updatedClient.user,
      },
    }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-[#71808A] hover:text-[#26343B] flex items-center space-x-1 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </Link>
      </div>

      {/* Patient Profile Card */}
      <div className="card-clinical p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#B8C9C1] transition-all">
        <div className="flex items-center space-x-5">
          <img
            src={client.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={client.user?.name || 'Paciente'}
            className="w-16 h-16 rounded-xl object-cover border-2 border-[#E2E8EE] shadow-sm"
          />
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-[#26343B]">{client.user?.name}</h1>
              <span className={client.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}>
                {client.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
              </span>
            </div>
            <p className="text-xs text-[#71808A] mt-1">
              E-mail: {client.user?.email} • Tel: {client.user?.phone || 'Não informado'} • Nasc:{' '}
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
            className="btn-primary flex items-center space-x-2 text-xs shadow-sm hover:shadow"
          >
            {summaryLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{summaryLoading ? 'Gerando...' : 'Resumo Semanal IA'}</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        client={client}
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        onSuccess={handleProfileUpdated}
      />

      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-[#E2E8EE] overflow-x-auto pb-1 scrollbar-none">
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
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-[#7897A8] text-[#7897A8] bg-white shadow-sm'
                  : 'border-transparent text-[#71808A] hover:text-[#26343B] hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Contents with smooth animated transition */}
      <div key={activeTab} className="animate-fade-in transition-all">
        {activeTab === 'overview' && (
          <OverviewTab client={client} currentSummary={currentSummary} activePlan={activePlan} />
        )}

        {activeTab === 'plan' && (
          <MealPlanTab clientId={client.id} activePlan={activePlan} />
        )}

        {activeTab === 'logs' && (
          <MealLogsTab mealLogs={client.mealLogs || []} />
        )}

        {activeTab === 'evolution' && (
          <EvolutionTab
            measurements={client.measurements || []}
            progressPhotos={client.progressPhotos || []}
          />
        )}

        {activeTab === 'checkins' && (
          <CheckinsTab checkins={client.checkins || []} />
        )}

        {activeTab === 'summary' && (
          <AISummaryTab
            clientId={client.id}
            currentSummary={currentSummary}
            summaryLoading={summaryLoading}
            onGenerateSummary={handleGenerateAISummary}
            onUpdateSummary={(updated) => setCurrentSummary(updated)}
          />
        )}
      </div>
    </div>
  )
}
