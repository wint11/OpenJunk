'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/lib/audit"
import bcrypt from "bcryptjs"

async function checkAdmin() {
  const session = await auth()
  const role = session?.user?.role
  if (!session || !session.user || (role !== 'SUPER_ADMIN' && role !== 'ADMIN')) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function resetUserPassword(userId: string) {
  const session = await checkAdmin()
  
  // Default password: "123456"
  const hashedPassword = await bcrypt.hash("123456", 10)
  
  await prisma.user.update({
    where: { id: userId },
    data: { 
      password: hashedPassword,
    }
  })

  await logAudit("RESET_PASSWORD", `User:${userId}`, "Reset user password to default", session?.user?.id)
  revalidatePath('/admin/users')
  return { success: true, message: "密码已重置为: 123456" }
}

export async function updateUserRole(userId: string, newRole: string) {
  const session = await checkAdmin()
  
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  })

  // Notify user about role change
  await prisma.notification.create({
    data: {
      userId,
      senderId: session.user.id!,
      type: 'SYSTEM',
      title: 'Role Updated',
      content: `Your role has been updated to ${newRole}.`,
      status: 'UNREAD'
    }
  })

  await logAudit("UPDATE_ROLE", `User:${userId}`, `Updated role to ${newRole}`, session?.user?.id)
  revalidatePath('/admin/users')
}

export async function toggleUserBan(userId: string, currentStatus: string) {
  const session = await checkAdmin()
  
  // Only SUPER_ADMIN can ban/unban
  if (session?.user?.role !== 'SUPER_ADMIN') {
    throw new Error("Only Super Admin can ban/unban users")
  }
  
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")

  const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED'
  
  await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus }
  })

  await logAudit("TOGGLE_BAN", `User:${userId}`, `Changed status to ${newStatus}`, session?.user?.id)
  revalidatePath('/admin/users')
}

export async function assignJournal(userId: string, journalId: string | null) {
  const session = await checkAdmin()
  if (session?.user?.role !== 'SUPER_ADMIN') {
    throw new Error("Only Super Admin can assign journals")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { managedJournalId: journalId }
  })

  await logAudit("ASSIGN_JOURNAL", `User:${userId}`, `Assigned to journal ${journalId || 'None'}`, session?.user?.id)
  revalidatePath('/admin/users')
}

export async function assignReviewerJournal(userId: string, journalId: string, action: 'ADD' | 'REMOVE') {
  const session = await checkAdmin()
  const currentAdmin = await prisma.user.findUnique({ where: { id: session?.user?.id } })
  
  // If not SUPER_ADMIN, verify journalId matches managedJournalId
  if (session?.user?.role !== 'SUPER_ADMIN') {
    if (currentAdmin?.managedJournalId !== journalId) {
      throw new Error("You can only manage reviewers for your own journal")
    }
  }

  if (action === 'ADD') {
    // Check if invitation already exists
    const existingInvite = await prisma.notification.findFirst({
        where: {
            userId,
            type: 'INVITATION',
            status: 'UNREAD',
            data: { contains: journalId }
        }
    })

    if (existingInvite) throw new Error("Invitation already sent")

    const journal = await prisma.journal.findUnique({ where: { id: journalId } })

    // Send invitation instead of direct assignment
    await prisma.notification.create({
        data: {
            userId,
            senderId: session.user.id,
            type: 'INVITATION',
            title: `Journal Invitation: ${journal?.name}`,
            content: `You have been invited to become an editor for the journal "${journal?.name}". Please accept or reject this invitation.`,
            status: 'UNREAD',
            data: JSON.stringify({ journalId })
        }
    })
    
    return { success: true, message: "Invitation sent to user" }

  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        reviewerJournals: {
          disconnect: { id: journalId }
        }
      }
    })
  }

  await logAudit("ASSIGN_REVIEWER_JOURNAL", `User:${userId}`, `${action} journal ${journalId}`, session?.user?.id)
  revalidatePath('/admin/users')
}

export async function updateUser(userId: string, data: { name: string; email: string }) {
  const session = await checkAdmin()
  const { name, email } = data

  // Validate inputs
  if (!name || !email) {
    throw new Error("姓名和账号不能为空")
  }

  // Check if email (account) is already taken by another user
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: userId
      }
    }
  })

  if (existingUser) {
    throw new Error("该账号已被其他用户使用")
  }

  // Verify permissions
  // SUPER_ADMIN can edit anyone
  // ADMIN can edit REVIEWERs of their managed journal
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  const targetUser = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { reviewerJournals: true } 
  })

  if (!targetUser) throw new Error("用户不存在")

  if (currentUser?.role === 'ADMIN') {
    // Admin can only edit reviewers
    if (targetUser.role !== 'REVIEWER') {
        throw new Error("期刊管理员只能修改编辑的信息")
    }
    // Admin can only edit reviewers who are assigned to their journal
    // Or maybe just any reviewer? The requirement was "Admin creates Editor".
    // Usually Admin manages their own editors.
    // Let's check if the target reviewer is assigned to the admin's journal.
    const isAssignedToAdminJournal = targetUser.reviewerJournals.some(j => j.id === currentUser.managedJournalId)
    // Actually, if Admin created the editor, they should be able to edit them.
    // But since we have N:N, a reviewer might be assigned to multiple journals.
    // If we restrict editing to only if they are assigned to *this* admin's journal, it's safer.
    if (!currentUser.managedJournalId) throw new Error("您没有管理任何期刊")
    
    // Allow editing if the reviewer is associated with the admin's journal
    if (!isAssignedToAdminJournal) {
        // It's possible the reviewer was just created and not assigned yet (though createUser assigns it).
        // Or assigned to another journal.
        // Let's assume Admin can edit any REVIEWER for now to simplify, or strictly enforce.
        // Strict enforcement is better for multi-tenant feel.
        if (!isAssignedToAdminJournal) {
             throw new Error("您只能修改归属于您期刊的编辑信息")
        }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name, email }
  })

  await logAudit("UPDATE_USER_INFO", `User:${userId}`, `Updated name to ${name}, email to ${email}`, session?.user?.id)
  revalidatePath('/admin/users')
  return { success: true, message: "用户信息已更新" }
}

export async function deleteUser(userId: string) {
  const session = await checkAdmin()
  
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  const targetUser = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { reviewerJournals: true } 
  })

  if (!targetUser) throw new Error("用户不存在")

  // Prevent deleting yourself
  if (userId === session.user.id) {
    throw new Error("无法删除自己的账号")
  }

  if (currentUser?.role === 'ADMIN') {
    if (targetUser.role !== 'REVIEWER') {
        throw new Error("期刊管理员只能删除编辑账号")
    }
    
    if (!currentUser.managedJournalId) throw new Error("您没有管理任何期刊")
    
    const isAssignedToAdminJournal = targetUser.reviewerJournals.some(j => j.id === currentUser.managedJournalId)
    if (!isAssignedToAdminJournal) {
         throw new Error("您只能删除归属于您期刊的编辑")
    }
  }

  await prisma.user.delete({
    where: { id: userId }
  })

  await logAudit("DELETE_USER", `User:${userId}`, `Deleted user ${targetUser.email}`, session?.user?.id)
  revalidatePath('/admin/users')
  return { success: true, message: "用户已删除" }
}

export async function createUser(formData: FormData) {
  const session = await checkAdmin()
  const currentUserRole = session?.user?.role

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string 
  const journalId = formData.get("journalId") as string | null

  if (!name || !email || !password || !role) {
    throw new Error("请填写所有必填字段")
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) throw new Error("该邮箱已被注册")

  const hashedPassword = await bcrypt.hash(password, 10)

  if (currentUserRole === 'ADMIN') {
    if (role !== 'REVIEWER') throw new Error("期刊管理员只能创建编辑账号")
    
    const currentAdmin = await prisma.user.findUnique({
        where: { id: session?.user?.id },
        select: { managedJournalId: true }
    })
    
    if (!currentAdmin?.managedJournalId) {
        throw new Error("您尚未管理任何期刊，无法创建编辑")
    }

    await prisma.user.create({
        data: {
            name, email, password: hashedPassword, role: 'REVIEWER',
            reviewerJournals: { connect: { id: currentAdmin.managedJournalId } },
            status: 'ACTIVE'
        }
    })
  } else if (currentUserRole === 'SUPER_ADMIN') {
    // Super Admin logic
    const newUser = await prisma.user.create({
        data: {
            name, email, password: hashedPassword, role,
            managedJournalId: (role === 'ADMIN' && journalId) ? journalId : undefined,
            status: 'ACTIVE'
        }
    })

    if (role === 'REVIEWER' && journalId) {
        await prisma.user.update({
            where: { id: newUser.id },
            data: { reviewerJournals: { connect: { id: journalId } } }
        })
    }
  }

  await logAudit("CREATE_USER", `User:${email}`, `Created user with role ${role}`, session?.user?.id)
  revalidatePath('/admin/users')
}
