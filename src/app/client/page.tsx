import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/Header'
import { ClientAppView } from './ClientAppView'

export const dynamic = 'force-dynamic'

export default async function ClientAppPage() {
 const session = await getSession()

 if (!session || session.role !== 'CLIENT') {
 return <div>Acesso negado.</div>
 }

 // Fetch logged in client
 const client = await prisma.client.findUnique({
 where: { id: session.clientId },
 include: {
 user: true,
 professional: { include: { user: true } },
 mealPlans: {
 where: { status: 'PUBLISHED' },
 include: {
 meals: {
 include: { items: true },
 orderBy: { sortOrder: 'asc' },
 },
 },
 orderBy: { version: 'desc' },
 take: 1,
 },
 mealLogs: {
 include: { meal: true },
 orderBy: { loggedAt: 'desc' },
 },
 measurements: {
 orderBy: { measuredAt: 'asc' },
 },
 progressPhotos: {
 orderBy: { takenAt: 'desc' },
 },
 checkins: {
 orderBy: { submittedAt: 'desc' },
 },
 goals: {
 orderBy: { startsAt: 'desc' },
 },
 },
 })

 if (!client) {
 return <div className="p-8 text-center text-sm text-[#71808A]">Nenhum perfil de cliente cadastrado ainda.</div>
 }

 return (
 <div className="min-h-screen bg-[#F6F8FA]">
 <Header currentUser={client.user as any} />
 <ClientAppView client={client} />
 </div>
 )
}
