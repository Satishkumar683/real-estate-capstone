# RealEstateAI — Architecture & Integration Guide

This document explains **how the frontend was built**, **why it was built that way**, and **exactly how it merges with the existing scraping and ML pipeline**. Read this before touching Phase 3 (ML) or Phase 4 (FastAPI) so nothing has to be rewritten.

---

## 1. The full system, end to end

```
┌─────────────┐     ┌──────────┐     ┌────────────┐     ┌──────────────┐
│  scraping/  │ --> │ database │ --> │ ml-service/ │ --> │  frontend/   │
│ (Phase 1)   │     │ (future) │     │ (Phase 3+4) │     │  (Phase 2)   │
└─────────────┘     └──────────┘     └────────────┘     └──────────────┘
  Playwright/           CSV today,      FastAPI +           Next.js 16
  Selenium scrapes       real DB         trained ML          + Tailwind
  99acres.com listings   later           model, exposes      UI
                                          REST endpoints
```

**The rule that governs everything below:** the frontend never talks to the scraper, and never talks to the database directly. It only ever talks to FastAPI. This is why we could build the entire frontend today, before FastAPI or the database exist — because the frontend was built against a **contract**, not against real infrastructure.

---

## 2. Why frontend-first was possible without the backend existing

Normally you'd think "no backend yet" means "can't build the UI yet." We avoided that by building **three fixed points** first, before any page or component:

1. **The data shape** (`features/properties/types/index.ts`) — a TypeScript `Property` interface. This is the contract. Whatever `ml-service` returns in Phase 4 must match this shape field-for-field.
2. **The service layer** (`features/properties/services/propertyService.ts`) — functions like `getProperties()` that components call. They don't know or care where data comes from.
3. **A single switch** (`config/env.ts` → `API_MODE`) that decides whether the service layer's requests go to local mock routes or to real FastAPI.

Because of this, every page, hook, and component was written once and will **never need to change** when FastAPI goes live. Only `config/env.ts` and the URL inside it change.

---

## 3. Request flow — today vs. after Phase 4

**Today (`API_MODE = "mock"`):**
```
PropertiesPage → useProperties() hook → getProperties() service
  → apiClient.get("/api/properties") → Next.js local route handler
  → reads mocks/data/properties.json → returns JSON
```

**After Phase 4 (`API_MODE = "fastapi"`):**
```
PropertiesPage → useProperties() hook → getProperties() service
  → apiClient.get("/api/properties") → ml-service/app/main.py's
    real FastAPI endpoint → reads from database → returns JSON
```

Notice the first three arrows are identical. Only what's behind `apiClient` changes, and that's a one-line env var flip, not a code change.

---

## 4. Folder structure and what each part is responsible for

```
frontend/
├── app/                          Routing only. No business logic lives here.
│   ├── (public)/                 Route group — no auth required.
│   │   ├── page.tsx               Home page.
│   │   └── properties/
│   │       ├── page.tsx           Listing page (client component).
│   │       └── [id]/page.tsx      Detail page (server component).
│   ├── (protected)/               Route group reserved for Phase 5 auth.
│   │   └── layout.tsx             Currently a pass-through. Will redirect
│   │                              unauthenticated users once NextAuth lands.
│   └── api/                       Local mock routes — stand-ins for FastAPI.
│       ├── properties/route.ts    Mirrors FastAPI's GET /properties contract.
│       ├── properties/[id]/route.ts
│       └── predict-price/route.ts Mirrors FastAPI's ML POST /predict-price.
│
├── features/                      Business logic, grouped by domain — NOT by
│   │                              file type. Adding a new domain (e.g.
│   │                              "recommendations" in Phase 3) means adding
│   │                              a new features/recommendations/ folder,
│   │                              never touching existing ones.
│   ├── properties/
│   │   ├── types/                 The Property contract (see §2).
│   │   ├── services/              Functions that fetch data. THE SEAM.
│   │   ├── hooks/                 React state wrapping around services.
│   │   ├── components/            Presentation only — PropertyCard, Grid.
│   │   └── utils/                 Pure functions, e.g. price formatting.
│   ├── search/                    Reserved for filter bar logic (not built
│   │                              yet — deliberately left minimal in the
│   │                              listing page for now).
│   └── auth/
│       └── hooks/useSession.ts    STUB. Returns { user: null }. Shaped
│                                  identically to NextAuth's real useSession()
│                                  so Phase 5 is a file-content swap, not a
│                                  rewrite of every component that uses it.
│
├── shared/                        Cross-feature reusable pieces.
│   ├── components/ui/             Button, Card — the design system.
│   ├── components/layout/         Navbar, Footer.
│   └── lib/apiClient.ts           The ONLY file that knows the backend base
│                                  URL. Everything else calls through it.
│
├── mocks/data/properties.json     Fake data, shaped exactly like real
│                                  scraped listings will be.
│
├── config/env.ts                  The single mock/fastapi switch (see §3).
│
└── proxy.ts                       No-op today. Phase 5 adds real session
                                   verification here (Next.js 16 renamed
                                   middleware.ts to proxy.ts).
```

---

## 5. How each future phase plugs in — without touching existing code

### Phase 3 — Machine Learning
- New model code lives in `ml-service/app/models/`.
- Preprocessing already exists at `ml-service/app/preprocessing/preprocess.ipynb`.
- Nothing in `frontend/` changes yet. The frontend already has a
  `PricePrediction` type and a stubbed `getPricePrediction()` service function
  waiting to be wired to a real endpoint — it currently calls the mock
  `/api/predict-price` route and gets back a hardcoded number.

### Phase 4 — FastAPI Integration
- Add `ml-service/app/main.py`, exposing `/properties`, `/properties/{id}`,
  `/predict-price`, `/recommend-properties`, `/compare-properties`,
  `/analytics`, `/similar-properties` — matching the response shapes already
  defined in `features/properties/types/index.ts` and mirrored by the mock
  routes in `app/api/`.
- In `frontend/.env.local`, set:
  ```
  NEXT_PUBLIC_API_MODE=fastapi
  NEXT_PUBLIC_FASTAPI_BASE_URL=http://localhost:8000
  ```
- Nothing else changes. No component, hook, or page is touched.

### Phase 5 — Authentication (NextAuth, Google/GitHub/JWT/RBAC)
- Replace the contents of `features/auth/hooks/useSession.ts` with the real
  `useSession` from `next-auth/react`.
- Add real logic to `app/(protected)/layout.tsx` (redirect if
  `status === "unauthenticated"`).
- Add real logic to `proxy.ts` (verify session, redirect if missing).
- The `(protected)` route group and its folder boundary already exist —
  Phase 5 fills in logic, it doesn't restructure routing.

### Phase 6 — Deployment
- `frontend/` deploys independently (e.g. Vercel) with
  `NEXT_PUBLIC_FASTAPI_BASE_URL` pointed at the deployed `ml-service`.
- `ml-service/` and `scraping/` deploy separately — the frontend has zero
  dependency on how or where they run, only on the URL it's given.

---

## 6. Why this specific structure (design rationale)

| Decision | Reason |
|---|---|
| Feature-based folders, not type-based (`components/`, `hooks/` globally) | Each domain (`properties`, `auth`, future `recommendations`) is self-contained. Adding Phase 3 features never means editing existing folders. |
| Service layer (`services/*.ts`) as the only fetcher | Swapping mock → FastAPI is a one-line change, not a search-and-replace across the codebase. |
| Local API routes mirror FastAPI's exact contract | Phase 4 becomes "point the URL at a different server," not "rewrite the response parsing." |
| Auth stub shaped like real NextAuth | Components written today against `useSession()` keep working unchanged once real auth lands. |
| Route groups `(public)` / `(protected)` created before auth exists | The folder boundary — which pages need auth — is a routing decision made once, now, rather than retrofitted later. |
| Single `API_MODE` switch in one file | One inspectable place controls the entire app's backend target — no scattered `if (isDev)` checks. |

---

## 7. Running it

```bash
cd frontend
npm install
npm run dev
```

Visit `localhost:3000` (home) and `localhost:3000/properties` (listing, backed by mock data through the same code path FastAPI will use later).