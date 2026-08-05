import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const data = formData.get('data') as string;
    const name = formData.get('name') as string || 'backup.json';

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Download echo error:', error);
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
}
