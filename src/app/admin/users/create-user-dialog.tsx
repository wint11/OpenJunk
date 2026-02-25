'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUser } from "./actions"
import { toast } from "sonner"
import { Plus } from "lucide-react"

interface CreateUserDialogProps {
  currentUserRole: string
  journals: { id: string; name: string }[]
}

export function CreateUserDialog({ currentUserRole, journals }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Default role logic
  // If ADMIN, locked to REVIEWER.
  // If SUPER_ADMIN, default to ADMIN but can change.
  const [role, setRole] = useState(currentUserRole === 'ADMIN' ? 'REVIEWER' : 'ADMIN')
  const [selectedJournal, setSelectedJournal] = useState<string>("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    // Manually append select values if needed, or rely on name attribute if component supports it (shadcn select doesn't use native select, so need hidden input or append)
    // shadcn Select uses a hidden input if name is provided? No, usually we need to handle it.
    // Wait, standard shadcn Select *does* support name prop if used inside a form? 
    // Actually, Radix UI Select adds a hidden input. Let's verify.
    // If not, we append manually.
    
    formData.set("role", role)
    if (selectedJournal) {
        formData.set("journalId", selectedJournal)
    }

    try {
      await createUser(formData)
      toast.success("用户创建成功")
      setOpen(false)
      // Reset form?
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("创建失败")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {currentUserRole === 'ADMIN' ? "创建编辑" : "创建用户"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{currentUserRole === 'ADMIN' ? "创建编辑账号" : "创建新用户"}</DialogTitle>
          <DialogDescription>
            {currentUserRole === 'ADMIN' 
              ? "创建一个新的编辑账号，该账号将自动归属到您管理的期刊。"
              : "创建一个新的管理员或编辑账号，并分配相应的期刊权限。"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名/昵称</Label>
            <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">账号</Label>
            <Input id="email" name="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">初始密码</Label>
            <Input id="password" name="password" type="password" required minLength={6} disabled={loading} />
          </div>
          
          {currentUserRole === 'SUPER_ADMIN' && (
             <div className="space-y-2">
               <Label htmlFor="role">角色</Label>
               <Select value={role} onValueChange={setRole} disabled={loading}>
                 <SelectTrigger>
                   <SelectValue placeholder="选择角色" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ADMIN">期刊管理员 (Admin)</SelectItem>
                   <SelectItem value="REVIEWER">责任编辑 (Reviewer)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          )}

          {/* Show Journal Select if:
              1. Super Admin is creating an ADMIN (to assign managed journal)
              2. Super Admin is creating a REVIEWER (to assign initial reviewer journal)
          */}
          {currentUserRole === 'SUPER_ADMIN' && (
             <div className="space-y-2">
               <Label htmlFor="journal">
                 {role === 'ADMIN' ? "管理期刊" : "归属期刊 (可选)"}
               </Label>
               <Select value={selectedJournal} onValueChange={setSelectedJournal} disabled={loading} required={role === 'ADMIN'}>
                 <SelectTrigger>
                   <SelectValue placeholder="选择期刊" />
                 </SelectTrigger>
                 <SelectContent>
                   {journals.map((j) => (
                     <SelectItem key={j.id} value={j.id}>
                       {j.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "创建中..." : "创建用户"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
