import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { DataUsageAgreement } from "@/components/data-usage-agreement"
import { redirect } from "next/navigation"
import { AgreementButton } from "./agreement-button"

export default async function DataUsageAgreementPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      name: true,
      role: true,
      managedJournal: { select: { name: true } },
      managedConference: { select: { name: true } }
    }
  })

  let entityName = user?.name || "用户"

  // 优先显示管理的期刊或会议名称
  if (user?.managedJournal?.name) {
    entityName = user.managedJournal.name
  } else if (user?.managedConference?.name) {
    entityName = user.managedConference.name
  } else if (user?.role === 'SUPER_ADMIN') {
    entityName = "OpenJunk 平台总编"
  }

  return (
    <div className="container py-10">
      <DataUsageAgreement userName={<AgreementButton journalName={entityName} />} />
    </div>
  )
}
