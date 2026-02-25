'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from 'xlsx'

const REQUIRED_HEADERS = ['项目名称', '年度', '基金代码', '开始时间', '结束时间']

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
        
        let startDate = row['开始时间']
        let endDate = row['结束时间']
        const guideContent = row['指南内容'] || ''

        if (!title || !year || !categoryCode || !startDate || !endDate) {
          throw new Error(`必填字段缺失 (项目名称=${title}, 年度=${year}, 基金代码=${categoryCode})`)
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
            guideContent: String(guideContent),
            status: 'ACTIVE' // Default to Active for imported
          }
        })

        successCount++
      } catch (error: any) {
        failCount++
        errors.push(`第 ${rowNum} 行: ${error.message}`)
      }
    }

    revalidatePath('/admin/fund/projects')
    
    if (failCount > 0) {
      return { 
        success: true, // Operation completed, return success true to close dialog but show warnings
        message: `导入完成。成功 ${successCount} 条，失败 ${failCount} 条。`,
        errors: errors 
      }
    }

    return { success: true, message: `成功导入 ${successCount} 条基金项目` }

  } catch (error: any) {
    console.error('Import error:', error)
    return { success: false, message: `导入出错: ${error.message}`, errors: [] }
  }
}

export async function updateFund(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const year = parseInt(formData.get('year') as string)
  const startDateStr = formData.get('startDate') as string
  const endDateStr = formData.get('endDate') as string
  const guideContent = formData.get('guideContent') as string
  const status = formData.get('status') as string

  if (!id || !title || !year || !startDateStr || !endDateStr) {
    return { success: false, message: '必填字段缺失' }
  }

  try {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    await prisma.fund.update({
      where: { id },
      data: {
        title,
        year,
        startDate,
        endDate,
        guideContent,
        status
      }
    })

    revalidatePath('/admin/fund/projects')
    return { success: true, message: '基金信息更新成功' }
  } catch (error: any) {
    console.error('Update fund error:', error)
    return { success: false, message: '更新失败: ' + error.message }
  }
}
