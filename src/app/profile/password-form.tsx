'use client'

import { useActionState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updatePassword } from "./actions"
import { toast } from "sonner"

export function PasswordForm() {
    const [state, formAction, isPending] = useActionState(updatePassword, null)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state?.success) {
            toast.success(state.message)
            formRef.current?.reset()
        } else if (state?.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <form ref={formRef} action={formAction} className="space-y-4 border rounded-lg p-4">
             <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">当前密码</Label>
                    <Input id="currentPassword" name="currentPassword" type="password" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newPassword">新密码</Label>
                    <Input id="newPassword" name="newPassword" type="password" required minLength={6} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认新密码</Label>
                    <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                    {isPending ? "修改中..." : "确认修改"}
                </Button>
            </div>
        </form>
    )
}
