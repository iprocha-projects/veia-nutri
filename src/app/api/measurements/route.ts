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
 const { weightKg, waistCm, hipCm, armCm, thighCm } = body

 if (!clientId || !weightKg) {
 return NextResponse.json({ error: 'O peso é obrigatório' }, { status: 400 })
 }

 const measurement = await prisma.measurement.create({
 data: {
 clientId,
 weightKg: parseFloat(weightKg),
 waistCm: waistCm ? parseFloat(waistCm) : null,
 hipCm: hipCm ? parseFloat(hipCm) : null,
 armCm: armCm ? parseFloat(armCm) : null,
 thighCm: thighCm ? parseFloat(thighCm) : null,
 },
 })

 return NextResponse.json(measurement, { status: 201 })
 } catch (error) {
 console.error('Error saving measurement:', error)
 return NextResponse.json({ error: 'Erro ao registrar medidas' }, { status: 500 })
 }
}
