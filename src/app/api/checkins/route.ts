import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
 }

 try {
 const body = await req.json()
 const clientId = body.clientId || session.clientId
 const { hungerScore, energyScore, difficultyScore, notes } = body

 if (!clientId || !hungerScore || !energyScore || !difficultyScore) {
 return NextResponse.json({ error: 'Preencha todos os campos de avaliação' }, { status: 400 })
 }

 const checkin = await prisma.checkin.create({
 data: {
 clientId,
 hungerScore: parseInt(hungerScore, 10),
 energyScore: parseInt(energyScore, 10),
 difficultyScore: parseInt(difficultyScore, 10),
 notes,
 },
 })

 return NextResponse.json(checkin, { status: 201 })
 } catch (error) {
 console.error('Error submitting checkin:', error)
 return NextResponse.json({ error: 'Erro ao enviar check-in' }, { status: 500 })
 }
}
