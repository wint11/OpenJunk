'use client'

import { useActionState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfile } from "./actions"
import { toast } from "sonner"

export function ProfileForm({ user }: { user: { name?: string | null, email?: string | null, id?: string } }) {
    const [state, formAction, isPending] = useActionState(updateProfile, null)

    useEffect(() => {
        if (state?.success) {
            toast.success(state.message)
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <form action={formAction} className="space-y-6">
             <div className="grid gap-6 max-w-xl">
                <div className="space-y-2">
                    <Label htmlFor="name">昵称</Label>
                    <Input id="name" name="name" defaultValue={user.name || ""} />
                </div>
                <div className="space-y-2">
                    <Label>邮箱</Label>
                    <Input value={user.email || ""} disabled />
                </div>
                <div className="space-y-2">
                    <Label>用户 ID</Label>
                    <Input value={user.id || ""} disabled className="font-mono text-sm text-muted-foreground" />
                </div>
            </div>
            <div className="flex justify-start">
                <Button type="submit" disabled={isPending}>
                    {isPending ? "保存中..." : "保存修改"}
                </Button>
            </div>
        </form>
    )
}
