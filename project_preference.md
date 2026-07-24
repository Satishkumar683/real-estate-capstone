# Project Reference — Every File, What It Does

Companion to `README.md` (which covers setup/quickstart). This document goes
file by file through both `ml-service/` and `frontend/`, plus every library
and technology used and why.

---

# Part 1 — `ml-service/`

## `app/` — the running API

### `app/main.py`
The FastAPI application itself. Responsibilities:
- **City discovery** (`_discover_cities`, `_load_city`) — scans `app/data/*/`
  at startup; a city only loads if it has `flats_final.csv`,
  `listing_display.csv`, AND a matching `app/models/{city}/price_model.joblib`.
  Missing any piece → that city is silently skipped (with a startup log
  warning), not a crash. This is what lets you drop in a new city's data
  before its model is trained.
- **In-memory state** (`state["cities"][slug]`) — every city's dataframe,
  model, locality defaults, SHAP cache, and analytics are loaded once at
  startup and held in memory. No per-request file I/O.
- **`CITY_LABELS`** — the one hardcoded dict in the whole service: maps a
  city slug (`"gurgaon"`) to a display name (`"Gurgaon"`). Everything else
  about which cities exist is discovered from disk, not hardcoded here.
- **Endpoints**: `/health`, `/cities`, `/{city}/localities`,
  `/{city}/recommend`, `/{city}/predict`, `/{city}/predict/explain`,
  `/{city}/listing/{prop_id}`, `/{city}/analytics`. Each delegates its actual
  logic to `recommender.py`, `defaults.py`, or `analytics.py` — this file is
  mostly routing + the startup lifecycle.
- **`_attach_display_info`** — merges a features dataframe with
  `listing_display.csv` on `PROP_ID` to attach images/description to
  recommendation results. Handles a real bug that was found during
  development: both files have a `DESCRIPTION` column, which without an
  explicit drop-before-merge silently produces `DESCRIPTION_x`/`DESCRIPTION_y`
  instead of the one you want.

### `app/schemas.py`
Pydantic models — the request/response "contract" for every endpoint.
- `RecommendRequest` / `RecommendResponse` / `ListingCard` — the search form's
  shape and what a single result card looks like.
- `PredictRequest` / `PredictResponse` — the price-estimator form's shape and
  its output.
- `InsightFactor` / `ExplainResponse` — one SHAP-derived factor (label,
  direction, magnitude) and the full explain-endpoint response.
- Also what makes `/docs` (Swagger UI) auto-generate correctly — FastAPI reads
  these models to build the interactive docs page for free.

### `app/defaults.py`
Solves one specific problem: the trained model needs ~40 feature columns, but
a person filling out the price-estimator form only provides 9 of them
(property type, locality, BHK, bathrooms, balconies, area, floor, total
floors, furnishing). This file:
- `build_locality_defaults(df)` — at startup, computes the median (numeric
  columns) or mode (categorical columns) for every other feature, **per
  locality** (falling back to a city-wide default if a locality has fewer
  than 10 listings — too few to trust a locality-specific median).
- `build_feature_row(request_fields, locality_defaults)` — takes what the
  user actually typed, fills in everything else from the locality's default
  profile, then recomputes the handful of fields that depend on the user's
  actual input rather than trusting a stale median (floor ratio,
  ground/top-floor flags, the luxury score formula).

### `app/recommender.py`
The core prediction and ranking logic, ported from `gurgaon_price_model.ipynb`
into plain importable functions (no notebook-global dependencies).
- `predict_prices(model, candidates)` / `predict_single(model, feature_row)`
  — run the trained pipeline, convert the log-space output back to real
  rupees (the model was trained on `log1p(PRICE)`).
- `recommend_properties(...)` — hard-filters listings by budget/BHK/
  locality/furnish/gated-community/min-amenities, then ranks survivors by a
  weighted blend of: is it underpriced vs. the model's estimate (value
  score), how luxurious (luxury score), how close to the city center
  (inverted distance).
- `get_shap_explanation(shap_cache, locality, bhk)` — looks up the
  precomputed SHAP cache (see `build_shap_cache.py` below) for this
  `(locality, BHK)` combination; falls back to a nearby BHK in the same
  locality, then to the city-wide `__global__` entry, if the exact
  combination isn't cached.
- `build_insight_sentence(top_factors)` — turns the top SHAP factors into an
  actual sentence ("This price is mainly pushed up by X and Y...").

### `app/analytics.py`
Precomputes everything the frontend's Insights page charts need, once per
city at startup (same "compute once, serve many times" pattern as the SHAP
cache).
- `build_price_by_property_type` — box-plot stats (Q1/median/Q3/whiskers,
  IQR-clamped) per property type.
- `build_price_vs_area_sample` / `build_geo_points` — a random 600-row sample
  (not the full ~7-8k listings) for the scatter plot and geo map, to keep the
  API response small.
- `build_distribution` — generic category-count function, reused for both
  property-type and furnishing pie charts.
- `build_word_cloud` — mines real word frequency from listing `DESCRIPTION`
  text (stopword-filtered down to amenity/feature-relevant words: "pool",
  "gym", "cctv", "clubhouse", etc.). This is genuine text from the scraped
  listings, not a hardcoded amenity list — the source data has no decoded
  amenity names (`AMENITIES` is numeric site codes with no public legend).

### `app/__init__.py`
Empty. Its only job is marking `app/` as a Python package so
`from app.recommender import ...`-style imports work inside `main.py`.

## `app/data/{city}/` and `app/models/{city}/` — runtime data

Per city (currently only `gurgaon`):
- `flats_final.csv` — the cleaned, feature-engineered, outlier-free dataset
  from `gurgaon_pipeline.ipynb`. This is both the model's training data and
  what `/recommend`/`/analytics` search and aggregate over live.
- `listing_display.csv` — images (as JSON arrays) + description, keyed by
  `PROP_ID`. Kept separate from `flats_final.csv` because images/description
  are useless as model features but essential for displaying a listing.
- `shap_cache.json` — output of `build_shap_cache.py` (below).
- `price_model.joblib` — the fitted scikit-learn `Pipeline` (one-hot encoder
  + XGBoost regressor together), output of `gurgaon_price_model.ipynb`.

## `data/` — source-of-truth data (not what the API reads directly)

- `data/raw/{city}/flats/flats_{city}.csv` — straight off the scraper, one
  folder per city. All 6 cities have raw data; only Gurgaon has been taken
  further.
- `data/processed/gurgaon/` — `gurgaon_flats_cleaned.csv` (imputed, outliers
  still in — kept for inspection), `gurgaon_flats_final.csv` (final,
  matches `app/data/gurgaon/flats_final.csv` but under the "source of truth"
  path rather than the "API reads this" path), `listing_display.csv`.

The deliberate split between `data/processed/` and `app/data/`: the former is
what the notebooks produce and is versioned/regenerated by re-running them;
the latter is a runtime snapshot the FastAPI process actually loads. A
notebook re-run in progress can't accidentally change what the live API is
serving until you explicitly copy the new files over.

## `notebooks/gurgaon/`

- **`gurgaon_pipeline.ipynb`** — raw scrape → cleaned, feature-engineered,
  imputed, outlier-free dataset. Sections: column audit/pruning, parsing
  nested JSON-ish scraped columns (`MAP_DETAILS`, `FORMATTED`,
  `SECONDARY_TAGS`, `TOP_USPS`, `FORMATTED_LANDMARK_DETAILS`, `AMENITIES`,
  `FEATURES`), core cleaning (dtype fixes, de-duplication, a real unit bug
  fix — `MIN_AREA_SQFT` was mislabeled as square feet when it's actually
  square meters), feature engineering (floor position, geography, luxury
  score, locality cardinality reduction), EDA, missing-value imputation
  (group-median/mode + KNN for geography), and a 3-pass outlier removal
  (domain rules → IQR → Isolation Forest).
- **`gurgaon_pipeline_CELL_GUIDE.md`** — a cell-by-cell walkthrough of the
  above notebook; read this before modifying the pipeline.
- **`gurgaon_price_model.ipynb`** — trains/compares Linear Regression, Ridge,
  Random Forest, and XGBoost on `log1p(PRICE)`; XGBoost wins (R² ≈ 0.90,
  MAPE ≈ 11%); light `RandomizedSearchCV` tuning; SHAP feature importance +
  dependence + waterfall plots; defines and demonstrates
  `recommend_properties()`; saves the final pipeline to
  `../../app/models/gurgaon/price_model.joblib`.
- **`build_shap_cache.py`** — standalone script (not a notebook), run after
  the model notebook. For every `(locality, BHK)` combination with ≥10 real
  listings (83 for Gurgaon), builds a "typical" representative property and
  runs SHAP once, rather than live per API request. Outputs `shap_cache.json`
  keyed by `"{locality}|{bhk}"`, each entry holding the top 6 contributing
  features (translated into plain-language labels, not raw column names)
  plus a `__global__` city-wide fallback entry.

## `scraping/`

`config.py`, `scrape_99acres.py` — the 99acres scraper that produced the raw
CSVs in `data/raw/`. These predate this reference document's author's
involvement in the project, so treat the inline comments in those files
themselves as the authoritative description of what they do, rather than
this summary.

---

# Part 2 — `frontend/`

## Root-level files

- **`auth.js`** — Auth.js v5 config. Currently one provider (Google), JWT
  sessions (no database needed for "who is this person" without persisting
  user records). `trustHost: true` is required for local dev — Auth.js
  otherwise rejects unrecognized hosts as a DNS-rebinding protection meant
  for hosted multi-tenant setups, which doesn't apply to local development.
- **`next.config.mjs`** — `images.remotePatterns` allowlisting
  `mediacdn.99acres.com` (otherwise `next/image` refuses to load listing
  photos from an unrecognized external domain); `turbopack.root` pinned
  explicitly to avoid Next.js guessing the wrong monorepo root when multiple
  `package-lock.json` files exist in parent folders.
- **`.env.local`** (not committed — see `.gitignore`) — `ML_SERVICE_URL`,
  `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL`.

## `app/` — routes (Next.js App Router)

- **`layout.js`** — the root layout. Loads two fonts via `next/font/google`
  (Fraunces for headings, Inter for body), wraps the entire app in
  `AuthSessionProvider` (so `useSession()` works anywhere), and renders
  `<Header />` once here — this is what makes the navbar truly global rather
  than needing to be added to every page individually.
- **`globals.css`** — Tailwind v4 theme tokens. Deliberately kept the same
  token *names* (`navy`, `charcoal`, `gold`, `cream`) through a full palette
  redesign (blueprint → warm ivory/beige/champagne/gold luxury), so every
  component that references `bg-navy`/`text-gold`/etc. picked up the new
  palette automatically with zero component changes. Also defines `.glass`
  (frosted blur utility, used by the header) and `.warm-texture` (subtle
  champagne radial glow).
- **`page.js`** — Home. Deliberately minimal: just `<HeroSearch />` (city
  selection), nothing else — no stats, no city grid (those were removed on
  request; the components still exist under `features/home/` unused, in
  case they're useful for a future "browse all cities" page).
- **`city/[city]/page.js`** — the hub: server component, fetches `/cities`,
  renders 5 cards (Recommendation, Estimation, Insights — all live; Luxury
  Score and Price Trends — still "Coming soon"). 404s via `notFound()` if
  the city slug doesn't exist.
- **`search/page.js`**, **`estimate/page.js`**, **`insights/page.js`** — flat
  redirect pages; each fetches `/cities` and redirects to
  `/{feature}/{firstCityFound}`. Exist so the navbar's links have somewhere
  to go without needing to already know which city you want.
- **`search/[city]/page.js`**, **`estimate/[city]/page.js`**,
  **`insights/[city]/page.js`** — server component wrappers; each awaits the
  dynamic route param and renders the actual client component (`page.js`
  can't be both `async` and a client component, hence the wrapper pattern).
- **`login/page.js`**, **`register/page.js`** — real, functional Google
  sign-in button; GitHub button and email/password fields are visibly
  present but `disabled` — intentionally inert until those providers get
  wired up later.
- **`api/ml/[...path]/route.js`** — the proxy. Every browser-side fetch to
  `ml-service` goes through here instead of hitting it directly — keeps the
  backend's address out of client-side code, sidesteps CORS entirely (same
  origin from the browser's point of view). Returns a clear `502` with an
  explanatory message if `ml-service` isn't reachable, instead of a generic
  unhelpful error.
- **`api/auth/[...nextauth]/route.js`** — Auth.js's own route handler;
  re-exports `{ GET, POST }` from the `handlers` object `auth.js` produces.

## `features/` — one folder per page's specific logic

- **`home/`** — `HeroSearch.jsx` (full-bleed hero, city dropdown, navigates
  to `/city/{slug}`). `MarketSnapshot.jsx`, `FeaturedProperties.jsx`,
  `CityGrid.jsx` still exist but are currently unused by `app/page.js`.
- **`city-hub/`** — `CityHubCard.jsx`, the reusable card (live link or
  "Coming soon" state) used on the hub page.
- **`property-search/`** — `SearchPageClient.jsx` (composes the below),
  `SearchFilters.jsx` (locality/budget/BHK/furnish filter bar),
  `ResultsGrid.jsx` (loading/error/empty states + the grid),
  `PropertyCard.jsx` (one listing — `unoptimized` on `next/image` plus an
  `onError` fallback, since the CDN photos aren't always reliably
  hotlinkable), `useRecommend.js` (the hook owning filter state and the
  `/recommend` call).
- **`price-estimator/`** — `EstimatePageClient.jsx` (composes the below),
  `EstimatorForm.jsx` (the 9-field form), `InsightPanel.jsx` (predicted
  price + SHAP factor bars + plain-language sentence; explicitly flags when
  the SHAP cache had to fall back to the city-wide scenario instead of an
  exact match), `usePredict.js` (calls `/predict` and `/predict/explain` in
  parallel on submit).
- **`insights/`** — `PriceBoxPlot.jsx` (hand-built SVG — recharts has no
  native box plot), `PriceAreaScatter.jsx`, `GeoScatterMap.jsx` (a scatter
  plot bucketed into 4 price tiers, not a real tiled map — avoids needing
  Leaflet/Mapbox + API keys), `DistributionPie.jsx` (generic, reused for
  both property-type and furnishing pies), `AmenityWordCloud.jsx`
  (hand-built flex-wrap cloud, font size scaled by `sqrt` of frequency so
  the single most common word doesn't visually dominate everything else).
- **`auth/`** — `GoogleSignInButton.jsx`, the one real, functional auth
  control in the app right now.

## `shared/` — reused across every feature

- **`api/client.js`** — every browser-side call to `ml-service` goes through
  here (`getCities`, `getLocalities`, `recommendProperties`,
  `predictPrice`, `explainPrediction`, `getListing`) — all go through the
  `/api/ml/*` proxy, all take a `city` parameter. If the API's response
  shape ever changes, this is the one file that needs updating.
- **`api/serverClient.js`** — the server-component equivalent; calls
  `ml-service` directly (server-to-server, no CORS concern, no proxy hop
  needed) for pages that fetch data before rendering (Home, the city hub,
  Insights).
- **`ui/Header.jsx`** — the navbar. `usePathname()` + a scroll listener
  determine its background: fully transparent only on Home before scrolling
  (there's a hero image behind it there), a dimmed blurred dark panel
  (`bg-navy/75 backdrop-blur-md`) everywhere else and once scrolled. Text is
  **always white** — an earlier version tried switching between white/dark
  text depending on state, which is fragile (and once broke silently because
  Tailwind can't detect dynamically-interpolated class names like
  `` `hover:${var}` `` at build time). Also session-aware: shows
  Login/Register when signed out, avatar + name + Logout when signed in. Nav
  links (Buy/Prediction/Insights/About) are hidden entirely on Home, shown
  everywhere else.
- **`ui/Button.jsx`, `ui/Badge.jsx`, `ui/Select.jsx`** — small reusable
  primitives. `ui/Card.jsx` also exists in the repo but isn't used by
  anything built in this project.
- **`lib/format.js`** — `formatINR` (₹1.85 Cr / ₹85.0 L formatting),
  `formatArea`, `formatPricePerSqft`, `getValueBadge` (turns a raw
  `VALUE_SCORE` into a "7% below estimate" / "at market value" / "above
  estimate" badge, with a ±3% neutral band since smaller differences are
  within the model's own ~11% error margin).
- **`providers/AuthSessionProvider.jsx`** — thin client-component wrapper
  around Auth.js's `SessionProvider`, needed because `layout.js` itself
  stays a server component but `useSession()` requires a client-side
  provider somewhere in the tree.

---

# Everything used in this project, and why

| Category | Choice | Why |
|---|---|---|
| Backend framework | FastAPI | Auto-generated docs (`/docs`), Pydantic validation for free, async-friendly |
| ML | XGBoost | Won the model comparison (R² 0.90 vs. 0.73 for linear regression) on this mixed categorical/numeric tabular data |
| Explainability | SHAP | `TreeExplainer` for feature-level, per-prediction explanations, not just global importance |
| Data | pandas, numpy | Standard tabular manipulation throughout the pipeline and API |
| Frontend framework | Next.js 16 (App Router) | Server components for data-fetching pages (Home, hub, Insights) without needing a client-side loading state; file-based routing matches the multi-city `[city]` dynamic-segment pattern cleanly |
| Styling | Tailwind CSS v4 | `@theme`-based design tokens meant the entire palette could be redesigned by changing 4 hex values, zero component changes |
| Charts | Recharts | Scatter/pie out of the box; box plot and word cloud hand-built since Recharts doesn't support those natively |
| Auth | Auth.js v5 | Current recommended library for Next.js 16 (successor to NextAuth v4); JWT sessions avoid needing a database for a Google-only setup |
| Fonts | Fraunces (serif, headings) + Inter (body) | Elegant/luxury feel for the redesigned ivory/champagne palette |