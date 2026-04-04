import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function exportDb() {
  const prisma = new PrismaClient();
  const dataDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Use Prisma's internal metadata to get all model names dynamically
  const models = PrismaClient.dmmf ? 
    PrismaClient.dmmf.datamodel.models.map(m => m.name.charAt(0).toLowerCase() + m.name.slice(1)) :
    Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));

  console.log(`Found ${models.length} models to export.`);

  for (const model of models) {
    if (prisma[model]) {
      console.log(`Exporting ${model}...`);
      try {
        const data = await prisma[model].findMany();
        fs.writeFileSync(path.join(dataDir, `${model}.json`), JSON.stringify(data, null, 2));
        console.log(`  -> Exported ${data.length} records to ${model}.json`);
      } catch (e) {
        console.error(`  -> Failed to export ${model}:`, e.message);
      }
    } else {
      console.warn(`Model ${model} not found in Prisma Client.`);
    }
  }
  await prisma.$disconnect();
  console.log('Export complete.');
}

exportDb().catch(e => {
  console.error(e);
  process.exit(1);
});
