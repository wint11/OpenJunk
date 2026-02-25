import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  PenTool, 
  LayoutDashboard, 
  PlusCircle, 
  BookOpen, 
  FileEdit, 
  CheckSquare, 
  FileText,
  Mail
} from "lucide-react"

export default async function AuthorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  
  const role = session.user?.role ?? ""
  if (!['REVIEWER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    redirect("/")
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 hidden md:block">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/author" className="font-bold text-lg">投稿中心</Link>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/author"><LayoutDashboard className="mr-2 h-4 w-4"/> 概览</Link>
          </Button>

          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/author/messages"><Mail className="mr-2 h-4 w-4"/> 消息中心</Link>
          </Button>
          
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground mt-4">
            稿件管理
          </div>
          
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/submission"><PlusCircle className="mr-2 h-4 w-4"/> 投稿新论文</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/author/works"><FileText className="mr-2 h-4 w-4"/> 我的稿件</Link>
          </Button>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 bg-background">
        <div className="h-full p-8">
           {children}
        </div>
      </main>
    </div>
  )
}
