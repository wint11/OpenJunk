import Link from "next/link"
import { Trash2, User, PenTool, LayoutDashboard, LogOut, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Suspense } from "react"
import { SearchBar } from "@/components/search-bar"
import { auth, signOut } from "@/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MainNav } from "@/components/main-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cookies } from "next/headers"
import { decode } from "next-auth/jwt"
import { addNewAccount, switchAccount } from "@/app/actions/account-switch"

export async function Navbar() {
  const session = await auth()
  const userRole = session?.user?.role ?? ""
  
  let dashboardName = "期刊管理后台"
  if (userRole === "SUPER_ADMIN") {
    dashboardName = "系统后台"
  } else if (userRole === "ADMIN" && session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { fundAdminCategories: true }
    })
    if (dbUser && dbUser.fundAdminCategories.length > 0) {
      dashboardName = "基金管理后台"
    }
  }

  // Get stored accounts
  const cookieStore = await cookies()
  const ACCOUNT_COOKIE_PREFIX = 'smartread-account-'
  const storedAccounts: { id: string; name?: string | null; email?: string | null; image?: string | null }[] = []
  const SESSION_COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token'

  if (session) {
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.startsWith(ACCOUNT_COOKIE_PREFIX)) {
        try {
          const token = await decode({ 
            token: cookie.value, 
            secret: process.env.AUTH_SECRET!,
            salt: SESSION_COOKIE_NAME
          })
          if (token && token.sub) {
              storedAccounts.push({
                id: token.sub,
                name: token.name,
                email: token.email,
                image: token.picture,
              })
          }
        } catch (e) {
          console.error("Failed to decode stored account token", e)
        }
      }
    }
  }

  const canAddAccount = storedAccounts.length < 2 // 1 active + 2 stored = 3 total

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Trash2 className="h-6 w-6" />
          <span className="hidden text-lg font-bold sm:inline-block">
            OpenJunk
          </span>
        </Link>
        <MainNav role={userRole} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="hidden md:block">
            <Suspense fallback={<div className="w-[200px] h-9 bg-muted animate-pulse rounded-md" />}>
              <SearchBar />
            </Suspense>
          </div>
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild id="user-menu-trigger">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                      <AvatarFallback>{session.user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                       <User className="mr-2 h-4 w-4" /> 个人中心
                    </Link>
                  </DropdownMenuItem>
                  {['AUTHOR'].includes(userRole) && (
                     <DropdownMenuItem asChild>
                       <Link href="/author" className="cursor-pointer">
                         <PenTool className="mr-2 h-4 w-4" /> 作者中心
                       </Link>
                     </DropdownMenuItem>
                  )}
                  {['ADMIN', 'SUPER_ADMIN', 'REVIEWER'].includes(userRole) && (
                     <DropdownMenuItem asChild>
                       <Link href="/admin" className="cursor-pointer">
                         <LayoutDashboard className="mr-2 h-4 w-4" /> {dashboardName}
                       </Link>
                     </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Account Switcher */}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">切换账号</DropdownMenuLabel>
                  {storedAccounts.map((acc) => (
                    <DropdownMenuItem key={acc.id} className="p-0">
                      <form action={switchAccount.bind(null, acc.id!)} className="w-full">
                        <button className="flex w-full items-center px-2 py-1.5 cursor-pointer">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={acc.image || ""} />
                            <AvatarFallback>{acc.name?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="truncate flex-1 text-left text-sm">{acc.name}</span>
                        </button>
                      </form>
                    </DropdownMenuItem>
                  ))}
                  
                  {canAddAccount && (
                    <DropdownMenuItem className="p-0">
                       <form action={addNewAccount} className="w-full">
                         <button className="flex w-full items-center px-2 py-1.5 cursor-pointer text-muted-foreground hover:text-foreground">
                           <Plus className="mr-2 h-4 w-4" />添加账号
                         </button>
                       </form>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                     <form action={async () => {
                       "use server"
                       await signOut({ redirectTo: "/" })
                     }} className="w-full">
                       <button className="flex w-full items-center text-red-500">
                         <LogOut className="mr-2 h-4 w-4" /> 退出登录
                       </button>
                     </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">登录</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
