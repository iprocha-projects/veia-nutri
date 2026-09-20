'use client'

import { Sparkles } from 'lucide-react'

interface OverviewTabProps {
  client: any
  currentSummary: any
  activePlan: any
}

export function OverviewTab({ client, currentSummary, activePlan }: OverviewTabProps) {
  return (
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
            {client.mealLogs.length === 0 ? (
              <p className="text-xs text-[#71808A] py-4 text-center">Nenhum registro recente.</p>
            ) : (
              client.mealLogs.slice(0, 5).map((log: any) => (
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
              ))
            )}
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
                <span className="text-[#26343B] font-medium">{m.items?.length || 0} itens</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
