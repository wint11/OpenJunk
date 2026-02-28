import { prisma } from "@/lib/prisma"
import { JOURNAL_DEFAULT_TEMPLATE } from "./templates/journal-default"

export async function seedTemplates() {
  try {
    const defaultTemplateCode = JOURNAL_DEFAULT_TEMPLATE;

    await prisma.journalTemplate.upsert({
      where: { name: 'default' },
      update: { code: defaultTemplateCode },
      create: {
        name: 'default',
        code: defaultTemplateCode,
        description: 'Default journal homepage template (Handlebars)',
        isDefault: true
      }
    })
    console.log("Journal templates seeded successfully")
  } catch (error) {
    console.error("Failed to seed journal templates:", error)
  }
}
