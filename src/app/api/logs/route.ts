import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
 const session = await getSession()
 if (!session) {
 return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
 }

 try {
 const formData = await req.formData()
 const clientId = (formData.get('clientId') as string) || session.clientId
 const mealId = formData.get('mealId') as string
 const notes = formData.get('notes') as string
 const photo = formData.get('photo') as File | null

 if (!clientId) {
 return NextResponse.json({ error: 'Cliente não especificado' }, { status: 400 })
 }

 let photoUrl: string | undefined

 if (photo && photo.size > 0) {
 const bytes = await photo.arrayBuffer()
 const buffer = Buffer.from(bytes)

 const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'meals')
 await mkdir(uploadsDir, { recursive: true })

 const filename = `${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
 const filePath = path.join(uploadsDir, filename)
 await writeFile(filePath, buffer)
 photoUrl = `/uploads/meals/${filename}`
 }

 const log = await prisma.mealLog.create({
 data: {
 clientId,
 mealId: mealId && mealId !== 'null' ? mealId : null,
 notes,
 photoUrl,
 },
 include: { meal: true },
 })

 return NextResponse.json(log, { status: 201 })
 } catch (error) {
 console.error('Error logging meal:', error)
 return NextResponse.json({ error: 'Erro ao registrar refeição' }, { status: 500 })
 }
}
