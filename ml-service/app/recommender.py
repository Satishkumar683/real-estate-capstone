"""
Ported from the "Recommender" and "Price prediction" sections of
gurgaon_price_model.ipynb -- see that notebook for the full walkthrough,
model comparison, and SHAP explainability. This module is the trimmed-down,
importable version used by the FastAPI app.
"""

import numpy as np
import pandas as pd

NON_FEATURE_COLS = [
    'PROP_ID', 'DESCRIPTION', 'PREFERENCE', 'PROP_NAME', 'SOCIETY_NAME', 'BUILDING_NAME',
    'CLASS_LABEL', 'REGISTER_DATE', 'EXPIRY_DATE', 'RERA_STATUS', 'LOCALITY',
    'PRICE_PER_SQFT_CALC', 'PRICE_SQFT',
]
BOOLEAN_COLS = [
    'IS_READY_TO_MOVE', 'IS_RESALE', 'IS_RERA', 'IS_GATED_COMMUNITY', 'IS_HUDA_APPROVED',
    'IS_GROUND_FLOOR', 'IS_TOP_FLOOR',
]
TARGET = 'PRICE'


def _model_input(candidates: pd.DataFrame) -> pd.DataFrame:
    """Strips a dataframe down to exactly the columns + dtypes the trained pipeline expects."""
    feat = candidates.drop(columns=[c for c in NON_FEATURE_COLS if c in candidates.columns])
    feat = feat.drop(columns=[TARGET], errors='ignore')
    for c in BOOLEAN_COLS:
        if c in feat.columns:
            feat[c] = feat[c].astype(int)
    return feat


def predict_prices(model, candidates: pd.DataFrame) -> np.ndarray:
    """Returns predicted prices (real rupees, not log) for every row in candidates."""
    pred_log = model.predict(_model_input(candidates))
    return np.expm1(pred_log)


def predict_single(model, feature_row: dict) -> float:
    """Predicts price for a single hand-built feature dict (used by /predict)."""
    df = pd.DataFrame([feature_row])
    return float(predict_prices(model, df)[0])


def get_shap_explanation(shap_cache: dict, locality: str, bhk: int) -> dict:
    """Looks up the precomputed SHAP cache for this (locality, BHK) scenario.
    Falls back to the same-locality entry with the nearest BHK, then to the
    city-wide '__global__' entry if the locality isn't in the cache at all --
    this is the tradeoff of precomputing over common scenarios rather than
    running SHAP live: an unusual combination gets the closest cached
    explanation available, not a bespoke one for the exact input."""
    key = f'{locality}|{bhk}'
    if key in shap_cache:
        return shap_cache[key], key

    # Same locality, different BHK -- try neighbors before giving up on locality match
    for delta in (1, -1, 2, -2):
        alt_key = f'{locality}|{bhk + delta}'
        if alt_key in shap_cache:
            return shap_cache[alt_key], alt_key

    return shap_cache['__global__'], '__global__'


def build_insight_sentence(top_factors: list) -> str:
    """Turns the top 1-2 SHAP factors into a plain-language sentence."""
    if not top_factors:
        return 'Not enough comparable listings to explain this prediction in detail.'

    positives = [f['label'] for f in top_factors if f['direction'] == 'positive'][:2]
    negatives = [f['label'] for f in top_factors if f['direction'] == 'negative'][:2]

    parts = []
    if positives:
        parts.append(f"pushed up by {' and '.join(positives).lower()}")
    if negatives:
        parts.append(f"pulled down by {' and '.join(negatives).lower()}")

    if not parts:
        return 'This price is close to the typical listing for comparable properties.'
    return f"This price is mainly {', and '.join(parts)}, relative to comparable listings."


def recommend_properties(
    df: pd.DataFrame,
    model,
    budget_min: float,
    budget_max: float,
    bhk: int | None = None,
    locality: str | None = None,
    furnish: str | None = None,
    gated_only: bool = False,
    min_amenities: int | None = None,
    top_n: int = 10,
    weights: dict | None = None,
) -> pd.DataFrame:
    """Preference-based property search over Sale listings. See
    gurgaon_price_model.ipynb section 6 for the full explanation of the ranking logic."""
    weights = weights or {'value': 0.5, 'luxury': 0.3, 'distance': 0.2}

    candidates = df[(df['PREFERENCE'] == 'Sale') &
                     (df['PRICE'].between(budget_min, budget_max))].copy()

    if bhk is not None:
        candidates = candidates[candidates['BHK'] == bhk]
    if locality is not None:
        candidates = candidates[candidates['LOCALITY_GROUPED'].str.contains(locality, case=False, na=False)]
    if furnish is not None:
        candidates = candidates[candidates['FURNISH'] == furnish]
    if gated_only:
        candidates = candidates[candidates['IS_GATED_COMMUNITY']]
    if min_amenities is not None:
        candidates = candidates[candidates['AMENITIES_COUNT'] >= min_amenities]

    if candidates.empty:
        return candidates

    predicted_price = predict_prices(model, candidates)
    value_score = (predicted_price - candidates['PRICE']) / predicted_price
    candidates = candidates.assign(PREDICTED_PRICE=predicted_price, VALUE_SCORE=value_score)

    def norm(s):
        rng = s.max() - s.min()
        return (s - s.min()) / rng if rng > 0 else pd.Series(0.5, index=s.index)

    rank_score = (
        weights['value'] * norm(candidates['VALUE_SCORE'])
        + weights['luxury'] * norm(candidates['LUXURY_SCORE'])
        + weights['distance'] * (1 - norm(candidates['DIST_FROM_CENTER_KM']))
    )
    candidates = candidates.assign(RANK_SCORE=rank_score)

    return candidates.sort_values('RANK_SCORE', ascending=False).head(top_n)