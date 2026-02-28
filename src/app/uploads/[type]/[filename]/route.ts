import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; filename: string }> }
) {
  const { type, filename } = await params
  
  // Security check: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Invalid filename', { status: 400 })
  }

  // Allowlist for folder types to prevent accessing arbitrary directories
  const ALLOWED_TYPES = ['journals', 'css', 'guidelines', 'avatars', 'temp']
  
  if (!ALLOWED_TYPES.includes(type)) {
    return new NextResponse('Invalid file type', { status: 400 })
  }

  // Construct path - ensure we look in the correct runtime location
  const filePath = join(process.cwd(), 'public', 'uploads', type, filename)

  if (!existsSync(filePath)) {
    console.error(`[File Not Found] ${filePath}`)
    return new NextResponse('File not found', { status: 404 })
  }

  try {
    const fileBuffer = await readFile(filePath)
    const stats = await stat(filePath)

    // Determine content type based on extension
    let contentType = 'application/octet-stream'
    const ext = filename.split('.').pop()?.toLowerCase()
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
      case 'css':
        contentType = 'text/css'
        break
      case 'pdf':
        contentType = 'application/pdf'
        break
      case 'doc':
      case 'docx':
        contentType = 'application/msword'
        break
      default:
        contentType = 'application/octet-stream'
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error reading file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
