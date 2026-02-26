'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from 'xlsx'
import { z } from "zod"
import { auth } from "@/auth"

const REQUIRED_HEADERS = ['项目名称', '年度', '基金代码', '项目负责人']

const createFundSchema = z.object({
  title: z.string().min(1, "项目名称不能为空"),
  year: z.coerce.number().int().min(2000, "年度格式错误"),
  categoryId: z.string().min(1, "请选择基金大类"),
  startDate: z.string().min(1, "请选择开始时间"),
  endDate: z.string().min(1, "请选择结束时间"),
  description: z.string().optional()
})

const updateFundSchema = createFundSchema.extend({
  id: z.string().min(1, "项目ID不能为空"),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']).optional()
})

export async function createFund(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: '无权操作' }
  }

  const data = {
    title: formData.get("title") as string,
    year: formData.get("year"),
    categoryId: formData.get("categoryId") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    description: formData.get("description") as string
  }

  const validated = createFundSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "表单验证失败",
      errors: validated.error.flatten().fieldErrors
    }
  }

  // Check permission
  if (session.user.role !== 'SUPER_ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { fundAdminCategories: true }
    })
    const hasPermission = user?.fundAdminCategories.some(c => c.id === validated.data.categoryId)
    if (!hasPermission) {
      return { success: false, message: '无权在该基金大类下创建项目' }
    }
  }

  try {
    const { title, year, categoryId, startDate, endDate, description } = validated.data

    await prisma.fund.create({
      data: {
        title,
        year,
        categoryId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        guideContent: description || "",
        status: 'ACTIVE'
      }
    })

    revalidatePath("/admin/fund/projects")
    return { success: true, message: "项目创建成功" }
  } catch (error) {
    console.error("Create fund error:", error)
    return { success: false, message: "创建失败，请稍后重试" }
  }
}

export async function updateFund(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: '无权操作' }
  }

  const data = {
    id: formData.get("id") as string,
    title: formData.get("title") as string,
    year: formData.get("year"),
    categoryId: formData.get("categoryId") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    description: formData.get("description") as string,
    status: formData.get("status") as string
  }

  const validated = updateFundSchema.safeParse(data)

  if (!validated.success) {
    return {
      success: false,
      message: "表单验证失败",
      errors: validated.error.flatten().fieldErrors
    }
  }

  // Check permission
  if (session.user.role !== 'SUPER_ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { fundAdminCategories: true }
    })
    const hasPermission = user?.fundAdminCategories.some(c => c.id === validated.data.categoryId)
    if (!hasPermission) {
      return { success: false, message: '无权操作该基金项目' }
    }
  }

  try {
    const { id, title, year, categoryId, startDate, endDate, description, status } = validated.data

    await prisma.fund.update({
      where: { id },
      data: {
        title,
        year,
        categoryId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        guideContent: description || "",
        status: status as any
      }
    })

    revalidatePath("/admin/fund/projects")
    return { success: true, message: "项目更新成功" }
  } catch (error) {
    console.error("Update fund error:", error)
    return { success: false, message: "更新失败，请稍后重试" }
  }
}

export async function importFunds(prevState: any, formData: FormData) {
  const file = formData.get('file') as File
  
  if (!file) {
    return { success: false, message: '请上传 Excel 文件', errors: [] }
  }

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    if (workbook.SheetNames.length === 0) {
      return { success: false, message: 'Excel 文件为空', errors: [] }
    }
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(sheet)

    if (jsonData.length === 0) {
      return { success: false, message: 'Excel Sheet 为空', errors: [] }
    }

    // Check headers
    const firstRow = jsonData[0] as any
    const headers = Object.keys(firstRow)
    const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h))
    
    if (missingHeaders.length > 0) {
      return { success: false, message: `缺少必要的表头字段: ${missingHeaders.join(', ')}`, errors: [] }
    }

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    // Process rows
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any
      // Excel row number (1-based, header is 1, so data starts at 2. i is 0-based index of data array)
      const rowNum = i + 2 

      try {
        const title = row['项目名称']
        const year = parseInt(row['年度'])
        const categoryCode = row['基金代码']
        const manager = row['项目负责人']
        
        // Start/End date are optional now
        let startDate = row['开始时间']
        let endDate = row['结束时间']
        const guideContent = row['指南内容'] || ''

        if (!title || !year || !categoryCode || !manager) {
          throw new Error(`必填字段缺失 (项目名称, 年度, 基金代码, 项目负责人)`)
        }
        
        // Default dates if missing: current year Jan 1 to Dec 31
        if (!startDate) {
            startDate = new Date(year, 0, 1) // Jan 1
        }
        if (!endDate) {
            endDate = new Date(year, 11, 31) // Dec 31
        }

        // Handle date strings if they are not Date objects
        if (!(startDate instanceof Date)) {
           startDate = new Date(startDate)
        }
        if (!(endDate instanceof Date)) {
           endDate = new Date(endDate)
        }
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('日期格式无效')
        }

        // Find Category
        const category = await prisma.fundCategory.findUnique({
          where: { code: String(categoryCode) }
        })

        if (!category) {
          throw new Error(`找不到基金代码: ${categoryCode}`)
        }

        // Create Fund
        await prisma.fund.create({
          data: {
            title: String(title),
            year: year,
            categoryId: category.id,
            startDate: startDate,
            endDate: endDate,
            guideContent: String(guideContent) + `\n\n项目负责人: ${manager}`, // Append manager to description for now
            status: 'ACTIVE' // Default to Active for imported
          }
        })

        successCount++
      } catch (error: any) {
        failCount++
        errors.push(`第 ${rowNum} 行: ${error.message}`)
      }
    }
    
    revalidatePath("/admin/fund/projects")
    return { 
        success: true, 
        message: `导入完成: 成功 ${successCount} 条, 失败 ${failCount} 条`,
        errors: errors
    }

  } catch (error) {
    console.error("Import error:", error)
    return { success: false, message: "文件解析失败", errors: [] }
  }
}
