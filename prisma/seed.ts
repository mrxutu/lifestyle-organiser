import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

function generatePassword() {
  return randomBytes(9).toString('base64url')
}

async function upsertUser(email: string, name: string, householdId: string) {
  const password = generatePassword()
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, householdId },
    create: { email, name, passwordHash, householdId },
  })

  return { email, password }
}

const WATCHLIST_SOURCES = ['Apple TV', 'Netflix', 'IP Stream', 'Prime', 'Terrestrial']

async function main() {
  const household = await prisma.household.upsert({
    where: { id: 'seed-household' },
    update: {},
    create: { id: 'seed-household', name: 'Cozens Household' },
  })

  const credentials = [
    await upsertUser('p@ulcozens.com', 'Paul', household.id),
    await upsertUser('nichola@cozens.xyz', 'Nick', household.id),
  ]

  for (const name of WATCHLIST_SOURCES) {
    await prisma.watchlistSource.upsert({ where: { name }, update: {}, create: { name } })
  }

  console.log('\nSeeded accounts (save these now, they will not be shown again):\n')
  for (const { email, password } of credentials) {
    console.log(`  ${email}  →  ${password}`)
  }
  console.log('')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
