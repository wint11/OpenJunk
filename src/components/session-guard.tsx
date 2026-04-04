import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function SessionGuard() {
  const session = await auth()
  
  if (session?.user?.id) {
    // [优化]: 仅在非生产环境或特殊情况下才进行数据库校验，减少全局布局的数据库压力
    // 生产环境中由于 Session 有过期时间，且 JWT 中包含了核心信息，可以跳过每次页面加载时的数据库查询
    if (process.env.NODE_ENV !== 'production') {
      // Check if user actually exists in database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      })

      if (!user) {
        // User in session but not in DB -> Stale cookie
        // Redirect to signout flow
        console.log("SessionGuard: Found stale session for non-existent user, redirecting to signout")
        return (
          <form action={async () => {
            'use server'
            await signOut({ redirectTo: "/" })
          }}>
            <button type="submit" className="hidden" id="auto-signout-btn"></button>
            <script dangerouslySetInnerHTML={{__html: `document.getElementById('auto-signout-btn').click()`}}></script>
          </form>
        )
      }
    }
  }

  return null
}
