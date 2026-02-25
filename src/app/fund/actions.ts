'use server'

import { prisma } from "@/lib/prisma"
import { z } from "zod"

const applySchema = z.object({
  fundId: z.string(),
  applicantName: z.string().min(2, "姓名至少2个字符"),
  title: z.string().min(5, "项目名称至少5个字符"),
  description: z.string().min(20, "项目简介至少20个字符"),
  achievements: z.string().optional(),
})

export async function submitApplication(prevState: any, formData: FormData) {
  const data = {
    fundId: formData.get("fundId") as string,
    applicantName: formData.get("applicantName") as string,
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    achievements: formData.get("achievements") as string,
  }

  const validated = applySchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
      message: "请检查填写内容"
    }
  }

  // Check if fund exists and is active
  const fund = await prisma.fund.findUnique({
    where: { id: data.fundId },
    include: { category: true }
  })

  if (!fund || fund.status !== "ACTIVE") {
    return {
      success: false,
      message: "该基金项目不存在或已停止申报"
    }
  }

  // Generate Serial No: YEAR-CODE-RANDOM
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  const code = fund.category.code || "FUND"
  const serialNo = `${fund.year}-${code}-${timestamp}${random}`

  try {
    const application = await prisma.fundApplication.create({
      data: {
        fundId: data.fundId,
        applicantName: data.applicantName,
        title: data.title,
        description: data.description,
        achievements: data.achievements,
        serialNo: serialNo,
        status: "SUBMITTED"
      }
    })

    return {
      success: true,
      applicationId: application.id,
      serialNo: application.serialNo
    }
  } catch (error) {
    console.error("Submission error:", error)
    return {
      success: false,
      message: "提交失败，请稍后重试"
    }
  }
}

const querySchema = z.object({
  serialNo: z.string().min(5, "请输入正确的申请编号"),
})

export async function queryApplication(prevState: any, formData: FormData) {
  const serialNo = formData.get("serialNo") as string

  const validated = querySchema.safeParse({ serialNo })

  if (!validated.success) {
    return {
      success: false,
      message: "申请编号格式不正确"
    }
  }

  try {
    const application = await prisma.fundApplication.findUnique({
      where: { serialNo },
      include: {
        fund: {
          include: { category: true }
        },
        reviews: true
      }
    })

    if (!application) {
      return {
        success: false,
        message: "未找到该编号对应的申请记录，请检查输入"
      }
    }

    return {
      success: true,
      data: {
        title: application.title,
        applicantName: application.applicantName,
        status: application.status,
        fundName: application.fund.title,
        category: application.fund.category.name,
        submittedAt: application.createdAt,
        feedback: application.reviews.length > 0 ? application.reviews[0].comments : null
      }
    }
  } catch (error) {
    console.error("Query error:", error)
    return {
      success: false,
      message: "查询失败，请稍后重试"
    }
  }
}
