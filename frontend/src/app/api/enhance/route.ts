// src/app/api/enhance/route.ts
import { NextRequest, NextResponse } from 'next/server';

// const BACKEND_URL = process.env.BACKEND_URL || 'https://your-ai-backend.herokuapp.com';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  try {
    const backendResponse = await fetch(`${BACKEND_URL}/enhance`, {
      method: 'POST',
      body: formData,
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status: ${backendResponse.status}`);
    }

    const data = await backendResponse.arrayBuffer();
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    console.error('Error calling backend:', error);
    return NextResponse.json({ error: 'Error enhancing image' }, { status: 500 });
  }
}