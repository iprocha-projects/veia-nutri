'use client'

interface CheckinsTabProps {
  checkins: any[]
}

export function CheckinsTab({ checkins }: CheckinsTabProps) {
  return (
    <div className="card-clinical p-6 space-y-4">
      <h2 className="text-lg font-bold text-[#26343B]">Histórico de Check-ins do Paciente</h2>
      <div className="space-y-3">
        {checkins.length === 0 ? (
          <p className="text-xs text-[#71808A] text-center py-6">Nenhum check-in enviado.</p>
        ) : (
          checkins.map((chk: any) => (
            <div key={chk.id} className="card-clinical p-4 flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#71808A]">
                  Enviado em: {new Date(chk.submittedAt).toLocaleString('pt-BR')}
                </span>
                {chk.notes && <p className="text-sm font-medium text-[#26343B]">"{chk.notes}"</p>}
              </div>
              <div className="flex space-x-4 text-xs">
                <div className="bg-[#F6F8FA] p-2.5 rounded-lg border border-[#E2E8EE]">
                  <span className="text-[#71808A] block">Fome</span>
                  <strong className="text-sm text-[#26343B]">{chk.hungerScore}/5</strong>
                </div>
                <div className="bg-[#F6F8FA] p-2.5 rounded-lg border border-[#E2E8EE]">
                  <span className="text-[#71808A] block">Energia</span>
                  <strong className="text-sm text-[#26343B]">{chk.energyScore}/5</strong>
                </div>
                <div className="bg-[#F6F8FA] p-2.5 rounded-lg border border-[#E2E8EE]">
                  <span className="text-[#71808A] block">Dificuldade</span>
                  <strong className="text-sm text-[#D94949]">{chk.difficultyScore}/5</strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
