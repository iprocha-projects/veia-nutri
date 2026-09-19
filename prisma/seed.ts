import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database reset...')

  // Clean database
  await prisma.aISummary.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.checkin.deleteMany()
  await prisma.progressPhoto.deleteMany()
  await prisma.measurement.deleteMany()
  await prisma.mealLog.deleteMany()
  await prisma.mealItem.deleteMany()
  await prisma.meal.deleteMany()
  await prisma.mealPlan.deleteMany()
  await prisma.client.deleteMany()
  await prisma.professional.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('123456', 10)

  // Create Master Admin
  await prisma.user.create({
    data: {
      email: 'admin@exemplo.com',
      passwordHash,
      role: Role.ADMIN,
      name: 'Super Admin',
    },
  })

  console.log('✅ Database reset successfully! All mock data removed.')
  console.log('--------------------------------------------------')
  console.log('🔑 Credenciais de Acesso (Única Conta):')
  console.log('   Admin: admin@exemplo.com | Senha: 123456')
  console.log('--------------------------------------------------')
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
