'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Lock, Shield, Ban, CheckCircle, PenTool, BookOpen, Edit, Loader2, Trash2 } from "lucide-react"
import { resetUserPassword, updateUserRole, toggleUserBan, assignJournal, assignReviewerJournal, updateUser, deleteUser } from "./actions"

interface UserActionsProps {
  userId: string
  name: string
  email: string
  currentRole: string
  currentStatus: string
  managedJournalId?: string | null
  reviewerJournals?: { id: string, name: string }[]
  journals?: { id: string, name: string }[]
  currentUserRole?: string
}

export function UserActions({ userId, name, email, currentRole, currentStatus, managedJournalId, reviewerJournals, journals, currentUserRole }: UserActionsProps) {
  const [loading, setLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState(name)
  const [editEmail, setEditEmail] = useState(email)

  // Disable edit if email is masked
  const isMasked = email.includes("****")

  const handleResetPassword = async () => {
    if (!confirm("确定要重置该用户的密码吗？")) return
    setLoading(true)
    try {
        const res = await resetUserPassword(userId)
        if (res.success) alert(res.message)
    } catch (error) {
        alert("操作失败")
    } finally {
        setLoading(false)
    }
  }

  const handleUpdateRole = async (newRole: string) => {
    if (!confirm(`确定要将该用户设置为 ${newRole} 吗？`)) return
    setLoading(true)
    try {
        await updateUserRole(userId, newRole)
    } catch (error) {
        alert("操作失败")
    } finally {
        setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!confirm("确定要删除该用户吗？此操作不可恢复！")) return
    setLoading(true)
    try {
        const res = await deleteUser(userId)
        if (res.success) alert(res.message)
    } catch (error) {
        alert("操作失败: " + (error as Error).message)
    } finally {
        setLoading(false)
    }
  }

  const handleToggleBan = async () => {
    const action = currentStatus === 'BANNED' ? '解封' : '封禁'
    if (!confirm(`确定要${action}该用户吗？`)) return
    setLoading(true)
    try {
      await toggleUserBan(userId, currentStatus)
    } catch (error) {
      alert("操作失败")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignJournal = async (journalId: string | null) => {
     if (!confirm(`确定要${journalId ? '分配' : '取消分配'}该期刊吗？`)) return
     setLoading(true)
     try {
       await assignJournal(userId, journalId)
     } catch (error) {
       alert("操作失败")
     } finally {
       setLoading(false)
     }
  }

  const handleAssignReviewerJournal = async (journalId: string, action: 'ADD' | 'REMOVE') => {
     setLoading(true)
     try {
       const res = await assignReviewerJournal(userId, journalId, action)
       if (res && res.success) {
         alert(res.message)
       }
     } catch (error) {
       alert("操作失败: " + (error as Error).message)
     } finally {
       setLoading(false)
     }
  }

  const handleEditUser = async () => {
    if (!editName || !editEmail) return
    setLoading(true)
    try {
        const res = await updateUser(userId, { name: editName, email: editEmail })
        if (res.success) {
            alert(res.message)
            setIsEditDialogOpen(false)
        }
    } catch (error) {
        alert("操作失败: " + (error as Error).message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <>
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>修改用户信息</DialogTitle>
                <DialogDescription>修改用户的姓名和账号。注意：账号必须唯一。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">姓名</Label>
                    <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">账号</Label>
                    <Input id="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleEditUser} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    保存修改
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
          <span className="sr-only">打开菜单</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>用户操作</DropdownMenuLabel>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsEditDialogOpen(true); }} disabled={isMasked}>
          <Edit className="mr-2 h-4 w-4" /> 修改信息
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleResetPassword}>
          <Lock className="mr-2 h-4 w-4" /> 重置密码
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>设置角色</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleUpdateRole('REVIEWER')} disabled={currentRole === 'REVIEWER'}>
          <PenTool className="mr-2 h-4 w-4" /> 责任编辑
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleUpdateRole('ADMIN')} disabled={currentRole === 'ADMIN'}>
          <Shield className="mr-2 h-4 w-4 text-red-500" /> 期刊管理员
        </DropdownMenuItem>

        {currentRole === 'ADMIN' && journals && journals.length > 0 && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <BookOpen className="mr-2 h-4 w-4" /> 分配期刊
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleAssignJournal(null)} disabled={!managedJournalId}>
                            <span className="text-muted-foreground">取消分配</span>
                        </DropdownMenuItem>
                        {journals.map(j => (
                            <DropdownMenuItem key={j.id} onClick={() => handleAssignJournal(j.id)} disabled={managedJournalId === j.id}>
                                {j.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </>
        )}

        {currentRole === 'REVIEWER' && journals && journals.length > 0 && (
            <>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <BookOpen className="mr-2 h-4 w-4" /> 分配期刊 (多选)
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {journals.map(j => {
                            const isAssigned = reviewerJournals?.some(rj => rj.id === j.id)
                            return (
                                <DropdownMenuItem key={j.id} onClick={(e) => {
                                    e.preventDefault() // Prevent closing menu
                                    handleAssignReviewerJournal(j.id, isAssigned ? 'REMOVE' : 'ADD')
                                }}>
                                    {isAssigned ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <span className="mr-6"></span>}
                                    {j.name}
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </>
        )}

        {currentUserRole === 'SUPER_ADMIN' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleBan} className={currentStatus === 'BANNED' ? "text-green-600" : "text-red-600"}>
              {currentStatus === 'BANNED' ? (
                <><CheckCircle className="mr-2 h-4 w-4" /> 解除封禁</>
              ) : (
                <><Ban className="mr-2 h-4 w-4" /> 禁止发布/登录</>
              )}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDeleteUser} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> 删除用户
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )
}
