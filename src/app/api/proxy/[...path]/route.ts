import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://gorro.online';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Construct the full path
    const path = pathSegments.join('/');
    
    // Get query parameters from the original request
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    
    // Construct the target URL
    const targetUrl = `${API_BASE_URL}/${path}${queryString}`;

    // Get headers from the original request
    const headers = new Headers();
    
    // Copy important headers
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }
    
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
    };

    // Add body for POST, PUT, PATCH requests
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const body = await request.text();
        if (body) {
          options.body = body;
        }
      } catch (error) {
        // If there's no body, continue without it
      }
    }

    // Make the proxied request
    const response = await fetch(targetUrl, options);

    // Get the response body
    const data = await response.text();

    // Create response with the same status
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
