import { NextResponse } from 'next/server';
import { requireAuthApi } from '@/lib/auth-mysql';

export const runtime = 'nodejs'; // ensure Node runtime for fetch

export async function POST(request: Request) {
  const user = await requireAuthApi(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in to use QuickTools.' },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const backendResponse = await fetch('http://127.0.0.1:8000/api/tools/compress-pdf', {
      method: 'POST',
      body: formData,
    });
    const data = await backendResponse.arrayBuffer();
    const headers = new Headers();
    // Preserve content type and disposition if present
    const contentType = backendResponse.headers.get('content-type') || 'application/pdf';
    headers.set('content-type', contentType);
    const disposition = backendResponse.headers.get('content-disposition');
    if (disposition) {
      headers.set('content-disposition', disposition);
    }
    return new NextResponse(data, {
      status: backendResponse.status,
      headers,
    });
  } catch (err) {
    console.error('Proxy compress-pdf error:', err);
    return NextResponse.json({ error: 'Proxy error', details: (err as any).message }, { status: 500 });
  }
}
