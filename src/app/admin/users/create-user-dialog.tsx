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

  // If Admin has only one journal (which they should), pre-select it
  useEffect(() => {
    if (currentUserRole === 'ADMIN' && journals.length === 1) {
        setSelectedJournal(journals[0].id)
    }
  }, [currentUserRole, journals])

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
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" type="password" required disabled={loading} defaultValue="123456" />
            <p className="text-xs text-muted-foreground">默认密码: 123456</p>
          </div>
          
          {currentUserRole === 'SUPER_ADMIN' && (
             <div className="space-y-2">
               <Label htmlFor="role">角色</Label>
               <Select value={role} onValueChange={setRole} disabled={loading}>
                 <SelectTrigger>
                   <SelectValue placeholder="选择角色" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="ADMIN">期刊管理员</SelectItem>
                   <SelectItem value="REVIEWER">责任编辑</SelectItem>
                   <SelectItem value="SUPER_ADMIN">平台管理员</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          )}

          {/* Journal Selection - Visible for Super Admin or if role is Reviewer/Admin */}
          {/* For ADMIN creating Reviewer, it's auto-assigned but we can show it disabled or hidden */}
          {(currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && journals.length > 1)) && (
              <div className="space-y-2">
                <Label htmlFor="journal">所属期刊</Label>
                <Select value={selectedJournal} onValueChange={setSelectedJournal} disabled={loading || (currentUserRole === 'ADMIN' && journals.length === 1)}>
                    <SelectTrigger>
                        <SelectValue placeholder="选择期刊" />
                    </SelectTrigger>
                    <SelectContent>
                        {journals.map(j => (
                            <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
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
