'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Utensils,
  Camera,
  Calendar,
  TrendingDown,
  Target,
  Send,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
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

export function ClientAppView({ client }: { client: any }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'plan' | 'log' | 'measurements' | 'checkin' | 'evolution' | 'goals'>('plan')

  // Feedback notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Log Meal Form State
  const [selectedMealId, setSelectedMealId] = useState<string>('')
  const [logNotes, setLogNotes] = useState('')
  const [logPhoto, setLogPhoto] = useState<File | null>(null)
  const [submittingLog, setSubmittingLog] = useState(false)

  // Measurements Form State
  const [weightKg, setWeightKg] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [submittingMeasurement, setSubmittingMeasurement] = useState(false)

  // Checkin Form State
  const [hungerScore, setHungerScore] = useState(3)
  const [energyScore, setEnergyScore] = useState(4)
  const [difficultyScore, setDifficultyScore] = useState(2)
  const [checkinNotes, setCheckinNotes] = useState('')
  const [submittingCheckin, setSubmittingCheckin] = useState(false)

  // Progress Photo Upload State
  const [photoCategory, setPhotoCategory] = useState('front')
  const [progressPhotoFile, setProgressPhotoFile] = useState<File | null>(null)
  const [submittingPhoto, setSubmittingPhoto] = useState(false)

  const activePlan = client.mealPlans?.[0]

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  // Handlers
  const handleLogMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingLog(true)
    setNotification(null)
    try {
      const formData = new FormData()
      formData.append('clientId', client.id)
      formData.append('mealId', selectedMealId)
      formData.append('notes', logNotes)
      if (logPhoto) formData.append('photo', logPhoto)

      const res = await fetch('/api/logs', { method: 'POST', body: formData })
      if (res.ok) {
        showFeedback('success', 'Refeição registrada com sucesso!')
        setSelectedMealId('')
        setLogNotes('')
        setLogPhoto(null)
        router.refresh()
      } else {
        const err = await res.json()
        showFeedback('error', err.error || 'Erro ao registrar refeição.')
      }
    } catch (e) {
      showFeedback('error', 'Erro de conexão ao servidor.')
    } finally {
      setSubmittingLog(false)
    }
  }

  const handleMeasurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingMeasurement(true)
    setNotification(null)
    try {
      const res = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, weightKg, waistCm }),
      })
      if (res.ok) {
        showFeedback('success', 'Peso registrado com sucesso!')
        setWeightKg('')
        setWaistCm('')
        router.refresh()
      } else {
        const err = await res.json()
        showFeedback('error', err.error || 'Erro ao registrar peso.')
      }
    } catch (e) {
      showFeedback('error', 'Erro de conexão ao servidor.')
    } finally {
      setSubmittingMeasurement(false)
    }
  }

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingCheckin(true)
    setNotification(null)
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          hungerScore,
          energyScore,
          difficultyScore,
          notes: checkinNotes,
        }),
      })
      if (res.ok) {
        showFeedback('success', 'Check-in enviado com sucesso ao seu nutricionista!')
        setCheckinNotes('')
        router.refresh()
      } else {
        const err = await res.json()
        showFeedback('error', err.error || 'Erro ao enviar check-in.')
      }
    } catch (e) {
      showFeedback('error', 'Erro de conexão ao servidor.')
    } finally {
      setSubmittingCheckin(false)
    }
  }

  const handleProgressPhotoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!progressPhotoFile) return
    setSubmittingPhoto(true)
    setNotification(null)
    try {
      const formData = new FormData()
      formData.append('clientId', client.id)
      formData.append('category', photoCategory)
      formData.append('photo', progressPhotoFile)

      const res = await fetch('/api/photos', { method: 'POST', body: formData })
      if (res.ok) {
        showFeedback('success', 'Foto de evolução enviada com sucesso!')
        setProgressPhotoFile(null)
        router.refresh()
      } else {
        const err = await res.json()
        showFeedback('error', err.error || 'Erro ao enviar foto.')
      }
    } catch (e) {
      showFeedback('error', 'Erro de conexão ao servidor.')
    } finally {
      setSubmittingPhoto(false)
    }
  }

  const chartData = client.measurements?.map((m: any) => ({
    date: new Date(m.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: m.weightKg,
  })) || []

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Feedback Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center space-x-2 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-[#F0F8F5] border border-[#D2EBDC] text-[#4A8C6F]'
              : 'bg-[#FFF5F5] border border-[#FFD8D8] text-[#D94949]'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Mobile Top Welcome Header */}
      <div className="card-clinical p-5 flex items-center justify-between bg-gradient-to-r from-white to-[#F0F4F7]">
        <div className="flex items-center space-x-4">
          <img
            src={client.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={client.user?.name || 'Paciente'}
            className="w-14 h-14 rounded-lg object-cover border-2 border-[#7897A8]"
          />
          <div>
            <span className="text-xs font-semibold text-[#7897A8] uppercase tracking-wider block">Meu Acompanhamento</span>
            <h1 className="text-lg font-bold text-[#26343B]">{client.user?.name}</h1>
            <p className="text-xs text-[#71808A]">Nutri: {client.professional?.user?.name || 'Nutricionista'}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="grid grid-cols-3 gap-1 bg-[#E8EEF3] p-1.5 rounded-lg">
        {[
          { id: 'plan', label: 'Plano', icon: Utensils },
          { id: 'log', label: 'Registrar', icon: Camera },
          { id: 'checkin', label: 'Check-in', icon: Calendar },
          { id: 'measurements', label: 'Peso', icon: TrendingDown },
          { id: 'evolution', label: 'Evolução', icon: Sparkles },
          { id: 'goals', label: 'Metas', icon: Target },
        ].map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center justify-center space-x-1 py-2 px-1 rounded-lg text-xs font-bold transition ${
                isActive ? 'bg-white text-[#26343B]' : 'text-[#71808A] hover:text-[#26343B]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: MEAL PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#26343B]">Plano Alimentar Vigente</h2>
            <span className="badge-active">v{activePlan?.version || 1} Publicado</span>
          </div>

          {!activePlan ? (
            <div className="card-clinical p-6 text-center text-xs text-[#71808A]">
              Nenhum plano alimentar publicado pelo seu nutricionista ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {activePlan.meals?.map((meal: any) => (
                <div key={meal.id} className="card-clinical p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8EE] pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-[#F0F4F7] text-[#7897A8] flex items-center justify-center font-bold text-xs">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#26343B]">{meal.name}</h3>
                        <span className="text-[11px] text-[#71808A]">{meal.time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedMealId(meal.id)
                        setActiveTab('log')
                      }}
                      className="btn-secondary text-xs py-1 px-2.5 flex items-center space-x-1"
                    >
                      <Camera className="w-3 h-3 text-[#7897A8]" />
                      <span>Registrar</span>
                    </button>
                  </div>

                  <ul className="space-y-1.5 pl-2 text-xs text-[#26343B]">
                    {meal.items?.map((item: any) => (
                      <li key={item.id} className="flex justify-between items-center py-1 border-b border-[#F6F8FA]">
                        <span>• {item.foodName}</span>
                        <span className="font-bold text-[#71808A]">
                          {item.quantity} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {meal.instructions && (
                    <p className="text-[11px] text-[#7897A8] bg-[#F6F8FA] p-2 rounded-lg italic">
                      💡 {meal.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTER MEAL LOG */}
      {activeTab === 'log' && (
        <form onSubmit={handleLogMealSubmit} className="card-clinical p-5 space-y-4">
          <h2 className="text-base font-bold text-[#26343B]">Registrar Refeição</h2>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">Qual refeição?</label>
            <select
              value={selectedMealId}
              onChange={(e) => setSelectedMealId(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none bg-white"
            >
              <option value="">Selecione a refeição do seu plano...</option>
              {activePlan?.meals?.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.time})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">Enviar Foto do Prato (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogPhoto(e.target.files?.[0] || null)}
              className="w-full text-xs p-2 rounded-lg border border-[#E2E8EE]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">Observações ou Trocas feitas</label>
            <textarea
              rows={3}
              placeholder="Ex: Segui 100%! Troquei o frango por patinho moído..."
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submittingLog}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{submittingLog ? 'Salvando...' : 'Salvar Registro'}</span>
          </button>
        </form>
      )}

      {/* TAB 3: CHECK-IN */}
      {activeTab === 'checkin' && (
        <form onSubmit={handleCheckinSubmit} className="card-clinical p-5 space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#26343B]">Check-in Periódico</h2>
            <p className="text-xs text-[#71808A]">Como foram suas refeições e bem-estar nos últimos dias?</p>
          </div>

          {/* Hunger Score */}
          <div className="space-y-2">
            <label className="flex justify-between text-xs font-bold text-[#26343B]">
              <span>Fome Percebida:</span>
              <span className="text-[#7897A8]">{hungerScore} / 5</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={hungerScore}
              onChange={(e) => setHungerScore(Number(e.target.value))}
              className="w-full accent-[#7897A8]"
            />
            <div className="flex justify-between text-[10px] text-[#71808A]">
              <span>Pouca fome</span>
              <span>Muita fome</span>
            </div>
          </div>

          {/* Energy Score */}
          <div className="space-y-2">
            <label className="flex justify-between text-xs font-bold text-[#26343B]">
              <span>Nível de Energia & Disposição:</span>
              <span className="text-[#7897A8]">{energyScore} / 5</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={energyScore}
              onChange={(e) => setEnergyScore(Number(e.target.value))}
              className="w-full accent-[#7897A8]"
            />
            <div className="flex justify-between text-[10px] text-[#71808A]">
              <span>Pouca disposição</span>
              <span>Alta disposição</span>
            </div>
          </div>

          {/* Difficulty Score */}
          <div className="space-y-2">
            <label className="flex justify-between text-xs font-bold text-[#26343B]">
              <span>Dificuldade em seguir o plano:</span>
              <span className="text-[#D94949]">{difficultyScore} / 5</span>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={difficultyScore}
              onChange={(e) => setDifficultyScore(Number(e.target.value))}
              className="w-full accent-[#D94949]"
            />
            <div className="flex justify-between text-[10px] text-[#71808A]">
              <span>Fácil</span>
              <span>Muito difícil</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">
              Conte ao seu nutricionista como foi a semana:
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Tive um aniversário no sábado mas consegui manter o foco no resto dos dias..."
              value={checkinNotes}
              onChange={(e) => setCheckinNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submittingCheckin}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{submittingCheckin ? 'Enviando...' : 'Enviar Check-in ao Nutri'}</span>
          </button>
        </form>
      )}

      {/* TAB 4: MEASUREMENTS */}
      {activeTab === 'measurements' && (
        <form onSubmit={handleMeasurementSubmit} className="card-clinical p-5 space-y-4">
          <h2 className="text-base font-bold text-[#26343B]">Registrar Peso & Cintura</h2>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">Peso Atual (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="ex: 65.4"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full text-sm p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26343B] mb-1">Circunferência da Cintura (cm, opcional)</label>
            <input
              type="number"
              step="0.5"
              placeholder="ex: 74.0"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
              className="w-full text-sm p-3 rounded-lg border border-[#E2E8EE] focus:ring-2 focus:ring-[#7897A8] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submittingMeasurement}
            className="btn-primary w-full py-3 text-xs font-bold"
          >
            {submittingMeasurement ? 'Salvando...' : 'Salvar Medição'}
          </button>
        </form>
      )}

      {/* TAB 5: EVOLUTION */}
      {activeTab === 'evolution' && (
        <div className="space-y-6">
          <div className="card-clinical p-5 space-y-3">
            <h2 className="text-base font-bold text-[#26343B]">Minha Evolução de Peso</h2>
            {chartData.length === 0 ? (
              <p className="text-xs text-[#71808A] py-8 text-center">Nenhum peso registrado ainda.</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8EE" />
                    <XAxis dataKey="date" stroke="#71808A" fontSize={10} />
                    <YAxis stroke="#71808A" fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="peso" stroke="#7897A8" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Upload Progress Photo */}
          <form onSubmit={handleProgressPhotoSubmit} className="card-clinical p-5 space-y-4">
            <h3 className="font-bold text-sm text-[#26343B]">Enviar Foto de Evolução</h3>
            <select
              value={photoCategory}
              onChange={(e) => setPhotoCategory(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[#E2E8EE] bg-white"
            >
              <option value="front">Frente</option>
              <option value="side">Lado / Perfil</option>
              <option value="back">Costas</option>
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProgressPhotoFile(e.target.files?.[0] || null)}
              className="w-full text-xs p-2 rounded-lg border border-[#E2E8EE]"
              required
            />
            <button
              type="submit"
              disabled={submittingPhoto}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              {submittingPhoto ? 'Enviando...' : 'Enviar Foto'}
            </button>
          </form>

          {/* Photos Grid */}
          <div className="card-clinical p-4 space-y-3">
            <h3 className="font-bold text-sm text-[#26343B]">Minhas Fotos Enviadas</h3>
            {(!client.progressPhotos || client.progressPhotos.length === 0) ? (
              <p className="text-xs text-[#71808A] text-center py-4">Nenhuma foto enviada ainda.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {client.progressPhotos.map((p: any) => (
                  <div key={p.id} className="space-y-1">
                    <img src={p.photoUrl} alt="Evolução" className="w-full h-36 rounded-lg object-cover border border-[#E2E8EE]" />
                    <span className="text-[10px] text-[#71808A] block text-center capitalize">
                      {new Date(p.takenAt).toLocaleDateString('pt-BR')} ({p.category})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: GOALS */}
      {activeTab === 'goals' && (
        <div className="card-clinical p-5 space-y-4">
          <h2 className="text-base font-bold text-[#26343B]">Minhas Metas</h2>
          {(!client.goals || client.goals.length === 0) ? (
            <p className="text-xs text-[#71808A] text-center py-6">Nenhuma meta cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {client.goals.map((g: any) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8EE] bg-[#F6F8FA]">
                  <div>
                    <h3 className="font-bold text-xs text-[#26343B]">{g.title}</h3>
                    <span className="text-[11px] text-[#71808A]">
                      Alvo: {g.targetValue} {g.unit}
                    </span>
                  </div>
                  <span className={g.status === 'COMPLETED' ? 'badge-active' : 'badge-paused'}>
                    {g.status === 'COMPLETED' ? 'Concluída' : 'Em Progresso'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
