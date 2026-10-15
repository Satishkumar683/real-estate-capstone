function getMlServiceUrl() {
  const envUrl = process.env.ML_SERVICE_URL;
  const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

  // If on Vercel, localhost/127.0.0.1 is unreachable -- always use deployed Render service
  if (isVercel) {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return 'https://real-estate-ai-0j6r.onrender.com';
    }
  }

  return envUrl || 'http://127.0.0.1:8000';
}

const ML_SERVICE_URL = getMlServiceUrl();



async function forward(request, path) {
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  const search = request.nextUrl.search; // includes leading '?' if present
  const url = `${ML_SERVICE_URL}/${targetPath}${search}`;

  const init = { method: request.method, headers: { 'Content-Type': 'application/json' } };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  let upstream;
  try {
    upstream = await fetch(url, init);
  } catch (err) {
    // ml-service isn't running, wrong port, etc -- surface a clear message
    // instead of a generic Next.js 500 with no context.
    return Response.json(
      { detail: `Could not reach ml-service at ${ML_SERVICE_URL}. Is it running? (${err.message})` },
      { status: 502 },
    );
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' },
  });
}

export async function GET(request, { params }) {
  return forward(request, (await params).path);
}

export async function POST(request, { params }) {
  return forward(request, (await params).path);
}