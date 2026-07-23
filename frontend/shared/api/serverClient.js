/**
 * For server components ONLY (no 'use client'). Server-to-server calls don't
 * hit CORS the way browser calls do, so these skip the /api/ml proxy and hit
 * ml-service directly -- one less network hop than going through our own
 * proxy route for data that's rendered on the server anyway.
 *
 * Client components should use shared/api/client.js instead, which goes
 * through the proxy.
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

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