'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastContext'
import { Plus, Send, Trash2, Loader2, Sparkles } from 'lucide-react'

interface MealPlanTabProps {
  clientId: string
  activePlan: any
}

export function MealPlanTab({ clientId, activePlan }: MealPlanTabProps) {
  const router = useRouter()
  const toast = useToast()
  const [planTitle, setPlanTitle] = useState(activePlan?.title || 'Plano Alimentar Personalizado')
  const initialMeals = activePlan?.meals?.length > 0
    ? activePlan.meals.map((m: any) => ({
        name: m.name,
        time: m.time,
        instructions: m.instructions || '',
        items: m.items.map((i: any) => ({
          foodName: i.foodName,
          quantity: i.quantity,
          unit: i.unit,
          notes: i.notes || '',
        })),
      }))
    : [
        {
          name: 'Café da Manhã',
          time: '08:00',
          instructions: '',
          items: [{ foodName: 'Ex: Aveia em flocos', quantity: '30', unit: 'g', notes: '' }],
        },
      ]

  const [meals, setMeals] = useState(initialMeals)
  const [saving, setSaving] = useState(false)

  const addMeal = () => {
    setMeals([
      ...meals,
      {
        name: 'Lanche',
        time: '16:00',
        instructions: '',
        items: [{ foodName: '', quantity: '1', unit: 'porção', notes: '' }],
      },
    ])
    toast.info('Nova refeição adicionada ao plano', 'Preencha o nome e os alimentos da refeição.')
  }

  const removeMeal = (index: number) => {
    const updated = meals.filter((_: any, i: number) => i !== index)
    setMeals(updated)
    toast.info('Refeição removida do rascunho')
  }

  const addMealItem = (mealIndex: number) => {
    const updated = [...meals]
    updated[mealIndex].items.push({ foodName: '', quantity: '1', unit: 'g', notes: '' })
    setMeals(updated)
  }

  const removeMealItem = (mealIndex: number, itemIndex: number) => {
    const updated = [...meals]
    updated[mealIndex].items = updated[mealIndex].items.filter((_: any, i: number) => i !== itemIndex)
    setMeals(updated)
  }

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
          toast.success('Plano alimentar publicado com sucesso!', 'Uma nova versão foi gerada e já está disponível para o paciente.')
        } else {
          toast.success('Rascunho salvo com sucesso!', 'Você pode continuar editando este plano a qualquer momento.')
        }
        router.refresh()
      } else {
        const err = await res.json()
        toast.error('Erro ao salvar plano', err.error || 'Verifique as informações preenchidas.')
      }
    } catch {
      toast.error('Erro de conexão', 'Não foi possível se comunicar com o servidor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
              disabled={saving}
              className="btn-secondary text-xs"
            >
              Salvar Rascunho
            </button>
            <button
              onClick={() => handleSavePlan(true)}
              disabled={saving}
              className="btn-primary text-xs flex items-center space-x-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{saving ? 'Publicando...' : 'Publicar Nova Versão'}</span>
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
              className="w-full text-sm p-2.5 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none transition"
            />
          </div>

          {/* Meals List Builder */}
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-[#26343B]">Refeições e Horários</label>
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
  )
}
