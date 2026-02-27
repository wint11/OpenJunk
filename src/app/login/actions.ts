'use server'

import { signIn } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AuthError } from "next-auth"
import bcrypt from "bcryptjs"

export async function login(formData: FormData) {
  try {
    const email = (formData.get("email") as string | null) ?? ""
    const password = (formData.get("password") as string | null) ?? ""
    
    // Check if user exists and get role first
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    })

    // Determine redirect URL based on role
    let redirectTo = "/"
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      redirectTo = "/admin"
    } else if (user?.role === 'REVIEWER') {
      redirectTo = "/journals/submission" // Reviewers can go to submission or home
    }
    
    // Attempt to sign in
    // We use redirect: false so we can handle the response manually in the client
    // But wait, signIn with redirect: false in Server Actions might not persist session if not careful?
    // Actually, in NextAuth v5, signIn is a server-side helper. 
    // If we want to control redirect on client, we should let signIn handle the cookie setting,
    // but pass `redirect: false` so it doesn't throw a NEXT_REDIRECT error immediately if we want to add custom logic.
    // HOWEVER, for `credentials` provider, `signIn` returns undefined if redirect is false and success?
    // Or it throws if error?
    
    // Let's use the standard way: signIn with redirect: false.
    const redirectUrl = await signIn(
      "credentials",
      { email, password, redirect: false, redirectTo },
      undefined
    )

    const url = new URL(redirectUrl, "http://localhost")
    const errorCode = url.searchParams.get("error")
    if (errorCode) {
      if (errorCode === "CredentialsSignin") {
        return { success: false, error: "邮箱或密码错误" }
      }
      return { success: false, error: "登录失败，请稍后重试" }
    }
    
    // If we get here, login was successful
    return { success: true, redirectTo }
    
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: '邮箱或密码错误' }
        default:
          return { success: false, error: '登录失败，请稍后重试' }
      }
    }
    throw error
  }
}
