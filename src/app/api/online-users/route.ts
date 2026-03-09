import { NextRequest, NextResponse } from "next/server"

// 使用内存存储在线用户（生产环境建议使用 Redis）
// 格式: { userId: timestamp }
const onlineUsers = new Map<string, number>()

// 清理过期用户（5分钟未活动视为离线）
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5分钟
const USER_TIMEOUT = 5 * 60 * 1000 // 5分钟

// 定期清理
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [userId, lastActivity] of onlineUsers.entries()) {
      if (now - lastActivity > USER_TIMEOUT) {
        onlineUsers.delete(userId)
      }
    }
  }, CLEANUP_INTERVAL)
}

// GET - 获取当前在线人数
export async function GET(request: NextRequest) {
  // 清理过期用户
  const now = Date.now()
  for (const [userId, lastActivity] of onlineUsers.entries()) {
    if (now - lastActivity > USER_TIMEOUT) {
      onlineUsers.delete(userId)
    }
  }

  const count = onlineUsers.size

  return NextResponse.json({
    count,
    timestamp: now,
  })
}

// POST - 心跳上报或离线通知
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, visitorId, action } = body

    // 使用用户ID或访客ID
    const id = userId || visitorId

    if (!id) {
      return NextResponse.json(
        { error: "Missing userId or visitorId" },
        { status: 400 }
      )
    }

    // 如果是离线通知，删除用户
    if (action === "leave") {
      onlineUsers.delete(id)
      return NextResponse.json({
        success: true,
        action: "removed",
        count: onlineUsers.size,
      })
    }

    // 更新活跃时间（心跳）
    onlineUsers.set(id, Date.now())

    return NextResponse.json({
      success: true,
      action: "heartbeat",
      count: onlineUsers.size,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}
