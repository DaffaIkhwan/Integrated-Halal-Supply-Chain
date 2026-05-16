import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordK1 = await hash('pakar123', 12)
  const passwordK2 = await hash('pakar123', 12)

  await prisma.user.upsert({
    where: { email: 'pakark1@halal.com' },
    update: {},
    create: {
      name: 'Pakar Pembobotan K1',
      email: 'pakark1@halal.com',
      password: passwordK1,
      role: 'PAKAR_K1',
    },
  })

  await prisma.user.upsert({
    where: { email: 'pakark2@halal.com' },
    update: {},
    create: {
      name: 'Pakar Risiko K2',
      email: 'pakark2@halal.com',
      password: passwordK2,
      role: 'PAKAR_K2',
    },
  })

  console.log('Pakar K1 and K2 created successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
