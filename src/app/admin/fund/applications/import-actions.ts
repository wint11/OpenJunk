'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from 'xlsx'

const REQUIRED_HEADERS = ['受理编号', '项目名称', '所属基金', '申请人', '状态']

export async function importApplications(prevState: any, formData: FormData) {
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
        const serialNo = String(row['受理编号'])
        const title = row['项目名称']
        const fundName = row['所属基金']
        const applicantName = row['申请人']
        const statusRaw = row['状态']
        const submissionTimeRaw = row['提交时间']
        
        if (!serialNo || !title || !fundName || !applicantName || !statusRaw) {
          throw new Error(`必填字段缺失 (受理编号, 项目名称, 所属基金, 申请人, 状态)`)
        }
        
        // Resolve Status
        let status = 'SUBMITTED'
        if (statusRaw === '已立项') status = 'APPROVED'
        else if (statusRaw === '已提交') status = 'SUBMITTED' // Default to submitted if explicitly stated
        else if (statusRaw === '未立项') status = 'REJECTED' // Optional: Handle rejection if needed, but user emphasized "Approved" and "Submitted"
        else {
            // Fallback: try to match english or keep raw if unknown
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

        // Find Fund by Name (Title)
        // We need to find an active fund with this name
        const fund = await prisma.fund.findFirst({
          where: { title: String(fundName) }
        })

        if (!fund) {
          throw new Error(`找不到名为 "${fundName}" 的基金项目`)
        }

        // Check for duplicate Serial No
        const existing = await prisma.fundApplication.findFirst({
            where: { serialNo: serialNo }
        })
        
        if (existing) {
             throw new Error(`受理编号 ${serialNo} 已存在`)
        }

        // Create Application
        // Note: We don't have applicantId (User ID) from Excel, so it will be null (offline application import)
        // Or we just store applicantName. Schema has applicantId?
        // Schema: applicantId String? @relation...
        // applicantName String? 
        // Let's check schema for `FundApplication`... 
        // Assuming `FundApplication` has `applicantName` string field.
        
        await prisma.fundApplication.create({
          data: {
            fundId: fund.id,
            title: String(title),
            serialNo: serialNo,
            applicantName: String(applicantName),
            status: status,
            createdAt: createdAt,
            description: "线下导入数据", // Default description for imported data
            // content: "线下导入数据", // REMOVED: content field does not exist in schema
            // applicantId: null // Explicitly null
          }
        })

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
