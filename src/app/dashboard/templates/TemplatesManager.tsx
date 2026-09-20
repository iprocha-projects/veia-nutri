'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Plus,
  Search,
  Trash2,
  Utensils,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Layers,
  Save,
  Pencil,
} from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'

interface TemplatesManagerProps {
  initialTemplates: any[]
}

const COMMON_CATEGORIES = [
  'Hipertrofia',
  'Emagrecimento',
  'Reeducação Alimentar',
  'Low Carb',
  'Vegetariano',
  'Geral',
]

export function TemplatesManager({ initialTemplates }: TemplatesManagerProps) {
  const router = useRouter()
  const toast = useToast()
  const [templates, setTemplates] = useState(initialTemplates)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // New Template Form State
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Hipertrofia')
  const [newDescription, setNewDescription] = useState('')
  const [newMeals, setNewMeals] = useState<any[]>([
    {
      name: 'Café da Manhã',
      time: '08:00',
      instructions: '',
      items: [
        { foodName: 'Ovos mexidos', quantity: '2', unit: 'unid', notes: '' },
        { foodName: 'Pão integral', quantity: '2', unit: 'fatias', notes: '' },
      ],
    },
    {
      name: 'Almoço',
      time: '12:30',
      instructions: '',
      items: [
        { foodName: 'Arroz integral', quantity: '150', unit: 'g', notes: '' },
        { foodName: 'Feijão preto', quantity: '100', unit: 'g', notes: '' },
        { foodName: 'Filé de frango grelhado', quantity: '150', unit: 'g', notes: '' },
      ],
    },
  ])

  const categories = [
    'all',
    ...Array.from(new Set(templates.map((t) => t.category).filter(Boolean))),
  ]

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesCat
  })

  // Handlers for building meals in new template
  const addMeal = () => {
    setNewMeals([
      ...newMeals,
      {
        name: 'Lanche',
        time: '16:00',
        instructions: '',
        items: [{ foodName: '', quantity: '1', unit: 'porção', notes: '' }],
      },
    ])
  }

  const removeMeal = (index: number) => {
    setNewMeals(newMeals.filter((_, i) => i !== index))
  }

  const addMealItem = (mealIndex: number) => {
    const copy = [...newMeals]
    copy[mealIndex].items.push({ foodName: '', quantity: '1', unit: 'g', notes: '' })
    setNewMeals(copy)
  }

  const removeMealItem = (mealIndex: number, itemIndex: number) => {
    const copy = [...newMeals]
    copy[mealIndex].items = copy[mealIndex].items.filter((_: any, i: number) => i !== itemIndex)
    setNewMeals(copy)
  }

  const handleStartEdit = (template: any) => {
    setEditingTemplate(template)
    setNewTitle(template.title)
    setNewCategory(template.category || 'Hipertrofia')
    setNewDescription(template.description || '')
    setNewMeals(
      Array.isArray(template.meals) && template.meals.length > 0
        ? template.meals
        : [
            {
              name: 'Café da Manhã',
              time: '08:00',
              instructions: '',
              items: [{ foodName: 'Ovos mexidos', quantity: '2', unit: 'unid', notes: '' }],
            },
          ]
    )
    setIsCreating(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelForm = () => {
    setIsCreating(false)
    setEditingTemplate(null)
    setNewTitle('')
    setNewDescription('')
  }

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error('Título obrigatório', 'Informe um nome para o modelo base.')
      return
    }

    setSaving(true)
    try {
      const isEditing = Boolean(editingTemplate)
      const res = await fetch('/api/meal-plan-templates', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEditing ? { id: editingTemplate.id } : {}),
          title: newTitle,
          category: newCategory,
          description: newDescription,
          meals: newMeals,
        }),
      })

      if (res.ok) {
        const saved = await res.json()
        if (isEditing) {
          setTemplates((prev) => prev.map((t) => (t.id === editingTemplate.id ? saved : t)))
          toast.success(
            'Modelo Base Atualizado!',
            `As alterações em "${saved.title}" foram salvas com sucesso.`
          )
        } else {
          setTemplates([saved, ...templates])
          toast.success(
            'Modelo Base Salvo!',
            `O modelo "${saved.title}" já está disponível para inserção nos pacientes.`
          )
        }
        handleCancelForm()
      } else {
        const err = await res.json()
        toast.error('Erro ao salvar modelo', err.error || 'Tente novamente.')
      }
    } catch {
      toast.error('Erro de conexão', 'Falha ao salvar modelo base.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente excluir o modelo base "${title}"?`)) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/meal-plan-templates?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id))
        toast.success('Modelo Removido', `O modelo "${title}" foi excluído da sua biblioteca.`)
      } else {
        toast.error('Erro ao excluir', 'Não foi possível remover o modelo base.')
      }
    } catch {
      toast.error('Erro de conexão', 'Falha ao excluir modelo base.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#26343B] to-[#7897A8] text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#26343B] tracking-tight">
                Modelos de Planos Alimentares Base
              </h1>
              <p className="text-xs text-[#71808A] mt-0.5">
                Crie dietas padrão para seu consultório e insira em qualquer paciente com 1 clique,
                ajustando conforme a necessidade.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              if (isCreating) {
                handleCancelForm()
              } else {
                setEditingTemplate(null)
                setNewTitle('')
                setNewDescription('')
                setIsCreating(true)
              }
            }}
            className="btn-primary flex items-center space-x-2 text-xs shadow-sm"
          >
            {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isCreating ? 'Fechar Formulário' : 'Novo Modelo Base'}</span>
          </button>
        </div>
      </div>

      {/* New / Edit Template Builder */}
      {isCreating && (
        <div className="card-clinical p-6 bg-white border border-[#E2E8EE] space-y-6 animate-scale-in">
          <div className="border-b border-[#E2E8EE] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#26343B]">
                {editingTemplate ? `Editar Modelo Base: "${editingTemplate.title}"` : 'Estruturar Novo Modelo Base'}
              </h2>
              <p className="text-xs text-[#71808A]">
                {editingTemplate
                  ? 'Altere o nome, categoria e refeições deste modelo padrão.'
                  : 'Configure as refeições e alimentos que compõem este modelo reutilizável.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelForm}
              className="text-xs text-[#71808A] hover:text-[#26343B]"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveTemplate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#26343B] mb-1">
                  Nome do Modelo Base
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Protocolo Hipertrofia 2500kcal"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26343B] mb-1">
                  Categoria
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {COMMON_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                        newCategory === cat
                          ? 'bg-[#26343B] text-white'
                          : 'bg-[#F0F4F7] text-[#71808A]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ou defina uma nova categoria..."
                  className="w-full text-xs p-2 rounded-xl border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26343B] mb-1">
                Descrição ou Diretrizes Clínicas (Opcional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Ex: Dieta para indivíduos em fase de ganho de massa magra, fracionamento em 5 refeições..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none resize-none"
              />
            </div>

            {/* Meals list */}
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-[#26343B]">
                Refeições do Modelo ({newMeals.length})
              </label>

              {newMeals.map((meal: any, mIdx: number) => (
                <div
                  key={mIdx}
                  className="p-4 rounded-xl border border-[#E2E8EE] bg-[#F6F8FA] space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Nome da refeição (ex: Almoço)"
                      value={meal.name}
                      onChange={(e) => {
                        const copy = [...newMeals]
                        copy[mIdx].name = e.target.value
                        setNewMeals(copy)
                      }}
                      className="flex-1 text-xs font-bold p-2 rounded-lg border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Horário (ex: 12:30)"
                      value={meal.time}
                      onChange={(e) => {
                        const copy = [...newMeals]
                        copy[mIdx].time = e.target.value
                        setNewMeals(copy)
                      }}
                      className="w-24 text-xs p-2 rounded-lg border border-[#E2E8EE] bg-white text-center focus:ring-2 focus:ring-[#7897A8] outline-none"
                    />
                    {newMeals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMeal(mIdx)}
                        className="p-1.5 text-[#71808A] hover:text-[#D94949] rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-2 pl-2">
                    {meal.items.map((item: any, iIdx: number) => (
                      <div key={iIdx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Alimento (ex: Frango grelhado)"
                          value={item.foodName}
                          onChange={(e) => {
                            const copy = [...newMeals]
                            copy[mIdx].items[iIdx].foodName = e.target.value
                            setNewMeals(copy)
                          }}
                          className="flex-1 text-xs p-1.5 rounded-lg border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Qtd"
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...newMeals]
                            copy[mIdx].items[iIdx].quantity = e.target.value
                            setNewMeals(copy)
                          }}
                          className="w-16 text-xs p-1.5 rounded-lg border border-[#E2E8EE] bg-white text-center focus:ring-2 focus:ring-[#7897A8] outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Unid"
                          value={item.unit}
                          onChange={(e) => {
                            const copy = [...newMeals]
                            copy[mIdx].items[iIdx].unit = e.target.value
                            setNewMeals(copy)
                          }}
                          className="w-20 text-xs p-1.5 rounded-lg border border-[#E2E8EE] bg-white text-center focus:ring-2 focus:ring-[#7897A8] outline-none"
                        />
                        {meal.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMealItem(mIdx, iIdx)}
                            className="text-[#71808A] hover:text-[#D94949] text-xs p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addMealItem(mIdx)}
                      className="text-xs font-semibold text-[#7897A8] hover:text-[#26343B] flex items-center space-x-1 pt-1"
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
                className="btn-secondary text-xs flex items-center space-x-1.5 w-full justify-center py-2.5 border-dashed"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Refeição ao Modelo</span>
              </button>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E2E8EE]">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-xs font-semibold text-[#71808A] hover:text-[#26343B]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs flex items-center space-x-2 px-4 py-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {saving
                    ? 'Salvando...'
                    : editingTemplate
                    ? 'Salvar Alterações do Modelo'
                    : 'Salvar Modelo Base'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Categories Bar */}
      <div className="card-clinical p-4 bg-white border border-[#E2E8EE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#71808A] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar modelo base por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#E2E8EE] bg-white focus:ring-2 focus:ring-[#7897A8] outline-none"
          />
        </div>

        {categories.length > 2 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-[#26343B] text-white'
                    : 'bg-[#F6F8FA] text-[#71808A] hover:text-[#26343B]'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Templates */}
      {filtered.length === 0 ? (
        <div className="card-clinical p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F4F7] mx-auto flex items-center justify-center text-[#7897A8]">
            <Layers className="w-7 h-7 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-[#26343B]">Nenhum modelo base cadastrado</h3>
          <p className="text-xs text-[#71808A] max-w-md mx-auto">
            Crie seu primeiro modelo de dieta padrão clicando no botão &quot;Novo Modelo Base&quot; acima, ou
            salve o plano de qualquer paciente diretamente no prontuário clínico.
          </p>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="btn-primary text-xs inline-flex items-center space-x-2 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Meu Primeiro Modelo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => {
            const isExpanded = expandedId === template.id
            const mealsCount = Array.isArray(template.meals) ? template.meals.length : 0

            return (
              <div
                key={template.id}
                className="card-clinical p-5 bg-white border border-[#E2E8EE] hover:border-[#7897A8] transition-all flex flex-col justify-between space-y-4 shadow-sm group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E8EEF3] text-[#26343B] px-2.5 py-0.5 rounded-full inline-block mb-1">
                        {template.category || 'Geral'}
                      </span>
                      <h3 className="font-bold text-sm text-[#26343B] line-clamp-1">
                        {template.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(template)}
                        className="p-1.5 text-[#71808A] hover:text-[#26343B] hover:bg-[#F0F4F7] rounded-lg transition"
                        title="Editar modelo base"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template.id, template.title)}
                        disabled={deletingId === template.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#71808A] hover:text-[#D94949] hover:bg-[#FFF5F5] rounded-lg transition"
                        title="Excluir modelo base"
                      >
                        {deletingId === template.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {template.description && (
                    <p className="text-xs text-[#71808A] line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-3 text-[11px] text-[#71808A] pt-1 border-t border-[#F0F4F7]">
                    <span className="flex items-center space-x-1 font-medium">
                      <Utensils className="w-3.5 h-3.5 text-[#7897A8]" />
                      <span>{mealsCount} refeições</span>
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Expandable Preview */}
                  {isExpanded && Array.isArray(template.meals) && (
                    <div className="pt-2 space-y-2 border-t border-[#F0F4F7] animate-fade-in">
                      {template.meals.map((m: any, mIdx: number) => (
                        <div key={mIdx} className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8EE]">
                          <div className="flex justify-between font-bold text-xs text-[#26343B]">
                            <span>{m.name}</span>
                            <span className="text-[10px] text-[#71808A] font-normal">{m.time}</span>
                          </div>
                          <ul className="text-[11px] text-[#71808A] mt-1 space-y-0.5">
                            {(m.items || []).map((item: any, iIdx: number) => (
                              <li key={iIdx} className="truncate">
                                • {item.foodName} ({item.quantity}{item.unit})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#F0F4F7] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    className="text-xs text-[#71808A] hover:text-[#26343B] flex items-center space-x-1 transition font-medium"
                  >
                    <span>{isExpanded ? 'Ocultar Refeições' : 'Ver Refeições'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(template)}
                      className="text-xs text-[#26343B] hover:text-[#7897A8] flex items-center space-x-1 font-semibold transition"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                    <span className="text-[#E2E8EE]">•</span>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/clients')}
                      className="text-xs text-[#7897A8] hover:text-[#26343B] font-semibold"
                    >
                      Usar em Paciente →
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
