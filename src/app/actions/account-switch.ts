"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

const SESSION_COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token'
const ACCOUNT_COOKIE_PREFIX = 'smartread-account-'

export async function addNewAccount() {
  const session = await auth()
  
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)
  
  if (session?.user?.id && sessionToken) {
    // Save current session
    cookieStore.set(ACCOUNT_COOKIE_PREFIX + session.user.id, sessionToken.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    // Clear current session
    cookieStore.delete(SESSION_COOKIE_NAME)
  }
  
  redirect('/login')
}

export async function switchAccount(targetUserId: string) {
  const session = await auth()
  const cookieStore = await cookies()
  
  // 1. Stash current session if it exists and valid
  if (session?.user?.id) {
    const currentToken = cookieStore.get(SESSION_COOKIE_NAME)
    if (currentToken) {
       cookieStore.set(ACCOUNT_COOKIE_PREFIX + session.user.id, currentToken.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30
      })
    }
  }

  // 2. Restore target session
  const targetCookieName = ACCOUNT_COOKIE_PREFIX + targetUserId
  const targetToken = cookieStore.get(targetCookieName)
  
  if (targetToken) {
    cookieStore.set(SESSION_COOKIE_NAME, targetToken.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    // Remove from stashed
    cookieStore.delete(targetCookieName)
  }
  
  redirect('/')
}
