import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/Header'
import { ClientProfileClient } from './ClientProfileClient'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const session = await getSession()
 const { id } = await params

 const client = await prisma.client.findUnique({
 where: { id },
 include: {
 user: true,
 mealPlans: {
 include: {
 meals: {
 include: { items: true },
 orderBy: { sortOrder: 'asc' },
 },
 },
 orderBy: { version: 'desc' },
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
 aiSummaries: {
 orderBy: { createdAt: 'desc' },
 },
 },
 })

 if (!client) {
 notFound()
 }

 return (
 <div className="min-h-screen bg-[#F6F8FA]">
 <Header currentUser={{ name: session?.name || 'Dra. Amanda Silva', role: 'NUTRITIONIST' }} />
 <ClientProfileClient client={client} />
 </div>
 )
}
