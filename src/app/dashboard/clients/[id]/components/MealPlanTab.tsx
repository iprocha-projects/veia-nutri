'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastContext'
import {
  Plus,
  Send,
  Trash2,
  Loader2,
  Sparkles,
  CheckCircle2,
  History,
  Copy,
  Save,
  Check,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react'
import { TemplatePickerModal } from './TemplatePickerModal'
import { SaveAsTemplateModal } from './SaveAsTemplateModal'

interface MealPlanTabProps {
  clientId: string
  activePlan: any
  mealPlans?: any[]
}

export function MealPlanTab({ clientId, activePlan, mealPlans = [] }: MealPlanTabProps) {
  const router = useRouter()
  const toast = useToast()

  // Find the published (in vigor) plan or the newest plan
  const publishedPlan = mealPlans.find((p) => p.status === 'PUBLISHED') || activePlan
  const allPlans = mealPlans.length > 0 ? mealPlans : activePlan ? [activePlan] : []

  // Currently inspected plan ID in the version manager
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    publishedPlan?.id || allPlans[0]?.id || 'new'
  )

  const currentPlan = allPlans.find((p) => p.id === selectedPlanId) || publishedPlan

  // Plan Form State
  const [planTitle, setPlanTitle] = useState(
    currentPlan?.title || 'Plano Alimentar Personalizado'
  )

  const parseMealsFromPlan = (plan: any) => {
    if (plan?.meals && plan.meals.length > 0) {
      return plan.meals.map((m: any) => ({
        name: m.name,
        time: m.time,
        instructions: m.instructions || '',
        items: (m.items || []).map((i: any) => ({
          foodName: i.foodName,
          quantity: i.quantity,
          unit: i.unit,
          notes: i.notes || '',
        })),
      }))
    }
    return [
      {
        name: 'Café da Manhã',
        time: '08:00',
        instructions: '',
        items: [{ foodName: 'Ovos mexidos', quantity: '2', unit: 'unid', notes: '' }],
      },
      {
        name: 'Almoço',
        time: '12:30',
        instructions: '',
        items: [{ foodName: 'Arroz integral', quantity: '120', unit: 'g', notes: '' }],
      },
    ]
  }

  const [meals, setMeals] = useState<any[]>(parseMealsFromPlan(currentPlan))
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)

  // Modals state
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)
  const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false)

  // Sync state when selected plan changes
  useEffect(() => {
    if (currentPlan) {
      setPlanTitle(currentPlan.title)
      setMeals(parseMealsFromPlan(currentPlan))
    }
  }, [selectedPlanId])

  const isCurrentPlanPublished = currentPlan?.status === 'PUBLISHED'

  // Actions
  const addMeal = () => {
    setMeals([
      ...meals,
      {
        name: 'Lanche da Tarde',
        time: '16:00',
        instructions: '',
        items: [{ foodName: '', quantity: '1', unit: 'porção', notes: '' }],
      },
    ])
    toast.info('Nova refeição adicionada', 'Preencha o nome e os alimentos da refeição.')
  }

  const removeMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index))
    toast.info('Refeição removida')
  }

  const addMealItem = (mealIndex: number) => {
    const updated = [...meals]
    updated[mealIndex].items.push({ foodName: '', quantity: '1', unit: 'g', notes: '' })
    setMeals(updated)
  }

  const removeMealItem = (mealIndex: number, itemIndex: number) => {
    const updated = [...meals]
    updated[mealIndex].items = updated[mealIndex].items.filter(
      (_: any, i: number) => i !== itemIndex
    )
    setMeals(updated)
  }

  // Apply template from library
  const handleApplyTemplate = (template: any) => {
    if (Array.isArray(template.meals) && template.meals.length > 0) {
      setMeals(
        template.meals.map((m: any) => ({
          name: m.name,
          time: m.time,
          instructions: m.instructions || '',
          items: (m.items || []).map((i: any) => ({
            foodName: i.foodName,
            quantity: i.quantity,
            unit: i.unit,
            notes: i.notes || '',
          })),
        }))
      )
      setPlanTitle(template.title)
      toast.success(
        'Modelo Base Aplicado!',
        'Todas as refeições foram preenchidas. Você pode modificar qualquer alimento ou porção livremente.'
      )
    }
  }

  // Save new version or draft
  const handleSavePlan = async (publish: boolean) => {
    setSaving(true)
    try {
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          title: planTitle,
          meals,
          publish,
        }),
      })

      if (res.ok) {
        if (publish) {
          toast.success(
            'Plano em Vigor Atualizado!',
            'Esta versão agora é a dieta oficial do paciente e ele foi notificado.'
          )
        } else {
          toast.success(
            'Rascunho Salvo!',
            'Você pode continuar ajustando este plano antes de publicá-lo para o paciente.'
          )
        }
        router.refresh()
      } else {
        const err = await res.json()
        toast.error('Erro ao salvar plano', err.error || 'Verifique as informações.')
      }
    } catch {
      toast.error('Erro de conexão', 'Não foi possível se comunicar com o servidor.')
    } finally {
      setSaving(false)
    }
  }

  // Activate an existing historical version as the "Plano em Vigor"
  const handleActivateVersion = async () => {
    if (!currentPlan?.id) return

    setActivating(true)
    try {
      const res = await fetch(`/api/meal-plans/${currentPlan.id}/activate`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success(
          'Plano Definido como Vigente!',
          `A versão "${currentPlan.title}" agora é a oficial para este paciente.`
        )
        router.refresh()
      } else {
        const err = await res.json()
        toast.error('Erro ao ativar versão', err.error || 'Tente novamente.')
      }
    } catch {
      toast.error('Erro de conexão', 'Não foi possível ativar esta versão.')
    } finally {
      setActivating(false)
    }
  }

  // Create new draft based on current plan
  const handleStartNewVersionDraft = () => {
    setPlanTitle(`${planTitle} (Nova Versão)`)
    setSelectedPlanId('new')
    toast.info(
      'Novo Rascunho Iniciado',
      'Faça as alterações necessárias e clique em "Publicar como Plano em Vigor" quando finalizar.'
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Version Management Bar */}
      <div className="card-clinical p-4 bg-white border border-[#E2E8EE] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#7897A8]" />
            <div>
              <span className="text-xs font-bold text-[#26343B] uppercase tracking-wider block">
                Histórico & Versões do Plano
              </span>
              <p className="text-[11px] text-[#71808A]">
                Alterne entre versões anteriores ou defina qual dieta está ativa para o paciente.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Version Picker Selector */}
            {allPlans.length > 0 && (
              <div className="relative">
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-[#E2E8EE] bg-[#F6F8FA] text-[#26343B] focus:ring-2 focus:ring-[#7897A8] outline-none cursor-pointer appearance-none"
                >
                  {allPlans.map((plan: any) => {
                    const isPublished = plan.status === 'PUBLISHED'
                    const dateStr = new Date(plan.createdAt).toLocaleDateString('pt-BR')
                    return (
                      <option key={plan.id} value={plan.id}>
                        {isPublished ? '● Plano em Vigor (Oficial)' : `Versão de ${dateStr}`} -{' '}
                        {plan.title}
                      </option>
                    )
                  })}
                  {selectedPlanId === 'new' && <option value="new">Novo Rascunho em Elaboração</option>}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#71808A] absolute right-2.5 top-3 pointer-events-none" />
              </div>
            )}

            <button
              type="button"
              onClick={handleStartNewVersionDraft}
              className="btn-secondary text-xs flex items-center space-x-1.5 px-3 py-2 whitespace-nowrap"
              title="Criar novo ciclo baseado neste plano"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Versão</span>
            </button>
          </div>
        </div>

        {/* Friendly Status Alert for Historical Versions */}
        {!isCurrentPlanPublished && selectedPlanId !== 'new' && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Você está visualizando uma <strong>versão anterior</strong>. O paciente não está vendo
                este plano no momento.
              </span>
            </div>
            <button
              type="button"
              onClick={handleActivateVersion}
              disabled={activating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 shrink-0 transition shadow-sm"
            >
              {activating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Tornar este Plano em Vigor</span>
            </button>
          </div>
        )}

        {isCurrentPlanPublished && (
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center space-x-2 text-xs text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Plano em Vigor:</span>
            <span>Esta é a dieta oficial que seu paciente está acompanhando no aplicativo.</span>
          </div>
        )}
      </div>

      {/* Main Meal Plan Builder Card */}
      <div className="card-clinical p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8EE]">
          <div>
            <h2 className="text-base font-bold text-[#26343B]">
              {selectedPlanId === 'new'
                ? 'Elaborar Nova Versão do Plano'
                : 'Editar Plano Alimentar'}
            </h2>
            <p className="text-xs text-[#71808A]">
              Personalize as refeições e alimentos ou carregue um dos seus modelos base.
            </p>
          </div>

          {/* Quick Base Template Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTemplatePickerOpen(true)}
              className="btn-secondary text-xs flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-[#F0F6F9] to-white hover:from-[#E2EEF5]"
              title="Preencher usando um modelo base"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7897A8]" />
              <span>Usar Modelo Base</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSaveAsTemplateOpen(true)}
              className="btn-secondary text-xs flex items-center space-x-1.5 px-3 py-2"
              title="Salvar este plano como modelo na sua biblioteca"
            >
              <Save className="w-3.5 h-3.5 text-[#71808A]" />
              <span>Salvar como Modelo Base</span>
            </button>

            <button
              type="button"
              onClick={() => handleSavePlan(true)}
              disabled={saving}
              className="btn-primary text-xs flex items-center space-x-1.5 px-3.5 py-2 shadow-sm"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Publicar como Plano em Vigor</span>
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">
              Nome do Plano Alimentar
            </label>
            <input
              type="text"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="Ex: Protocolo Hipertrofia Fase 2"
              className="w-full text-sm font-semibold p-2.5 rounded-xl border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
            />
          </div>

          {/* Meals List Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#26343B]">
                Refeições e Horários ({meals.length} refeições)
              </label>
            </div>

            {meals.map((meal: any, mIdx: number) => (
              <div
                key={mIdx}
                className="p-4 rounded-xl border border-[#E2E8EE] bg-[#F6F8FA] space-y-3 animate-fade-in transition-all"
              >
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
                    className="flex-1 text-sm font-bold p-2.5 rounded-lg border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none transition"
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
                    className="w-24 text-sm p-2.5 rounded-lg border border-[#E2E8EE] bg-white text-center focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeMeal(mIdx)}
                    className="p-2 text-[#71808A] hover:text-[#D94949] hover:bg-[#FFF5F5] rounded-lg transition"
                    title="Excluir refeição"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Items */}
                <div className="space-y-2 pl-2">
                  {meal.items.map((item: any, iIdx: number) => (
                    <div key={iIdx} className="flex items-center space-x-2 animate-fade-in">
                      <input
                        type="text"
                        placeholder="Alimento (ex: Ovos mexidos)"
                        value={item.foodName}
                        onChange={(e) => {
                          const copy = [...meals]
                          copy[mIdx].items[iIdx].foodName = e.target.value
                          setMeals(copy)
                        }}
                        className="flex-1 text-xs p-2 rounded-lg border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none transition"
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
                        className="w-16 text-xs p-2 rounded-lg border border-[#E2E8EE] bg-white text-center focus:ring-2 focus:ring-[#7897A8] outline-none transition"
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
                        className="w-20 text-xs p-2 rounded-lg border border-[#E2E8EE] bg-white text-center focus:ring-2 focus:ring-[#7897A8] outline-none transition"
                      />
                      {meal.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMealItem(mIdx, iIdx)}
                          className="text-[#71808A] hover:text-[#D94949] p-1 transition"
                          title="Remover item"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addMealItem(mIdx)}
                    className="text-xs font-semibold text-[#7897A8] hover:text-[#26343B] flex items-center space-x-1 pt-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Alimento</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addMeal}
              className="btn-secondary text-xs flex items-center space-x-1.5 w-full justify-center py-3 border-dashed hover:border-solid hover:bg-white transition"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Nova Refeição ao Plano</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TemplatePickerModal
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        onSelectTemplate={handleApplyTemplate}
      />

      <SaveAsTemplateModal
        isOpen={isSaveAsTemplateOpen}
        onClose={() => setIsSaveAsTemplateOpen(false)}
        currentTitle={planTitle}
        meals={meals}
      />
    </div>
  )
}
