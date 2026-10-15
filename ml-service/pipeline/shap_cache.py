"""
Precomputes SHAP explanations for common (locality, BHK) scenarios per city.
Saves json to app/data/{city}/shap_cache.json.
"""
import json
from pathlib import Path
import numpy as np
import pandas as pd
import shap
from pipeline.config import (
    BOOLEAN_COLS, CATEGORICAL_COLS, NON_FEATURE_COLS, TARGET
)

MIN_GROUP_SIZE = 8
TOP_K = 6

FRIENDLY_NUMERIC = {
    'AREA_SQFT': lambda v: f'Area ({v:,.0f} sqft)',
    'BHK': lambda v: f'{v:.0f} BHK',
    'BATHROOM_NUM': lambda v: f'{v:.0f} bathrooms',
    'BALCONY_NUM': lambda v: f'{v:.0f} balconies',
    'TOTAL_FLOOR': lambda v: f'Building height ({v:.0f} floors)',
    'FLOOR_NUM': lambda v: f'Floor number ({v:.0f})',
    'FLOOR_RATIO': lambda v: 'Relative floor position',
    'DIST_FROM_CENTER_KM': lambda v: f'Distance from city center ({v:.1f} km)',
    'LATITUDE': lambda v: 'Geographic location',
    'LONGITUDE': lambda v: 'Geographic location',
    'LUXURY_SCORE': lambda v: f'Luxury score ({v:.1f})',
    'AMENITIES_COUNT': lambda v: f'Amenities ({v:.0f} listed)',
    'FEATURES_COUNT': lambda v: f'Features ({v:.0f} listed)',
    'USP_COUNT': lambda v: 'Listing highlights count',
    'TOTAL_NEARBY_LANDMARKS': lambda v: f'Nearby landmarks ({v:.0f})',
    'CARPET_SQFT': lambda v: f'Carpet area ({v:,.0f} sqft)',
    'SUPERBUILTUP_SQFT': lambda v: f'Super built-up area ({v:,.0f} sqft)',
    'BROKERAGE': lambda v: 'Brokerage amount',
    'LISTING_DURATION_DAYS': lambda v: 'Listing duration',
}

FRIENDLY_NEARBY = {
    'NEARBY_SHOPPING': 'Nearby shopping',
    'NEARBY_EDUCATION': 'Nearby schools',
    'NEARBY_HOSPITAL': 'Nearby hospitals',
    'NEARBY_METROSTATION': 'Metro connectivity',
    'NEARBY_RAILWAYSTATION': 'Railway connectivity',
    'NEARBY_CONNECTIVITY': 'Road connectivity',
    'NEARBY_BANK': 'Nearby banks',
    'NEARBY_PARK': 'Nearby parks',
}

FRIENDLY_BOOL = {
    'IS_READY_TO_MOVE': 'Ready to move in',
    'IS_RESALE': 'Resale property',
    'IS_RERA': 'RERA registered',
    'IS_GATED_COMMUNITY': 'Gated community',
    'IS_HUDA_APPROVED': 'HUDA approved',
    'IS_GROUND_FLOOR': 'Ground floor',
    'IS_TOP_FLOOR': 'Top floor',
}


def friendly_label(col, value):
    if col in FRIENDLY_NUMERIC:
        return FRIENDLY_NUMERIC[col](value)
    if col in FRIENDLY_NEARBY:
        return FRIENDLY_NEARBY[col]
    if col in FRIENDLY_BOOL:
        return FRIENDLY_BOOL[col]
    for cat, prefix in [('LOCALITY_GROUPED', 'Locality'), ('PROPERTY_TYPE', 'Property type'),
                        ('FURNISH', 'Furnishing'), ('FACING_TEXT', 'Facing')]:
        if col.startswith(cat + '_'):
            return f'{prefix}: {col[len(cat)+1:]}'
    if any(col.startswith(p) for p in ('FACING_CODE_', 'AGE_CODE_', 'OWNTYPE_CODE_', 'TRANSACT_TYPE_CODE_')):
        return None
    return col.replace('_', ' ').title()


def build_representative_row(sub: pd.DataFrame, X_cols: list, categorical_cols: list) -> pd.DataFrame:
    row = sub[X_cols].median(numeric_only=True)
    for c in categorical_cols:
        mode = sub[c].mode()
        row[c] = mode.iloc[0] if len(mode) else 'Unknown'
    return pd.DataFrame([row])[X_cols]


def explain_row(row_df, prep, model, explainer, encoded_feature_names, boolean_cols):
    row_df = row_df.copy()
    for c in boolean_cols:
        if c in row_df.columns:
            row_df[c] = row_df[c].astype(int)
    encoded = pd.DataFrame(prep.transform(row_df), columns=encoded_feature_names)
    pred_price = float(np.expm1(model.predict(encoded)[0]))
    shap_vals = explainer.shap_values(encoded)[0]

    order = np.argsort(-np.abs(shap_vals))
    factors = []
    for i in order:
        col = encoded_feature_names[i]
        label = friendly_label(col, encoded.iloc[0, i])
        if label is None:
            continue
        factors.append({
            'label': label,
            'direction': 'positive' if shap_vals[i] > 0 else 'negative',
            'magnitude': round(abs(float(shap_vals[i])), 4),
        })
        if len(factors) >= TOP_K:
            break
    return pred_price, factors


def generate_shap_cache(df: pd.DataFrame, pipe, output_path: Path):
    """Computes and writes SHAP cache for the city."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    sale_df = df[df['PREFERENCE'] == 'Sale'].copy()
    if len(sale_df) < 20:
        sale_df = df.copy()

    drop_cols = [c for c in NON_FEATURE_COLS if c in sale_df.columns] + [TARGET]
    X_cols = [c for c in sale_df.columns if c not in drop_cols]

    prep = pipe.named_steps['prep']
    model = pipe.named_steps['model']

    encoded_feature_names = (
        list(prep.named_transformers_['cat'].get_feature_names_out(CATEGORICAL_COLS))
        + [c for c in X_cols if c not in CATEGORICAL_COLS]
    )
    explainer = shap.TreeExplainer(model)

    cache = {}

    # 1. City-wide global fallback scenario
    global_row = build_representative_row(sale_df, X_cols, CATEGORICAL_COLS)
    price, factors = explain_row(global_row, prep, model, explainer, encoded_feature_names, BOOLEAN_COLS)
    cache['__global__'] = {
        'predicted_price': price,
        'top_factors': factors,
        'sample_size': len(sale_df),
    }

    # 2. Per (locality, BHK) scenarios
    combo_counts = sale_df.groupby(['LOCALITY_GROUPED', 'BHK']).size()
    combos = combo_counts[combo_counts >= MIN_GROUP_SIZE].index.tolist()
    print(f"  [SHAP] Precomputing explanations for {len(combos)} (locality, BHK) scenarios...")

    for locality, bhk in combos:
        sub = sale_df[(sale_df['LOCALITY_GROUPED'] == locality) & (sale_df['BHK'] == bhk)]
        row = build_representative_row(sub, X_cols, CATEGORICAL_COLS)
        price, factors = explain_row(row, prep, model, explainer, encoded_feature_names, BOOLEAN_COLS)
        key = f"{locality}|{int(bhk)}"
        cache[key] = {
            'predicted_price': price,
            'top_factors': factors,
            'sample_size': len(sub),
        }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(cache, f, indent=2)
    print(f"  [SHAP] Successfully saved {len(cache)} scenarios to {output_path}")
