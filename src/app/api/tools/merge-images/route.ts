import { NextRequest, NextResponse } from 'next/server'
import { requireAuthApi } from '@/lib/auth-mysql'

export async function POST(req: NextRequest) {
  const user = await requireAuthApi(req)
  if (!user) {
    return NextResponse.json(
      { detail: 'Authentication required. Please sign in to use QuickTools.' },
      { status: 401 }
    )
  }

  try {
    const formData = await req.formData()

    const response = await fetch('http://127.0.0.1:8000/api/tools/merge-images', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let detail = 'Failed to merge images.'
      try {
        const parsed = JSON.parse(errorText)
        if (parsed.detail) detail = parsed.detail
      } catch {}
      return new Response(JSON.stringify({ detail }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const imageBytes = await response.arrayBuffer()
    return new Response(imageBytes, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Disposition': response.headers.get('content-disposition') || 'attachment; filename="merged_image"',
      },
    })
  } catch (error) {
    console.error('Merge Images Route Error:', error)
    return new Response(JSON.stringify({ detail: 'Internal Server Error connecting to image merger service.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
