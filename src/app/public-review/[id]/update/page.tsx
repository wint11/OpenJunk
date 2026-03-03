
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UpdateForm } from "./update-form"
import { auth } from "@/auth"

interface PreprintUpdatePageProps {
  params: Promise<{ id: string }>
}

export default async function PreprintUpdatePage({ params }: PreprintUpdatePageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold">请先登录</h1>
        <p className="text-muted-foreground mt-2">您需要登录后才能更新预印本。</p>
      </div>
    )
  }

  const preprint = await prisma.preprint.findUnique({
    where: { id }
  })

  if (!preprint) {
    notFound()
  }

  // Permission check
  const isUploader = session.user.id === preprint.uploaderId
  const isSuperAdmin = session.user.role === "SUPER_ADMIN"

  if (!isUploader && !isSuperAdmin) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold text-red-500">无权访问</h1>
        <p className="text-muted-foreground mt-2">您没有权限编辑此预印本。</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <UpdateForm preprint={preprint} />
    </div>
  )
}
