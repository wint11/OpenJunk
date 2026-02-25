import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { NotificationList } from "../../admin/messages/notification-list"

export default async function AuthorMessagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: {
        select: { name: true, email: true }
      }
    }
  })

  // Format notifications for client component
  const formattedNotifications = notifications.map(n => ({
    ...n,
    sender: n.sender ? {
      name: n.sender.name,
      email: n.sender.email
    } : null
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">消息中心</h1>
      </div>
      <NotificationList notifications={formattedNotifications} />
    </div>
  )
}
