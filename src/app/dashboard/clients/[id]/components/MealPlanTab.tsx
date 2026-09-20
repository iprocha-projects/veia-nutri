'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastContext'
import {
  Plus,
  Send,
  Trash2,
  Loader2,
  Sparkles,
  History,
  Save,
  Check,
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
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 1. Identify published (in vigor) plan
  const publishedPlan = mealPlans.find((p) => p.status === 'PUBLISHED') || activePlan

  // 2. Deduplicate plans so each distinct plan appears only ONCE!
  // Exclude duplicate titles of the published plan and deduplicate older drafts
  const seenTitles = new Set<string>()
  if (publishedPlan?.title) {
    seenTitles.add(publishedPlan.title.trim().toLowerCase())
  }

  const uniqueHistoricalPlans: any[] = []
  for (const plan of mealPlans) {
    if (publishedPlan && plan.id === publishedPlan.id) continue
    const normTitle = plan.title?.trim().toLowerCase() || ''
    if (!seenTitles.has(normTitle)) {
      seenTitles.add(normTitle)
      uniqueHistoricalPlans.push(plan)
    }
  }

  // Combined unique list for the dropdown
  const displayPlans = publishedPlan
    ? [publishedPlan, ...uniqueHistoricalPlans]
    : uniqueHistoricalPlans

  // Dropdown open/close state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Currently inspected plan ID in the version manager
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    publishedPlan?.id || displayPlans[0]?.id || 'new'
  )

  const currentPlan =
    selectedPlanId === 'new'
      ? null
      : displayPlans.find((p) => p.id === selectedPlanId) || publishedPlan

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

  // Close custom dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Sync state when selected plan changes
  useEffect(() => {
    if (selectedPlanId === 'new') {
      // Keep existing draft or reset if needed
    } else if (currentPlan) {
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

  // Apply template from library -> Transforms into an independent plan with "(Personalizado)"
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

      // Clean existing (Personalizado) if any, and append automatically
      const cleanBase = template.title.replace(/\s*\(Personalizado\)$/i, '').trim()
      const customizedTitle = `${cleanBase} (Personalizado)`
      setPlanTitle(customizedTitle)
      setSelectedPlanId('new')

      toast.success(
        'Modelo Base Aplicado!',
        `O plano agora é independente para este paciente e foi nomeado como "${customizedTitle}".`
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
          planId: selectedPlanId !== 'new' ? selectedPlanId : undefined,
          clientId,
          title: planTitle,
          meals,
          publish,
        }),
      })

      if (res.ok) {
        if (publish) {
          toast.success(
            'Plano em Vigor Publicado!',
            'Esta versão agora é a dieta oficial do paciente. Atualizando a página...'
          )
          setTimeout(() => {
            window.location.reload()
          }, 600)
        } else {
          toast.success(
            'Plano Salvo com Sucesso!',
            'As alterações foram salvas. Atualizando a página...'
          )
          setTimeout(() => {
            window.location.reload()
          }, 600)
        }
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
          `A versão "${currentPlan.title}" agora é a oficial para este paciente. Atualizando...`
        )
        setTimeout(() => {
          window.location.reload()
        }, 600)
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
    const base = planTitle.replace(/\s*\(Nova Versão\)$/i, '').trim()
    setPlanTitle(`${base} (Nova Versão)`)
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
            {/* Custom Personalized Version Dropdown */}
            {displayPlans.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-xs font-bold py-2 px-3.5 rounded-xl border border-[#E2E8EE] bg-[#F6F8FA] hover:bg-white hover:border-[#7897A8] text-[#26343B] transition shadow-sm active:scale-98"
                >
                  {selectedPlanId === 'new' ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  ) : currentPlan?.status === 'PUBLISHED' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                  )}

                  <span className="max-w-[180px] sm:max-w-[240px] truncate text-left">
                    {selectedPlanId === 'new'
                      ? 'Novo Rascunho em Elaboração'
                      : currentPlan?.status === 'PUBLISHED'
                      ? `● Plano em Vigor: ${currentPlan.title}`
                      : `Versão: ${currentPlan?.title || 'Histórico'}`}
                  </span>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#71808A] transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Popover Menu with zero duplicates */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#E2E8EE] overflow-hidden z-30 animate-scale-in">
                    <div className="p-2.5 bg-[#F6F8FA] border-b border-[#E2E8EE] flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#71808A] uppercase tracking-wider">
                        Versões da Dieta
                      </span>
                      <span className="text-[10px] font-semibold text-[#7897A8]">
                        {displayPlans.length} disponível(is)
                      </span>
                    </div>

                    <div className="p-1 max-h-60 overflow-y-auto divide-y divide-[#F0F4F7]">
                      {displayPlans.map((plan) => {
                        const isPub = plan.status === 'PUBLISHED'
                        const isSel = selectedPlanId === plan.id
                        const dateStr = new Date(plan.createdAt).toLocaleDateString('pt-BR')

                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => {
                              setSelectedPlanId(plan.id)
                              setIsDropdownOpen(false)
                            }}
                            className={`w-full text-left p-2.5 rounded-xl flex items-start space-x-2.5 transition ${
                              isSel
                                ? 'bg-[#F0F6F9] text-[#26343B]'
                                : 'hover:bg-[#FAFBFD] text-[#71808A]'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isPub ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse mt-1" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300 block mt-1" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-xs truncate ${
                                    isPub
                                      ? 'font-bold text-emerald-800'
                                      : 'font-semibold text-[#26343B]'
                                  }`}
                                >
                                  {plan.title}
                                </span>
                                {isPub && (
                                  <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full shrink-0">
                                    Em Vigor
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#71808A] block mt-0.5">
                                {isPub ? 'Dieta oficial ativa' : `Versão de ${dateStr}`}
                              </span>
                            </div>

                            {isSel && (
                              <Check className="w-4 h-4 text-[#7897A8] shrink-0 mt-0.5" />
                            )}
                          </button>
                        )
                      })}

                      {selectedPlanId === 'new' && (
                        <div className="p-2.5 bg-amber-50/70 rounded-xl flex items-center space-x-2 text-xs font-semibold text-amber-900">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Novo Rascunho em Elaboração</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
              onClick={() => handleSavePlan(false)}
              disabled={saving}
              className="btn-secondary text-xs flex items-center space-x-1.5 px-3 py-2"
              title="Salvar alterações sem torná-lo o plano em vigor"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#71808A]" />
              )}
              <span>Salvar Alterações</span>
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
