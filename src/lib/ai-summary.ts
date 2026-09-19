import { prisma } from './prisma'

export interface SummaryDataSnapshot {
 clientName: string
 periodStart: string
 periodEnd: string
 initialWeightKg?: number
 latestWeightKg?: number
 weightChangeKg?: number
 totalMealLogs: number
 totalPhotosUploaded: number
 latestCheckin?: {
 hungerScore: number
 energyScore: number
 difficultyScore: number
 notes?: string
 date: string
 }
 recentLogNotes: string[]
}

export async function buildClientSummarySnapshot(clientId: string, days = 7): Promise<SummaryDataSnapshot> {
 const periodEnd = new Date()
 const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

 const client = await prisma.client.findUnique({
 where: { id: clientId },
 include: { user: true },
 })

 if (!client) throw new Error('Cliente não encontrado')

 // Measurements
 const measurements = await prisma.measurement.findMany({
 where: {
 clientId,
 measuredAt: { gte: periodStart },
 },
 orderBy: { measuredAt: 'asc' },
 })

 let initialWeightKg: number | undefined
 let latestWeightKg: number | undefined
 let weightChangeKg: number | undefined

 if (measurements.length > 0) {
 initialWeightKg = measurements[0].weightKg
 latestWeightKg = measurements[measurements.length - 1].weightKg
 if (latestWeightKg !== undefined && initialWeightKg !== undefined) {
 weightChangeKg = Number((latestWeightKg - initialWeightKg).toFixed(1))
 }
 } else {
 // Fallback to all-time latest if none in 7 days
 const lastMeasurement = await prisma.measurement.findFirst({
 where: { clientId },
 orderBy: { measuredAt: 'desc' },
 })
 if (lastMeasurement) latestWeightKg = lastMeasurement.weightKg
 }

 // Logs count
 const mealLogs = await prisma.mealLog.findMany({
 where: {
 clientId,
 loggedAt: { gte: periodStart },
 },
 select: { notes: true, photoUrl: true },
 })

 const totalMealLogs = mealLogs.length
 const totalPhotosUploaded = mealLogs.filter((l: any) => l.photoUrl).length
 const recentLogNotes = mealLogs.map((l: any) => l.notes).filter(Boolean) as string[]

 // Checkins
 const checkin = await prisma.checkin.findFirst({
 where: { clientId },
 orderBy: { submittedAt: 'desc' },
 })

 return {
 clientName: client.user.name,
 periodStart: periodStart.toISOString().split('T')[0],
 periodEnd: periodEnd.toISOString().split('T')[0],
 initialWeightKg,
 latestWeightKg,
 weightChangeKg,
 totalMealLogs,
 totalPhotosUploaded,
 latestCheckin: checkin
 ? {
 hungerScore: checkin.hungerScore,
 energyScore: checkin.energyScore,
 difficultyScore: checkin.difficultyScore,
 notes: checkin.notes || undefined,
 date: checkin.submittedAt.toISOString().split('T')[0],
 }
 : undefined,
 recentLogNotes,
 }
}

export async function generateAISummary(snapshot: SummaryDataSnapshot): Promise<{ summary: string; model: string }> {
 const openaiKey = process.env.OPENAI_API_KEY
 const geminiKey = process.env.GEMINI_API_KEY

 const prompt = `Você é um assistente especializado para nutricionistas. Sua função é consolidar um resumo semanal objetivo sobre o paciente ${snapshot.clientName} com base estrita nos dados fornecidos.

REGRAS RÍGIDAS:
1. NÃO faça diagnósticos clínicos, prescrições ou alterações na dieta.
2. Seja objetivo, acolhedor e profissional.
3. Apresente em tópicos claros (Markdown).

DADOS DO PERÍODO (${snapshot.periodStart} até ${snapshot.periodEnd}):
- Peso Atual: ${snapshot.latestWeightKg ? snapshot.latestWeightKg + ' kg' : 'Não registrado no período'}
- Variação de Peso no Período: ${snapshot.weightChangeKg !== undefined ? (snapshot.weightChangeKg > 0 ? '+' : '') + snapshot.weightChangeKg + ' kg' : 'Sem dados'}
- Total de Refeições Registradas: ${snapshot.totalMealLogs}
- Fotos de Pratos Enviadas: ${snapshot.totalPhotosUploaded}
- Úlimo Check-in: ${
 snapshot.latestCheckin
 ? `Fome ${snapshot.latestCheckin.hungerScore}/5, Disposição/Energia ${snapshot.latestCheckin.energyScore}/5, Dificuldade ${snapshot.latestCheckin.difficultyScore}/5. Nota: "${snapshot.latestCheckin.notes || 'Sem observações'}"`
 : 'Nenhum check-in recente'
 }
- Observações nas Refeições: ${snapshot.recentLogNotes.length > 0 ? snapshot.recentLogNotes.join(' | ') : 'Nenhuma observação informada'}`

 // 1. Try OpenAI if key is present
 if (openaiKey && openaiKey.trim().length > 5) {
 try {
 const res = await fetch('https://api.openai.com/v1/chat/completions', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${openaiKey}`,
 },
 body: JSON.stringify({
 model: 'gpt-4o-mini',
 messages: [
 { role: 'system', content: 'Você é um assistente especializado para nutricionistas.' },
 { role: 'user', content: prompt },
 ],
 temperature: 0.3,
 }),
 })

 if (res.ok) {
 const data = await res.json()
 const text = data.choices[0]?.message?.content
 if (text) return { summary: text, model: 'gpt-4o-mini' }
 }
 } catch (e) {
 console.warn('Fallback: Erro ao chamar OpenAI API, usando motor local inteligente.', e)
 }
 }

 // 2. Try Gemini API if key present
 if (geminiKey && geminiKey.trim().length > 5) {
 try {
 const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 contents: [{ parts: [{ text: prompt }] }],
 }),
 })

 if (res.ok) {
 const data = await res.json()
 const text = data.candidates?.[0]?.content?.parts?.[0]?.text
 if (text) return { summary: text, model: 'gemini-1.5-flash' }
 }
 } catch (e) {
 console.warn('Fallback: Erro ao chamar Gemini API, usando motor local inteligente.', e)
 }
 }

 // 3. Fallback Smart Deterministic Summary Engine (0 external dependencies required)
 const weightSummary =
 snapshot.weightChangeKg !== undefined
 ? snapshot.weightChangeKg < 0
 ? `Apresentou redução positiva de **${Math.abs(snapshot.weightChangeKg)} kg** no período analisado.`
 : snapshot.weightChangeKg > 0
 ? `Aumento de **+${snapshot.weightChangeKg} kg** no período analisado.`
 : `Peso mantido estável em **${snapshot.latestWeightKg} kg**.`
 : 'Sem medições registradas no período.'

 const logEngagement =
 snapshot.totalMealLogs > 5
 ? `Alta adesão com **${snapshot.totalMealLogs} refeições registradas** e ${snapshot.totalPhotosUploaded} foto(s) de pratos.`
 : snapshot.totalMealLogs > 0
 ? `Adesão moderada com **${snapshot.totalMealLogs} registros** no período.`
 : `⚠️ O paciente não registrou refeições nos últimos 7 dias.`

 const checkinSummary = snapshot.latestCheckin
 ? `Pontuação de Fome: **${snapshot.latestCheckin.hungerScore}/5**, Energia: **${snapshot.latestCheckin.energyScore}/5**, Dificuldade: **${snapshot.latestCheckin.difficultyScore}/5**.`
 : 'Sem check-in recente no período.'

 const notesSummary =
 snapshot.recentLogNotes.length > 0
 ? `Relatos destacados: "${snapshot.recentLogNotes.slice(0, 3).join('"; "')}"`
 : 'Nenhuma observação extra relatada pelo paciente.'

 const fallbackText = `• **Resumo da Semana**: ${snapshot.clientName} teve um acompanhamento com ${logEngagement}
• **Evolução Corporal**: ${weightSummary}
• **Percepção e Sinais**: ${checkinSummary}
• **Observações do Paciente**: ${notesSummary}
• **Atenção Recomendada ao Nutricionista**: ${
 snapshot.latestCheckin && snapshot.latestCheckin.difficultyScore >= 4
 ? 'Verificar relatos de alta dificuldade nas refeições ou fins de semana.'
 : snapshot.totalMealLogs === 0
 ? 'Entrar em contato para incentivar o registro das refeições na plataforma.'
 : 'Acompanhamento fluindo bem. Revisar metas para o próximo período.'
 }`

 return { summary: fallbackText, model: 'nutrimvo-smart-engine-v1' }
}
