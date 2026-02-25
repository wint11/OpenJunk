import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

// List of models to export
// Based on schema.prisma
const MODELS = [
  'User',
  'Journal',
  'Novel', 
  'Chapter',
  'ReviewLog',
  'ReadingHistory',
  'AuditLog',
  'Notification',
  'GhostMessage',
  'AppSetting'
]

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'csv')

// Helper to escape fields for CSV
function escapeCsvField(field: any): string {
  if (field === null || field === undefined) {
    return ''
  }
  
  const stringValue = String(field)
  
  // If the field contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

async function exportTableToCsv(modelName: string) {
  try {
    console.log(`Exporting ${modelName}...`)
    
    // Prisma Client uses camelCase for model names (e.g. reviewLog, readingHistory)
    const modelNameCamel = modelName.charAt(0).toLowerCase() + modelName.slice(1)
    // @ts-ignore - Dynamic access to prisma models
    const data = await prisma[modelNameCamel].findMany()
    
    if (data.length === 0) {
      console.log(`No data found for ${modelName}`)
      return
    }

    // Get headers from the first record
    const headers = Object.keys(data[0])
    
    // Build CSV content
    const headerRow = headers.map(escapeCsvField).join(',')
    const rows = data.map((row: any) => {
      return headers.map(header => escapeCsvField(row[header])).join(',')
    })
    
    const csvContent = [headerRow, ...rows].join('\n')
    
    // Write to file
    const filePath = path.join(OUTPUT_DIR, `${modelName}.csv`)
    fs.writeFileSync(filePath, csvContent) // UTF-8 is default
    
    console.log(`✅ Exported ${data.length} records to ${filePath}`)
  } catch (error) {
    console.error(`❌ Failed to export ${modelName}:`, error)
  }
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(`Creating output directory: ${OUTPUT_DIR}`)
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  console.log('Starting CSV export...')
  
  for (const model of MODELS) {
    await exportTableToCsv(model)
  }
  
  console.log('Export completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
