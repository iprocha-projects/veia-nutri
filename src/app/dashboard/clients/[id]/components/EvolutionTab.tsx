'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface EvolutionTabProps {
  measurements: any[]
  progressPhotos: any[]
}

export function EvolutionTab({ measurements, progressPhotos }: EvolutionTabProps) {
  const chartData = measurements.map((m: any) => ({
    date: new Date(m.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    peso: m.weightKg,
    cintura: m.waistCm,
  }))

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="card-clinical p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#26343B]">Evolução do Peso (kg) e Cintura (cm)</h2>
        {chartData.length === 0 ? (
          <p className="text-xs text-[#71808A] py-12 text-center">Nenhuma medição registrada ainda.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8EE" />
                <XAxis dataKey="date" stroke="#71808A" fontSize={12} />
                <YAxis stroke="#71808A" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="peso" stroke="#7897A8" strokeWidth={3} name="Peso (kg)" />
                <Line type="monotone" dataKey="cintura" stroke="#B8C9C1" strokeWidth={3} name="Cintura (cm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Progress Photos Gallery */}
      <div className="card-clinical p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#26343B]">Galeria de Fotos de Evolução (Antes / Depois)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {progressPhotos.length === 0 ? (
            <p className="text-xs text-[#71808A] col-span-3 text-center py-6">
              Nenhuma foto de evolução cadastrada ainda.
            </p>
          ) : (
            progressPhotos.map((photo: any) => (
              <div key={photo.id} className="card-clinical p-3 space-y-2">
                <img
                  src={photo.photoUrl}
                  alt="Evolução"
                  className="w-full h-56 rounded-lg object-cover border border-[#E2E8EE]"
                />
                <div className="flex justify-between text-xs text-[#71808A]">
                  <span className="capitalize font-semibold text-[#26343B]">Visão: {photo.category}</span>
                  <span>{new Date(photo.takenAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
