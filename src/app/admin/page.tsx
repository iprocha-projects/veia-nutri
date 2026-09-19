import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LogOut, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminClientView } from './AdminClientView'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
 const session = await getSession()
 
 if (!session || session.role !== 'ADMIN') {
 redirect('/login')
 }

 const professionals = await prisma.professional.findMany({
 include: {
 user: true,
 _count: {
 select: { clients: true }
 }
 },
 orderBy: { createdAt: 'desc' }
 })

 const totalClients = await prisma.client.count()
 const totalNutris = professionals.length

 return (
 <div className="min-h-screen bg-[#F6F8FA]">
 <header className="bg-white border-b border-[#E2E8EE] sticky top-0 z-40">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex justify-between items-center h-16">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-lg bg-[#26343B] text-white flex items-center justify-center font-bold">
 <ShieldCheck className="w-5 h-5" />
 </div>
 <div>
 <span className="font-bold text-[#26343B] block leading-tight">Master Admin</span>
 <span className="text-xs text-[#71808A]">{session.name}</span>
 </div>
 </div>
 
 <Link href="/login" className="text-sm font-semibold text-[#D94949] hover:bg-[#FFF5F5] px-3 py-2 rounded-lg flex items-center space-x-2">
 <LogOut className="w-4 h-4" />
 <span>Sair</span>
 </Link>
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
 <AdminClientView 
 professionals={professionals} 
 totalClients={totalClients} 
 totalNutris={totalNutris} 
 />
 </main>
 </div>
 )
}
