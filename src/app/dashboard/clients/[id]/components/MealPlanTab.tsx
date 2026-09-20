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
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Utensils,
  Pencil,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { TemplatePickerModal } from './TemplatePickerModal'
import { SaveAsTemplateModal } from './SaveAsTemplateModal'
import { areMealsDifferent } from '@/lib/meal-plans-comparator'

interface MealPlanTabProps {
  clientId: string
  activePlan: any
  mealPlans?: any[]
}

export function MealPlanTab({ clientId, activePlan, mealPlans = [] }: MealPlanTabProps) {
  const router = useRouter()
  const toast = useToast()

  // 1. Identify published (in vigor) plan
  const publishedPlan = mealPlans.find((p) => p.status === 'PUBLISHED') || activePlan

  // 2. Deduplicate plans so each distinct plan appears only ONCE
  const seenTitles = new Set<string>()
  if (publishedPlan?.title) {
    seenTitles.add(publishedPlan.title.trim().toLowerCase())
  }

  const uniqueOtherPlans: any[] = []
  for (const plan of mealPlans) {
    if (publishedPlan && plan.id === publishedPlan.id) continue
    const normTitle = plan.title?.trim().toLowerCase() || ''
    if (!seenTitles.has(normTitle)) {
      seenTitles.add(normTitle)
      uniqueOtherPlans.push(plan)
    }
  }

  // Combined list of distinct plans
  const displayPlans = publishedPlan
    ? [publishedPlan, ...uniqueOtherPlans]
    : uniqueOtherPlans

  // View state: 'cards' (default primary view) or 'editor' (appears only when editing or creating)
  const [view, setView] = useState<'cards' | 'editor'>('cards')
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)

  // Currently inspected plan ID in the editor
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

  // Source template tracking for the personalization rule
  const [sourceTemplate, setSourceTemplate] = useState<any | null>(currentPlan?.template || null)
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([])

  // Modals state
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false)
  const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false)

  // Load available templates
  useEffect(() => {
    fetch('/api/meal-plan-templates')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.templates)) {
          setAvailableTemplates(data.templates)
        }
      })
      .catch(console.error)
  }, [])

  // Sync state when selected plan changes
  useEffect(() => {
    if (selectedPlanId === 'new') {
      // Keep existing draft or template if applied
    } else if (currentPlan) {
      setPlanTitle(currentPlan.title)
      setMeals(parseMealsFromPlan(currentPlan))

      // Identify if this plan belongs to a base template
      let matched = currentPlan.template || null
      if (!matched && availableTemplates.length > 0) {
        const cleanPlanTitle = (currentPlan.title || '')
          .replace(/\s*\(Personalizado\)$/i, '')
          .trim()
          .toLowerCase()
        matched =
          availableTemplates.find(
            (t) => t.title.trim().toLowerCase() === cleanPlanTitle
          ) || null
      }
      setSourceTemplate(matched)
    }
  }, [selectedPlanId, availableTemplates])

  // Check whether current meals differ from the saved base template
  const isModifiedFromTemplate = sourceTemplate
    ? areMealsDifferent(meals, sourceTemplate.meals)
    : false

  // Automatic title update according to personalization rule:
  // Only append "(Personalizado)" if meals differ from the saved base template!
  useEffect(() => {
    if (sourceTemplate) {
      const cleanBase = sourceTemplate.title.replace(/\s*\(Personalizado\)$/i, '').trim()
      const isDiff = areMealsDifferent(meals, sourceTemplate.meals)
      if (isDiff) {
        setPlanTitle(`${cleanBase} (Personalizado)`)
      } else {
        setPlanTitle(cleanBase)
      }
    }
  }, [meals, sourceTemplate])

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

  // Apply template from library -> Starts as identical to base template!
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

      setSourceTemplate(template)
      const cleanBase = template.title.replace(/\s*\(Personalizado\)$/i, '').trim()
      setPlanTitle(cleanBase)
      setSelectedPlanId('new')
      setView('editor')

      toast.success(
        'Modelo Base Aplicado!',
        `Modelo "${cleanBase}" inserido. Se você alterar as refeições e salvar, ele receberá "(Personalizado)".`
      )
    }
  }

  // Save and publish as in vigor
  const handleSavePlan = async (publish: boolean) => {
    setSaving(true)
    try {
      let finalTitle = planTitle.trim()
      const finalTemplateId = sourceTemplate?.id || currentPlan?.templateId || undefined

      if (sourceTemplate) {
        const cleanBase = sourceTemplate.title.replace(/\s*\(Personalizado\)$/i, '').trim()
        const isDiff = areMealsDifferent(meals, sourceTemplate.meals)
        if (isDiff) {
          finalTitle = `${cleanBase} (Personalizado)`
        } else {
          finalTitle = cleanBase
        }
      }

      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId !== 'new' ? selectedPlanId : undefined,
          templateId: finalTemplateId,
          clientId,
          title: finalTitle,
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
        } else {
          toast.success(
            'Plano Salvo com Sucesso!',
            'As alterações foram salvas. Atualizando a página...'
          )
        }
        setTimeout(() => {
          window.location.reload()
        }, 600)
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
  const handleActivateVersion = async (targetPlan?: any) => {
    const planToActivate = targetPlan || currentPlan
    if (!planToActivate?.id) return

    setActivatingId(planToActivate.id)
    try {
      const res = await fetch(`/api/meal-plans/${planToActivate.id}/activate`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success(
          'Plano Definido como Vigente!',
          `A versão "${planToActivate.title}" agora é a oficial para este paciente. Atualizando...`
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
      setActivatingId(null)
    }
  }

  // Delete a plan
  const handleDeletePlan = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente excluir o plano "${title}"?`)) return

    setDeletingPlanId(id)
    try {
      const res = await fetch(`/api/meal-plans?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success(
          'Plano Excluído!',
          `O plano "${title}" foi excluído com sucesso.`
        )
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        const err = await res.json()
        toast.error('Erro ao excluir plano', err.error || 'Tente novamente.')
      }
    } catch {
      toast.error('Erro de conexão', 'Falha ao se comunicar com o servidor.')
    } finally {
      setDeletingPlanId(null)
    }
  }

  // Create a new blank plan in the editor
  const handleStartNewPlan = () => {
    setSelectedPlanId('new')
    setPlanTitle('Novo Plano Alimentar')
    setSourceTemplate(null)
    setMeals([
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
    ])
    setView('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info('Novo Plano', 'Preencha as refeições e clique em salvar ou publicar.')
  }

  // Open an existing plan into the full editor
  const handleEditPlan = (plan: any) => {
    setSelectedPlanId(plan.id)
    setPlanTitle(plan.title)
    setMeals(parseMealsFromPlan(plan))
    setSourceTemplate(plan.template || null)
    setView('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.info(
      'Editor Aberto',
      `Plano "${plan.title}" carregado para edição.`
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========================================================================= */}
      {/* VIEW 1: PLANS CARDS (Default Primary View)                                 */}
      {/* ========================================================================= */}
      {view === 'cards' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8EE]">
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-bold text-[#26343B]">
                Planos do Paciente
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#26343B] text-white px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1.5 shadow-sm">
                <Utensils className="w-3 h-3 text-[#B8C9C1]" />
                <span>Planos</span>
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {displayPlans.length}
                </span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsTemplatePickerOpen(true)}
                className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-3 hover:border-[#7897A8]"
                title="Preencher usando um modelo base"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#7897A8]" />
                <span>Usar Modelo Base</span>
              </button>

              <button
                type="button"
                onClick={handleStartNewPlan}
                className="btn-primary text-xs flex items-center space-x-1.5 py-2 px-3.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Novo Plano</span>
              </button>
            </div>
          </div>

          {displayPlans.length === 0 ? (
            <div className="card-clinical p-12 text-center space-y-3 bg-white border border-[#E2E8EE]">
              <div className="w-14 h-14 rounded-2xl bg-[#F0F4F7] mx-auto flex items-center justify-center text-[#7897A8]">
                <Utensils className="w-7 h-7 opacity-60" />
              </div>
              <h3 className="text-base font-bold text-[#26343B]">Nenhum plano cadastrado</h3>
              <p className="text-xs text-[#71808A] max-w-md mx-auto">
                Crie o primeiro plano alimentar deste paciente ou carregue um dos seus modelos base clicando no botão abaixo.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTemplatePickerOpen(true)}
                  className="btn-secondary text-xs inline-flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7897A8]" />
                  <span>Usar Modelo Base</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartNewPlan}
                  className="btn-primary text-xs inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Plano</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayPlans.map((plan) => {
                const isPub = plan.status === 'PUBLISHED'
                const isExpanded = expandedCardId === plan.id
                const mealsCount = Array.isArray(plan.meals) ? plan.meals.length : 0
                const totalItems = Array.isArray(plan.meals)
                  ? plan.meals.reduce((acc: number, m: any) => acc + (m.items?.length || 0), 0)
                  : 0
                const dateStr = new Date(plan.createdAt).toLocaleDateString('pt-BR')

                return (
                  <div
                    key={plan.id}
                    className={`card-clinical p-5 bg-white border transition-all flex flex-col justify-between space-y-4 shadow-sm group ${
                      isPub
                        ? 'border-emerald-300 ring-1 ring-emerald-200 hover:border-emerald-400'
                        : 'border-[#E2E8EE] hover:border-[#7897A8]'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Delete Button */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {isPub ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1.5 mb-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Plano em Vigor</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F0F4F7] text-[#71808A] px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1 mb-1.5">
                              <span>Plano</span>
                              <span className="text-[9px] text-[#A0AEC0]">• {dateStr}</span>
                            </span>
                          )}
                          <h3 className="font-bold text-sm text-[#26343B] line-clamp-2">
                            {plan.title}
                          </h3>
                        </div>

                        {/* Delete Plan Button */}
                        {!isPub && (
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(plan.id, plan.title)}
                            disabled={deletingPlanId === plan.id}
                            className="p-1.5 text-[#71808A] hover:text-[#D94949] hover:bg-[#FFF5F5] rounded-lg transition shrink-0"
                            title="Excluir este plano"
                          >
                            {deletingPlanId === plan.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Meta Information */}
                      <div className="flex items-center space-x-3 text-[11px] text-[#71808A] pt-1 border-t border-[#F0F4F7]">
                        <span className="flex items-center space-x-1 font-medium">
                          <Utensils className="w-3.5 h-3.5 text-[#7897A8]" />
                          <span>{mealsCount} refeições</span>
                        </span>
                        <span>•</span>
                        <span>{totalItems} alimentos</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-[#7897A8]" />
                          <span>{dateStr}</span>
                        </span>
                      </div>

                      {/* Expandable Meals & Foods List (Same as Modelos Base!) */}
                      {isExpanded && Array.isArray(plan.meals) && (
                        <div className="pt-2 space-y-2 border-t border-[#F0F4F7] animate-fade-in max-h-72 overflow-y-auto pr-1">
                          {plan.meals.map((m: any, mIdx: number) => (
                            <div
                              key={mIdx}
                              className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8EE]"
                            >
                              <div className="flex justify-between font-bold text-xs text-[#26343B]">
                                <span>{m.name}</span>
                                <span className="text-[10px] text-[#71808A] font-normal">{m.time}</span>
                              </div>
                              {m.instructions && (
                                <p className="text-[10px] text-[#71808A] italic mt-0.5">
                                  {m.instructions}
                                </p>
                              )}
                              <ul className="text-[11px] text-[#71808A] mt-1 space-y-0.5">
                                {(m.items || []).map((item: any, iIdx: number) => (
                                  <li key={iIdx} className="truncate">
                                    • {item.foodName} ({item.quantity}{item.unit})
                                    {item.notes ? ` - ${item.notes}` : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-[#F0F4F7] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCardId(isExpanded ? null : plan.id)
                        }
                        className="text-xs text-[#71808A] hover:text-[#26343B] flex items-center space-x-1 transition font-medium"
                      >
                        <span>{isExpanded ? 'Ocultar' : 'Ver Refeições'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="flex items-center space-x-2">
                        {/* Edit Button: Opens full editor! */}
                        <button
                          type="button"
                          onClick={() => handleEditPlan(plan)}
                          className="text-xs text-[#26343B] hover:text-[#7897A8] flex items-center space-x-1 font-semibold transition py-1 px-2.5 rounded-lg hover:bg-[#F0F4F7] border border-transparent hover:border-[#E2E8EE]"
                          title="Abrir no editor"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#7897A8]" />
                          <span>Editar</span>
                        </button>

                        {/* Make In Vigor Button */}
                        {!isPub && (
                          <button
                            type="button"
                            onClick={() => handleActivateVersion(plan)}
                            disabled={activatingId === plan.id}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded-lg flex items-center space-x-1 transition shadow-sm"
                            title="Tornar este plano como oficial do paciente"
                          >
                            {activatingId === plan.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Tornar em Vigor</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: EXPANDED PLAN EDITOR (Only shown when clicking Editar or Novo)     */}
      {/* ========================================================================= */}
      {view === 'editor' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Return Button */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#E2E8EE]">
            <button
              type="button"
              onClick={() => setView('cards')}
              className="btn-secondary text-xs flex items-center space-x-1.5 py-1.5 px-3 hover:border-[#7897A8]"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#7897A8]" />
              <span>Voltar para Planos</span>
            </button>

            <span className="text-xs font-semibold text-[#71808A]">
              {selectedPlanId === 'new'
                ? 'Elaborando Novo Plano'
                : isCurrentPlanPublished
                ? 'Editando Plano em Vigor'
                : 'Editando Plano'}
            </span>
          </div>

          {/* Friendly Active Plan Banner (Only if Published) */}
          {isCurrentPlanPublished && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 animate-fade-in">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">Plano em Vigor:</span>
                <span>Esta é a dieta oficial ativa que seu paciente está acompanhando no aplicativo.</span>
              </div>
              <button
                type="button"
                onClick={handleStartNewPlan}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline self-start sm:self-auto"
              >
                + Criar Outro Plano
              </button>
            </div>
          )}

          {/* Main Meal Plan Builder Card */}
          <div className="card-clinical p-6 space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E2E8EE]">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#26343B]">
                  {selectedPlanId === 'new'
                    ? 'Elaborar Novo Plano'
                    : isCurrentPlanPublished
                    ? `Editar Plano em Vigor: "${planTitle}"`
                    : `Editar Plano: "${planTitle}"`}
                </h2>
                <p className="text-xs text-[#71808A]">
                  Personalize as refeições e alimentos ou carregue um dos seus modelos base.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() => setView('cards')}
                  className="btn-secondary text-xs flex items-center space-x-1.5 px-3 py-2 whitespace-nowrap"
                  title="Voltar para a lista de planos"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#71808A]" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTemplatePickerOpen(true)}
                  className="btn-secondary text-xs flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-[#F0F6F9] to-white hover:from-[#E2EEF5] whitespace-nowrap"
                  title="Preencher usando um modelo base"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7897A8]" />
                  <span>Usar Modelo Base</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSaveAsTemplateOpen(true)}
                  className="btn-secondary text-xs flex items-center space-x-1.5 px-3 py-2 whitespace-nowrap"
                  title="Salvar este plano como modelo na sua biblioteca"
                >
                  <Save className="w-3.5 h-3.5 text-[#71808A]" />
                  <span>Salvar como Modelo Base</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePlan(false)}
                  disabled={saving}
                  className="btn-secondary text-xs flex items-center space-x-1.5 px-3 py-2 hover:border-[#7897A8] whitespace-nowrap"
                  title="Salvar alterações sem torná-lo em vigor imediatamente"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 text-[#7897A8]" />
                  )}
                  <span>Salvar Alterações</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePlan(true)}
                  disabled={saving}
                  className="btn-primary text-xs flex items-center space-x-1.5 px-3.5 py-2 shadow-sm whitespace-nowrap"
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

            {/* Title Input & Warnings */}
            <div className="space-y-4">
              {/* Yellow Warning: ONLY shown BEFORE publishing when modified from a base template */}
              {sourceTemplate && !isCurrentPlanPublished && isModifiedFromTemplate && (
                <div className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-all animate-fade-in bg-amber-50/90 border-amber-200 text-amber-900">
                  <div className="flex items-center space-x-2.5">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                    <div>
                      <span className="font-bold block">
                        Modelo Base Modificado: &quot;{sourceTemplate.title.replace(/\s*\(Personalizado\)$/i, '').trim()}&quot;
                      </span>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Refeições alteradas em relação ao modelo base salvo. O plano receberá &quot;(Personalizado)&quot; ao publicar.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0 self-start sm:self-center bg-amber-200/80 text-amber-900">
                    Personalizado (Modificado)
                  </span>
                </div>
              )}

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
        </div>
      )}

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
