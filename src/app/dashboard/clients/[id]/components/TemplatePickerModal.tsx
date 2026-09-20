'use client'

import { useState, useEffect } from 'react'
import { X, Search, Utensils, Check, Sparkles, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface TemplatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: any) => void
}

export function TemplatePickerModal({ isOpen, onClose, onSelectTemplate }: TemplatePickerModalProps) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch('/api/meal-plan-templates')
        .then((res) => res.json())
        .then((data) => {
          setTemplates(data.templates || [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))]

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="fixed inset-0 bg-[#262D31]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E2E8EE] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8EE] bg-gradient-to-r from-[#F6F8FA] to-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7897A8]/15 text-[#26343B] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#26343B]">Modelos de Planos Alimentares Base</h3>
              <p className="text-xs text-[#71808A]">
                Selecione um modelo base para preencher o plano deste paciente. Você poderá alterar tudo livremente depois.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71808A] hover:text-[#26343B] rounded-lg hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-[#E2E8EE] space-y-3 bg-[#FAFBFD]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#71808A] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar modelos base por título ou descrição..."
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
                      : 'bg-white text-[#71808A] border border-[#E2E8EE] hover:text-[#26343B]'
                  }`}
                >
                  {cat === 'all' ? 'Todos os Modelos' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Template List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#71808A] flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#7897A8]" />
              <span>Carregando seus modelos base...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center space-y-2 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#F0F4F7] mx-auto flex items-center justify-center text-[#71808A]">
                <Utensils className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-xs font-semibold text-[#26343B]">Nenhum modelo base encontrado</p>
              <p className="text-[11px] text-[#71808A]">
                Você pode salvar o plano deste paciente como seu primeiro modelo base clicando no botão{' '}
                <strong className="text-[#26343B]">&quot;Salvar como Modelo Base&quot;</strong> na tela de dietas.
              </p>
            </div>
          ) : (
            filtered.map((template) => {
              const isExpanded = expandedId === template.id
              const mealsCount = Array.isArray(template.meals) ? template.meals.length : 0

              return (
                <div
                  key={template.id}
                  className="border border-[#E2E8EE] rounded-xl bg-white overflow-hidden hover:border-[#7897A8] transition shadow-sm"
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-[#26343B]">{template.title}</span>
                        {template.category && (
                          <span className="text-[10px] font-semibold bg-[#E8EEF3] text-[#26343B] px-2 py-0.5 rounded-full">
                            {template.category}
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-xs text-[#71808A] line-clamp-1">{template.description}</p>
                      )}
                      <div className="flex items-center space-x-3 text-[11px] text-[#71808A] pt-0.5">
                        <span className="flex items-center space-x-1">
                          <Utensils className="w-3 h-3" />
                          <span>{mealsCount} refeições</span>
                        </span>
                        <span>•</span>
                        <span>
                          Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : template.id)}
                        className="text-xs text-[#71808A] hover:text-[#26343B] px-2.5 py-1.5 rounded-lg border border-[#E2E8EE] flex items-center space-x-1 transition"
                      >
                        <span>{isExpanded ? 'Ocultar' : 'Ver Refeições'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectTemplate(template)
                          onClose()
                        }}
                        className="btn-primary text-xs flex items-center space-x-1.5 px-3 py-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aplicar Modelo</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Preview of Meals */}
                  {isExpanded && Array.isArray(template.meals) && (
                    <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8EE] space-y-3 animate-fade-in text-xs">
                      <p className="font-semibold text-[11px] text-[#71808A] uppercase tracking-wider">
                        Prévia das Refeições do Modelo:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {template.meals.map((m: any, mIdx: number) => (
                          <div key={mIdx} className="bg-white p-3 rounded-lg border border-[#E2E8EE] space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-xs text-[#26343B]">
                              <span>{m.name}</span>
                              <span className="text-[10px] text-[#71808A] flex items-center space-x-1 font-normal">
                                <Clock className="w-3 h-3" />
                                <span>{m.time}</span>
                              </span>
                            </div>
                            <ul className="space-y-0.5 text-[11px] text-[#71808A]">
                              {(m.items || []).map((i: any, iIdx: number) => (
                                <li key={iIdx} className="truncate">
                                  • {i.foodName} ({i.quantity}{i.unit})
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
