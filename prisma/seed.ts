import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Initializing database seed...')

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@exemplo.com'
  const adminPassword = process.env.ADMIN_PASSWORD || '123456'
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  // Safely upsert Master Admin without deleting existing users or records
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      name: 'Super Admin',
    },
  })

  console.log(`✅ Master Admin ready: ${adminUser.email}`)
  console.log('--------------------------------------------------')
  console.log(`🔑 Admin: ${adminEmail}`)
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
