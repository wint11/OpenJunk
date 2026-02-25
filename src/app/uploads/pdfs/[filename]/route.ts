
import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  
  // Security check: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Invalid filename', { status: 400 })
  }

  // Construct path - ensure we look in the correct runtime location
  // We look in process.cwd()/public/uploads/pdfs
  const filePath = join(process.cwd(), 'public', 'uploads', 'pdfs', filename)

  console.log(`[PDF Route] Attempting to serve: ${filePath}`)
  
  if (!existsSync(filePath)) {
    console.error(`[File Not Found] ${filePath}`)
    // Fallback: try checking if it's in a temporary location or if there's a path issue
    // In dev mode, sometimes public assets are served differently, but fs should see them
    return new NextResponse('File not found', { status: 404 })
  }

  try {
    const fileBuffer = await readFile(filePath)
    const stats = await stat(filePath)

    // Determine content type based on extension
    let contentType = 'application/pdf'
    if (filename.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    else if (filename.endsWith('.doc')) contentType = 'application/msword'
    else if (filename.endsWith('.zip')) contentType = 'application/zip'
    else if (filename.endsWith('.rar')) contentType = 'application/x-rar-compressed'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        // Optional: Cache control
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error reading file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
