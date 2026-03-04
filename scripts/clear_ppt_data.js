
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing PPT related tables...');

  try {
    // Delete in order to respect foreign key constraints
    const interpretations = await prisma.pPTInterpretation.deleteMany({});
    console.log(`Deleted ${interpretations.count} interpretations.`);

    const submissions = await prisma.pPTSubmission.deleteMany({});
    console.log(`Deleted ${submissions.count} submissions.`);
    
    console.log('All PPT related data cleared successfully.');
  } catch (e) {
    console.error('Error clearing data:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
