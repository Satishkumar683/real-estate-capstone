"""
Precomputes SHAP explanations for every (locality, BHK) combination with enough
listings to be a meaningful "common scenario" (>=10), rather than running SHAP
live per API request. Saves a small JSON keyed by "{locality}|{bhk}", each
entry holding the top 6 contributing features (friendly label, direction,
relative magnitude) plus a representative predicted price for that scenario.

A "__global__" entry (using the city-wide median/mode profile) is included as
a fallback for BHK/locality combinations that aren't in the cache.
"""
import pandas as pd, numpy as np, joblib, shap, json

RAW_PATH = 'data/processed/gurgaon/gurgaon_flats_final.csv'
MODEL_PATH = 'app/models/gurgaon/price_model.joblib'
OUT_PATH = 'notebooks/gurgoan/shap_cache.json'
MIN_GROUP_SIZE = 10
TOP_K = 6

NON_FEATURE_COLS = ['PROP_ID', 'DESCRIPTION', 'PREFERENCE', 'PROP_NAME', 'SOCIETY_NAME',
    'BUILDING_NAME', 'CLASS_LABEL', 'REGISTER_DATE', 'EXPIRY_DATE', 'RERA_STATUS',
    'LOCALITY', 'PRICE_PER_SQFT_CALC', 'PRICE_SQFT']
BOOLEAN_COLS = ['IS_READY_TO_MOVE', 'IS_RESALE', 'IS_RERA', 'IS_GATED_COMMUNITY',
    'IS_HUDA_APPROVED', 'IS_GROUND_FLOOR', 'IS_TOP_FLOOR']
CATEGORICAL_COLS = ['PROPERTY_TYPE', 'FURNISH', 'LOCALITY_GROUPED', 'FACING_CODE',
    'AGE_CODE', 'OWNTYPE_CODE', 'TRANSACT_TYPE_CODE', 'FACING_TEXT']
TARGET = 'PRICE'

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
    'NEARBY_SHOPPING': 'Nearby shopping', 'NEARBY_EDUCATION': 'Nearby schools',
    'NEARBY_HOSPITAL': 'Nearby hospitals', 'NEARBY_METROSTATION': 'Metro connectivity',
    'NEARBY_RAILWAYSTATION': 'Railway connectivity', 'NEARBY_CONNECTIVITY': 'Road connectivity',
    'NEARBY_BANK': 'Nearby banks', 'NEARBY_PARK': 'Nearby parks',
}
FRIENDLY_BOOL = {
    'IS_READY_TO_MOVE': 'Ready to move in', 'IS_RESALE': 'Resale property',
    'IS_RERA': 'RERA registered', 'IS_GATED_COMMUNITY': 'Gated community',
    'IS_HUDA_APPROVED': 'HUDA approved', 'IS_GROUND_FLOOR': 'Ground floor',
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
        return None  # unlabeled site codes -- too cryptic to show a user
    return col.replace('_', ' ').title()


def build_representative_row(sub, X_cols, categorical_cols):
    row = sub[X_cols].median(numeric_only=True)
    for c in categorical_cols:
        row[c] = sub[c].mode().iloc[0]
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


def main():
    df = pd.read_csv(RAW_PATH)
    df = df[df['PREFERENCE'] == 'Sale'].copy()
    feat_df = df.drop(columns=[c for c in NON_FEATURE_COLS if c in df.columns])
    X_cols = [c for c in feat_df.columns if c != TARGET]

    pipe = joblib.load(MODEL_PATH)
    prep = pipe.named_steps['prep']
    model = pipe.named_steps['model']
    encoded_feature_names = (
        list(prep.named_transformers_['cat'].get_feature_names_out(CATEGORICAL_COLS))
        + [c for c in X_cols if c not in CATEGORICAL_COLS]
    )
    explainer = shap.TreeExplainer(model)

    cache = {}

    # City-wide fallback first
    global_row = build_representative_row(df, X_cols, CATEGORICAL_COLS)
    price, factors = explain_row(global_row, prep, model, explainer, encoded_feature_names, BOOLEAN_COLS)
    cache['__global__'] = {'predicted_price': price, 'top_factors': factors, 'sample_size': len(df)}

    combo_counts = df.groupby(['LOCALITY_GROUPED', 'BHK']).size()
    combos = combo_counts[combo_counts >= MIN_GROUP_SIZE].index.tolist()
    print(f'Precomputing SHAP for {len(combos)} (locality, BHK) scenarios...')

    for locality, bhk in combos:
        sub = df[(df['LOCALITY_GROUPED'] == locality) & (df['BHK'] == bhk)]
        row = build_representative_row(sub, X_cols, CATEGORICAL_COLS)
        price, factors = explain_row(row, prep, model, explainer, encoded_feature_names, BOOLEAN_COLS)
        key = f'{locality}|{int(bhk)}'
        cache[key] = {'predicted_price': price, 'top_factors': factors, 'sample_size': len(sub)}

    with open(OUT_PATH, 'w') as f:
        json.dump(cache, f, indent=2)
    print(f'Saved {len(cache)} scenarios to {OUT_PATH}')


if __name__ == '__main__':
    main()