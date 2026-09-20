import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { TemplatesManager } from './TemplatesManager'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const session = await getSession()
  if (!session || session.role !== 'NUTRITIONIST' || !session.professionalId) {
    redirect('/login')
  }

  const templates = await prisma.mealPlanTemplate.findMany({
    where: { professionalId: session.professionalId },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-[#F6F8FA]">
      <Header currentUser={{ id: session.userId, name: session.name, role: 'NUTRITIONIST' }} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TemplatesManager initialTemplates={templates} />
      </main>
    </div>
  )
}
