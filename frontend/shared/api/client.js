/**
 * Every call to ml-service goes through here, hitting /api/ml/* (the proxy
 * route handler in app/api/ml/[...path]/route.js) rather than the FastAPI
 * URL directly. That keeps the ml-service address out of client-side code
 * entirely and sidesteps CORS since it's all same-origin from the browser's
 * point of view.
 *
 * Every endpoint except getCities() is scoped to a city slug (e.g. "gurgaon"),
 * matching ml-service's /{city}/... routes.
 */

const BASE = '/api/ml';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // response wasn't JSON -- fall back to statusText above
    }
    throw new Error(`ml-service ${res.status}: ${detail}`);
  }

  return res.json();
}

/** GET /cities -> { slug, label, count }[] -- every city ready to serve right now */
export function getCities() {
  return request('/cities');
}

/** GET /{city}/localities -> string[] */
export function getLocalities(city) {
  return request(`/${city}/localities`);
}

/**
 * POST /{city}/recommend -> { count, results: ListingCard[] }
 * filters: { budget_min, budget_max, bhk?, locality?, furnish?, gated_only?,
 *            min_amenities?, top_n?, value_weight?, luxury_weight?, distance_weight? }
 */
export function recommendProperties(city, filters) {
  return request(`/${city}/recommend`, {
    method: 'POST',
    body: JSON.stringify(filters),
  });
}

/**
 * POST /{city}/predict -> { predicted_price, predicted_price_per_sqft, note }
 * fields: { property_type, locality, bhk, bathroom_num, balcony_num,
 *           area_sqft, floor_num, total_floor, furnish, is_gated_community }
 */
export function predictPrice(city, fields) {
  return request(`/${city}/predict`, {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

/**
 * POST /{city}/predict/explain -> { predicted_price, top_factors, insight,
 *                                    matched_scenario, sample_size }
 * Same fields as predictPrice. Uses a precomputed SHAP cache server-side, so
 * this is safe to call alongside predictPrice without worrying about latency.
 */
export function explainPrediction(city, fields) {
  return request(`/${city}/predict/explain`, {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

/** GET /{city}/listing/{propId} -> ListingCard (full detail) */
export function getListing(city, propId) {
  return request(`/${city}/listing/${encodeURIComponent(propId)}`);
}