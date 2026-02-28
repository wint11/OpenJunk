import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { DesignEditor } from "./design-editor"
import { JOURNAL_DEFAULT_TEMPLATE } from "@/lib/templates/journal-default"

interface DesignPageProps {
  params: Promise<{ id: string }>
}

export default async function DesignPage(props: DesignPageProps) {
  const params = await props.params;
  const journal = await prisma.journal.findUnique({
    where: { id: params.id },
    include: {
        _count: {
          select: { papers: true, admins: true, reviewers: true }
        },
        papers: {
          where: { status: 'PUBLISHED' },
          orderBy: { updatedAt: 'desc' },
          take: 3, // Only need a few for the preview
          include: {
              uploader: true
          }
        }
      }
  })

  if (!journal) {
    notFound()
  }

  // Fetch default template from database
  const defaultTemplateRecord = await prisma.journalTemplate.findUnique({
    where: { name: 'default' }
  });
  
  // Fallback to file system or hardcoded string if DB fetch fails (though it shouldn't after seeding)
  // Use the imported constant as fallback
  let defaultTemplate = defaultTemplateRecord?.code || JOURNAL_DEFAULT_TEMPLATE;

  // Serialize the journal data to pass to client component
  // We need to be careful with Dates, but since we are just using them for strings in the template, 
  // we can handle them or let Next.js serialize if possible (Next.js server components to client props serialization)
  // Actually, for simplicity in the template generation, let's pass a simplified object.
  const journalData = {
    name: journal.name,
    description: journal.description,
    paperCount: journal._count.papers,
    adminCount: journal._count.admins + journal._count.reviewers,
    createdAt: journal.createdAt.toLocaleDateString(),
    guidelines: journal.guidelines,
    guidelinesUrl: journal.guidelinesUrl,
    papers: journal.papers.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        author: p.uploader?.name || "匿名作者",
        date: p.updatedAt.toLocaleDateString(),
        category: p.category
    }))
  }

  return (
    <div className="h-screen flex flex-col">
      <DesignEditor 
        journalId={journal.id} 
        initialConfig={journal.customConfig || undefined} 
        defaultTemplate={defaultTemplate}
        journalData={journalData}
      />
    </div>
  )
}
