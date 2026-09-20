import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/Header'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Users, Plus, Activity, ChevronRight, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const session = await getSession()

  if (!session || session.role !== 'NUTRITIONIST') {
    redirect('/login')
  }

  const professional = await prisma.professional.findUnique({
    where: { id: session.professionalId },
    include: {
      user: true,
      clients: {
        include: {
          user: true,
          mealPlans: { orderBy: { createdAt: 'desc' }, take: 1 },
          measurements: { orderBy: { measuredAt: 'desc' }, take: 1 },
          mealLogs: { orderBy: { loggedAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const clients = professional?.clients || []

  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      <Header currentUser={{ name: session.name, role: 'NUTRITIONIST' }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#26343B] tracking-tight">
              Meus Pacientes
            </h1>
            <p className="text-sm text-[#71808A] mt-1">
              Gerencie o acompanhamento contínuo e os planos nutricionais de cada paciente.
            </p>
          </div>

          <Link
            href="/dashboard/clients/new"
            className="btn-primary flex items-center space-x-2 text-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </Link>
        </div>

        {/* Clients List Card */}
        <div className="card-clinical overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E2E8EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#71808A] uppercase tracking-wider">
              Total de {clients.length} paciente{clients.length === 1 ? '' : 's'} cadastrado{clients.length === 1 ? '' : 's'}
            </span>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#F0F4F7] text-[#7897A8] flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#26343B]">Nenhum paciente cadastrado</h3>
                <p className="text-xs text-[#71808A]">Cadastre seu primeiro paciente para iniciar o acompanhamento.</p>
              </div>
              <Link
                href="/dashboard/clients/new"
                className="btn-primary inline-flex items-center space-x-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Paciente</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8EE]">
              {clients.map((client) => {
                const latestPlan = client.mealPlans[0]
                const latestMeasurement = client.measurements[0]
                const lastLog = client.mealLogs[0]

                return (
                  <div
                    key={client.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFBFD] transition"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={client.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={client.user.name}
                        className="w-12 h-12 rounded-full object-cover border border-[#E2E8EE]"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-base text-[#26343B]">{client.user.name}</h3>
                          <span className={client.status === 'ACTIVE' ? 'badge-active' : 'badge-paused'}>
                            {client.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#71808A] mt-1">
                          <span>E-mail: {client.user.email}</span>
                          <span>•</span>
                          <span>Tel: {client.user.phone || 'Não informado'}</span>
                          <span>•</span>
                          <span>
                            Plano:{' '}
                            <strong className="text-[#26343B]">
                              {latestPlan ? `v${latestPlan.version} (${latestPlan.status})` : 'Sem plano'}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Peso:{' '}
                            <strong className="text-[#26343B]">
                              {latestMeasurement ? `${latestMeasurement.weightKg} kg` : 'N/I'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-0 border-[#E2E8EE]">
                      <span className="text-xs text-[#71808A] block sm:hidden">
                        Último registro: {lastLog ? new Date(lastLog.loggedAt).toLocaleDateString('pt-BR') : 'Nenhum'}
                      </span>
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="btn-secondary text-xs flex items-center space-x-1.5 py-2 px-3.5 hover:border-[#7897A8]"
                      >
                        <Activity className="w-3.5 h-3.5 text-[#7897A8]" />
                        <span>Abrir Prontuário</span>
                        <ChevronRight className="w-3 h-3 text-[#71808A]" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
