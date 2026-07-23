import json
from contextlib import asynccontextmanager
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.analytics import build_analytics
from app.defaults import build_locality_defaults, build_feature_row
from app.recommender import recommend_properties, predict_single, get_shap_explanation, build_insight_sentence
from app.schemas import (
    RecommendRequest, RecommendResponse, ListingCard,
    PredictRequest, PredictResponse, ExplainResponse,
)

DATA_DIR = Path(__file__).parent / "data"
MODEL_DIR = Path(__file__).parent / "models"

# CITY_LABELS is the one place a new city's display name is declared -- everything
# else (which cities exist, what data they have) is discovered from the folders
# on disk, not hardcoded here. Add a line here when you add a city; if you forget,
# the city still works, it just shows its slug instead of a nice display name.
CITY_LABELS = {
    "gurgaon": "Gurgaon",
    "mumbai": "Mumbai",
    "bangalore": "Bangalore",
    "hyderabad": "Hyderabad",
    "chandigarh": "Chandigarh",
    "kolkata": "Kolkata",
}

state: dict = {"cities": {}}


def _discover_cities() -> list[str]:
    """A city is considered loadable if app/data/{city}/ has both required CSVs
    AND app/models/{city}/price_model.joblib exists. Anything missing either
    piece is silently skipped -- lets you drop in a new city's data before its
    model is trained without crashing the whole service."""
    cities = []
    if not DATA_DIR.exists():
        return cities
    for city_dir in DATA_DIR.iterdir():
        if not city_dir.is_dir():
            continue
        city = city_dir.name
        has_data = (city_dir / "flats_final.csv").exists() and (city_dir / "listing_display.csv").exists()
        has_model = (MODEL_DIR / city / "price_model.joblib").exists()
        if has_data and has_model:
            cities.append(city)
        elif has_data or has_model:
            print(f"[startup] Skipping '{city}': has_data={has_data}, has_model={has_model} (need both)")
    return cities


def _load_city(city: str) -> dict:
    city_data_dir = DATA_DIR / city
    features_df = pd.read_csv(city_data_dir / "flats_final.csv")
    display_df = pd.read_csv(city_data_dir / "listing_display.csv")
    model = joblib.load(MODEL_DIR / city / "price_model.joblib")
    locality_defaults = build_locality_defaults(features_df[features_df["PREFERENCE"] == "Sale"])

    shap_cache_path = city_data_dir / "shap_cache.json"
    shap_cache = json.loads(shap_cache_path.read_text()) if shap_cache_path.exists() else None
    if shap_cache is None:
        print(f"[startup] '{city}': no shap_cache.json found -- /explain will be unavailable for this city")

    analytics = build_analytics(features_df[features_df["PREFERENCE"] == "Sale"])

    return {
        "features_df": features_df,
        "display_df": display_df,
        "model": model,
        "locality_defaults": locality_defaults,
        "shap_cache": shap_cache,
        "analytics": analytics,
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    for city in _discover_cities():
        state["cities"][city] = _load_city(city)
        print(f"[startup] Loaded '{city}': {len(state['cities'][city]['features_df'])} listings")
    if not state["cities"]:
        print("[startup] WARNING: no cities loaded -- check app/data/{city}/ and app/models/{city}/")
    yield
    state["cities"].clear()


app = FastAPI(title="Real Estate ml-service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _city_state(city: str) -> dict:
    if city not in state["cities"]:
        available = list(state["cities"].keys())
        raise HTTPException(
            status_code=404,
            detail=f"Unknown or unavailable city '{city}'. Available: {available}",
        )
    return state["cities"][city]


def _attach_display_info(city: str, rows: pd.DataFrame) -> list[ListingCard]:
    display_df = _city_state(city)["display_df"]
    # DESCRIPTION exists in both features_df and display_df -- drop it from the
    # features side first so the merge doesn't silently produce DESCRIPTION_x/_y.
    rows = rows.drop(columns=["DESCRIPTION"], errors="ignore")
    merged = rows.merge(display_df, on="PROP_ID", how="left")
    cards = []
    for _, r in merged.iterrows():
        images = []
        try:
            images = json.loads(r.get("PROPERTY_IMAGES", "[]") or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        cards.append(ListingCard(
            prop_id=r["PROP_ID"],
            society_name=r.get("SOCIETY_NAME", "Unknown"),
            locality=r["LOCALITY_GROUPED"],
            property_type=r["PROPERTY_TYPE"],
            bhk=r["BHK"],
            area_sqft=r["AREA_SQFT"],
            price=r["PRICE"],
            predicted_price=r["PREDICTED_PRICE"],
            value_score=r["VALUE_SCORE"],
            luxury_score=r["LUXURY_SCORE"],
            dist_from_center_km=r["DIST_FROM_CENTER_KM"],
            furnish=r["FURNISH"],
            rank_score=r["RANK_SCORE"],
            thumbnail_url=(images[0] if images else None),
            images=images,
            description=r.get("DESCRIPTION"),
        ))
    return cards


@app.get("/health")
def health():
    return {
        "status": "ok",
        "cities_loaded": {c: len(s["features_df"]) for c, s in state["cities"].items()},
    }


@app.get("/cities")
def get_cities():
    """List every city currently loaded and ready to serve, with a display name
    and listing count. The frontend's city picker/market-snapshot stats should
    only ever use this list -- not every folder under data/raw/, since not all
    of those have been through the pipeline + model notebooks yet."""
    return [
        {
            "slug": c,
            "label": CITY_LABELS.get(c, c.title()),
            "count": len(s["features_df"]),
        }
        for c, s in sorted(state["cities"].items())
    ]


@app.get("/{city}/localities")
def get_localities(city: str):
    city_data = _city_state(city)
    localities = city_data["features_df"]["LOCALITY_GROUPED"].dropna().unique().tolist()
    return sorted(localities)


@app.get("/{city}/analytics")
def get_analytics(city: str):
    """Precomputed data for the Insights page's charts -- box plot, scatter,
    geo map, pie charts, word cloud. Computed once at startup, not per request."""
    return _city_state(city)["analytics"]


@app.post("/{city}/recommend", response_model=RecommendResponse)
def recommend(city: str, req: RecommendRequest):
    city_data = _city_state(city)
    weights = {
        "value": req.value_weight,
        "luxury": req.luxury_weight,
        "distance": req.distance_weight,
    }
    results = recommend_properties(
        city_data["features_df"], city_data["model"],
        budget_min=req.budget_min, budget_max=req.budget_max, bhk=req.bhk,
        locality=req.locality, furnish=req.furnish, gated_only=req.gated_only,
        min_amenities=req.min_amenities, top_n=req.top_n, weights=weights,
    )
    if results.empty:
        return RecommendResponse(count=0, results=[])
    return RecommendResponse(count=len(results), results=_attach_display_info(city, results))


@app.post("/{city}/predict", response_model=PredictResponse)
def predict(city: str, req: PredictRequest):
    city_data = _city_state(city)
    feature_row = build_feature_row(req.model_dump(), city_data["locality_defaults"])
    price = predict_single(city_data["model"], feature_row)
    return PredictResponse(
        predicted_price=round(price, -3),
        predicted_price_per_sqft=round(price / req.area_sqft, 2),
        note="Estimate based on comparable listings in this locality; not a valuation.",
    )


@app.get("/{city}/listing/{prop_id}")
def get_listing(city: str, prop_id: str):
    city_data = _city_state(city)
    row = city_data["features_df"][city_data["features_df"]["PROP_ID"] == prop_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Listing not found")
    cards = _attach_display_info(city, row.assign(
        PREDICTED_PRICE=row["PRICE"], VALUE_SCORE=0.0, RANK_SCORE=0.0,
    ))
    return cards[0]


@app.post("/{city}/predict/explain", response_model=ExplainResponse)
def predict_explain(city: str, req: PredictRequest):
    """Insight-panel endpoint: returns a plain-language explanation of what's
    driving the price, using a precomputed SHAP cache rather than running SHAP
    live per request (faster, at the cost of exactness for unusual inputs --
    see get_shap_explanation's fallback logic for how a near-miss is handled)."""
    city_data = _city_state(city)
    if city_data["shap_cache"] is None:
        raise HTTPException(
            status_code=404,
            detail=f"No SHAP cache available for '{city}' yet -- run build_shap_cache.py for this city.",
        )

    # Predicted price still comes from the live model (cheap to compute per-request);
    # only the SHAP explanation itself is served from the precomputed cache.
    feature_row = build_feature_row(req.model_dump(), city_data["locality_defaults"])
    price = predict_single(city_data["model"], feature_row)

    scenario, matched_key = get_shap_explanation(city_data["shap_cache"], req.locality, req.bhk)
    return ExplainResponse(
        predicted_price=round(price, -3),
        top_factors=scenario["top_factors"],
        insight=build_insight_sentence(scenario["top_factors"]),
        matched_scenario=matched_key,
        sample_size=scenario["sample_size"],
    )