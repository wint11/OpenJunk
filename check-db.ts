
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, name: true, email: true, role: true, managedJournalId: true, createdAt: true }
  })

  console.log("Recent Users:")
  users.forEach(user => {
    console.log(JSON.stringify(user, null, 2))
  })

  const journals = await prisma.journal.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, name: true, createdAt: true }
  })
  
  console.log("\nRecent Journals:")
  journals.forEach(journal => {
    console.log(JSON.stringify(journal, null, 2))
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
