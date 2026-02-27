
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EditAwardForm } from "./edit-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminAwardEditPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  const { id } = await params
  const award = await prisma.award.findUnique({
    where: { id },
  })

  if (!award) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/awards">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">编辑奖项: {award.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          {/* @ts-ignore */}
          <EditAwardForm award={award} />
        </CardContent>
      </Card>
    </div>
  )
}
