/**
 * For server components ONLY (no 'use client'). Server-to-server calls don't
 * hit CORS the way browser calls do, so these skip the /api/ml proxy and hit
 * ml-service directly -- one less network hop than going through our own
 * proxy route for data that's rendered on the server anyway.
 *
 * Client components should use shared/api/client.js instead, which goes
 * through the proxy.
 */

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



export async function fetchFromMlService(path, options = {}) {
  const res = await fetch(`${ML_SERVICE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store', // listings/prices change; don't let Next statically cache stale data
    ...options,
  });

  if (!res.ok) {
    throw new Error(`ml-service ${res.status}: ${res.statusText}`);
  }

  return res.json();
}