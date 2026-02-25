import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function SessionGuard() {
  const session = await auth()
  
  if (session?.user?.id) {
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

  return null
}
