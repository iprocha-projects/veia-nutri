'use client'

interface MealLogsTabProps {
  mealLogs: any[]
}

export function MealLogsTab({ mealLogs }: MealLogsTabProps) {
  return (
    <div className="card-clinical p-6 space-y-4">
      <h2 className="text-lg font-bold text-[#26343B]">Registros de Refeições Enviados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mealLogs.length === 0 ? (
          <p className="text-xs text-[#71808A] col-span-3 text-center py-8">
            Nenhum registro de refeição enviado até o momento.
          </p>
        ) : (
          mealLogs.map((log: any) => (
            <div key={log.id} className="card-clinical p-4 space-y-3">
              {log.photoUrl && (
                <img
                  src={log.photoUrl}
                  alt="Refeição"
                  className="w-full h-44 rounded-lg object-cover border border-[#E2E8EE]"
                />
              )}
              <div>
                <div className="flex justify-between items-center text-xs text-[#71808A]">
                  <span className="font-bold text-[#26343B]">{log.meal?.name || 'Refeição Registrada'}</span>
                  <span>{new Date(log.loggedAt).toLocaleDateString('pt-BR')}</span>
                </div>
                {log.notes && <p className="text-xs text-[#26343B] mt-2 italic">"{log.notes}"</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
