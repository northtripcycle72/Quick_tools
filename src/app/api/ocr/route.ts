import { NextRequest, NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth-mysql'

export async function POST(req: NextRequest) {
  const user = await requireAuthApi(req)
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in to use QuickTools.' },
      { status: 401 }
    )
  }

  const { base64, mimeType, prompt } = await req.json()

  if (!base64 || !mimeType) {
    return NextResponse.json(
      { error: 'Missing required fields: base64 and mimeType' },
      { status: 400 }
    )
  }

  try {
    // Proxy to local Python backend OCR endpoint
    const formData = new FormData()
    formData.append('base64_data', base64)
    formData.append('mime_type', mimeType)

    const res = await fetch('http://127.0.0.1:8000/api/ocr', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error('Python OCR backend error:', res.status, errData)
      return NextResponse.json(
        { error: 'OCR processing failed. Make sure the Python backend is running.' },
        { status: 502 }
      )
    }

    const data = await res.json()
    const text = data.text

    if (!text) {
      return NextResponse.json(
        { error: 'No text could be extracted from this file. Try a clearer image.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('OCR route error:', error)
    return NextResponse.json(
      { error: 'OCR backend unreachable. Make sure the Python server is running on port 8000.' },
      { status: 500 }
    )
  }
}