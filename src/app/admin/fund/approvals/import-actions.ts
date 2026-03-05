'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from 'xlsx'
import { auth } from "@/auth"

const REQUIRED_HEADERS = ['立项编号', '项目名称', '所属基金', '申请人', '所属部门', '状态']

export async function importApplications(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return { success: false, message: '无权操作' }
  }

  let allowedCategoryIds: string[] = []
  if (session.user.role !== 'SUPER_ADMIN') {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { fundAdminCategories: true }
    })
    allowedCategoryIds = user?.fundAdminCategories.map(c => c.id) || []
  }

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
        const projectNo = String(row['立项编号']) // This is projectNumber (立项编号)
        const title = row['项目名称']
        const fundName = row['所属基金']
        const applicantName = row['申请人']
        const departmentName = row['所属部门']
        const statusRaw = row['状态']
        const submissionTimeRaw = row['提交时间']
        
        if (!projectNo || !title || !fundName || !applicantName || !departmentName || !statusRaw) {
          throw new Error(`必填字段缺失 (立项编号, 项目名称, 所属基金, 申请人, 所属部门, 状态)`)
        }

        // Find Fund by Name (Title) and Permission
        const fundWhere: any = { title: String(fundName) }
        if (session.user.role !== 'SUPER_ADMIN') {
            fundWhere.categoryId = { in: allowedCategoryIds }
        }

        const fund = await prisma.fund.findFirst({
          where: fundWhere
        })

        if (!fund) {
          throw new Error(`找不到名为 "${fundName}" 的基金项目或无权操作`)
        }

        // Check department
        const department = await prisma.fundDepartment.findFirst({
            where: {
                name: String(departmentName),
                categoryId: fund.categoryId // Ensure department belongs to the same category as the fund
            }
        })

        if (!department) {
             throw new Error(`找不到名为 "${departmentName}" 的部门，或该部门不属于基金 "${fundName}" 所属的大类`)
        }

        // Auto-generate application number (受理编号)
        // Format: {YEAR}-{DEPTCODE}-{TIMESTAMP}{RANDOM}
        // Use department code from database
        const { generateFundSerialNo } = await import("@/lib/fund-utils")
        const serialNo = generateFundSerialNo(fund.year, department.code || "IMPORT")
        
        // Resolve Status
        let status = 'SUBMITTED'
        if (statusRaw === '已立项') status = 'APPROVED'
        else if (statusRaw === '已提交') status = 'SUBMITTED'
        else if (statusRaw === '未立项') status = 'REJECTED'
        else if (statusRaw === '评审中') status = 'UNDER_REVIEW'
        else {
            status = statusRaw
        }
        
        // Resolve Submission Time
        let createdAt = new Date()
        if (submissionTimeRaw) {
            if (submissionTimeRaw instanceof Date) {
                createdAt = submissionTimeRaw
            } else {
                const parsed = new Date(submissionTimeRaw)
                if (!isNaN(parsed.getTime())) {
                    createdAt = parsed
                }
            }
        }

        // Check if application already exists (by title and fund)
        // Or should we use projectNo? projectNo is usually unique for approved projects.
        // Let's use title + applicantName + fundId as unique constraint for import
        const existingApp = await prisma.fundApplication.findFirst({
            where: {
                fundId: fund.id,
                title: String(title),
                applicantName: String(applicantName)
            }
        })

        if (existingApp) {
             // Update
             await prisma.fundApplication.update({
                 where: { id: existingApp.id },
                 data: {
                     status,
                     projectNo: projectNo, // Update project number
                     departmentId: department.id, // Update department
                     createdAt
                 }
             })
        } else {
            // Create
            await prisma.fundApplication.create({
                data: {
                    serialNo, // Auto-generated application number
                    projectNo: projectNo, // Imported project number (立项编号)
                    title: String(title),
                    fundId: fund.id,
                    departmentId: department.id, // Link department
                    applicantName: String(applicantName),
                    status,
                    createdAt,
                    description: "线下导入数据"
                }
            })
        }

        successCount++
      } catch (error: any) {
        failCount++
        errors.push(`第 ${rowNum} 行: ${error.message}`)
      }
    }
    
    revalidatePath("/admin/fund/applications")
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
