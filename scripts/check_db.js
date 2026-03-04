
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking PPTSubmission...');
  const submissions = await prisma.pPTSubmission.findMany();
  console.log(`Found ${submissions.length} submissions.`);
  submissions.forEach(sub => {
    console.log(`ID: ${sub.id}, LocalPreview: ${sub.localPreviewUrl}, Preview: ${sub.previewUrl}`);
  });

  console.log('\nChecking PPTInterpretation...');
  const interpretations = await prisma.pPTInterpretation.findMany({
      include: { submission: true }
  });
  console.log(`Found ${interpretations.length} interpretations.`);
  interpretations.forEach(inter => {
    console.log(`ID: ${inter.id}, SubID: ${inter.submissionId}, Audio: ${inter.audioUrl}`);
    if (inter.submission) {
        console.log(`  Linked Submission Preview: ${inter.submission.previewUrl}, LocalPreview: ${inter.submission.localPreviewUrl}`);
    } else {
        console.log('  No linked submission!');
    }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
