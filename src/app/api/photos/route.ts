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
 const category = (formData.get('category') as string) || 'front'
 const photo = formData.get('photo') as File | null

 if (!clientId || !photo) {
 return NextResponse.json({ error: 'Foto e cliente são obrigatórios' }, { status: 400 })
 }

 const bytes = await photo.arrayBuffer()
 const buffer = Buffer.from(bytes)

 const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'progress')
 await mkdir(uploadsDir, { recursive: true })

 const filename = `${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
 const filePath = path.join(uploadsDir, filename)
 await writeFile(filePath, buffer)
 const photoUrl = `/uploads/progress/${filename}`

 const progressPhoto = await prisma.progressPhoto.create({
 data: {
 clientId,
 category,
 photoUrl,
 visibility: 'private',
 },
 })

 return NextResponse.json(progressPhoto, { status: 201 })
 } catch (error) {
 console.error('Error uploading progress photo:', error)
 return NextResponse.json({ error: 'Erro ao salvar foto de evolução' }, { status: 500 })
 }
}
