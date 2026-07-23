"""
Builds a per-locality "default profile" for every model feature the /predict
endpoint's user-facing form doesn't ask for (facing, age, RERA status, nearby
landmark counts, geography, etc).

Why: the trained model expects ~40 columns, but a real user filling out a
"what's my flat worth" form only knows a handful of them (property type,
locality, BHK, area, floor, furnishing). Everything else is filled in with the
median/mode for that locality (falling back to the city-wide median/mode if a
locality has too few listings), then a few fields are recomputed from the
user's actual inputs (FLOOR_RATIO, IS_GROUND_FLOOR, IS_TOP_FLOOR, LUXURY_SCORE).
"""

import numpy as np
import pandas as pd

# Every column the model was trained on, other than the target and the fields
# the /predict form collects directly.
DEFAULT_FIELDS = [
    'TRANSACT_TYPE_CODE', 'OWNTYPE_CODE', 'FACING_CODE', 'AGE_CODE',
    'CARPET_SQFT', 'SUPERBUILTUP_SQFT', 'BROKERAGE', 'LATITUDE', 'LONGITUDE',
    'IS_READY_TO_MOVE', 'IS_RESALE', 'IS_RERA', 'IS_HUDA_APPROVED',
    'FACING_TEXT', 'USP_COUNT', 'NEARBY_SHOPPING', 'NEARBY_EDUCATION',
    'NEARBY_HOSPITAL', 'NEARBY_METROSTATION', 'NEARBY_RAILWAYSTATION',
    'NEARBY_CONNECTIVITY', 'NEARBY_BANK', 'NEARBY_PARK',
    'TOTAL_NEARBY_LANDMARKS', 'AMENITIES_COUNT', 'FEATURES_COUNT',
    'LISTING_DURATION_DAYS', 'DIST_FROM_CENTER_KM',
]

NUMERIC_DEFAULT_FIELDS = [c for c in DEFAULT_FIELDS if c not in
                          ('TRANSACT_TYPE_CODE', 'OWNTYPE_CODE', 'FACING_CODE',
                           'AGE_CODE', 'IS_READY_TO_MOVE', 'IS_RESALE', 'IS_RERA',
                           'IS_HUDA_APPROVED', 'FACING_TEXT')]
CATEGORICAL_DEFAULT_FIELDS = [c for c in DEFAULT_FIELDS if c not in NUMERIC_DEFAULT_FIELDS]


def build_locality_defaults(df: pd.DataFrame) -> dict:
    """Returns {locality_name: {field: default_value}}, plus a '__global__' fallback."""
    profiles = {}

    def profile_for(sub: pd.DataFrame) -> dict:
        p = {}
        for c in NUMERIC_DEFAULT_FIELDS:
            p[c] = float(sub[c].median()) if c in sub.columns else 0.0
        for c in CATEGORICAL_DEFAULT_FIELDS:
            if c in sub.columns and not sub[c].empty:
                mode = sub[c].mode()
                p[c] = mode.iloc[0] if len(mode) else False
            else:
                p[c] = False
        return p

    profiles['__global__'] = profile_for(df)
    profiles['__global__']['_area_sqft_median'] = float(df['AREA_SQFT'].median())
    for locality, sub in df.groupby('LOCALITY_GROUPED'):
        # Too few listings to trust a locality-specific median -> fall back to global.
        profiles[locality] = profile_for(sub) if len(sub) >= 10 else profiles['__global__']

    return profiles


def build_feature_row(request_fields: dict, locality_defaults: dict) -> dict:
    """Combines user-provided fields with locality defaults, then recomputes the
    handful of features that depend on the user's actual inputs."""
    locality = request_fields['locality']
    defaults = locality_defaults.get(locality, locality_defaults['__global__'])

    row = dict(defaults)
    row['PROPERTY_TYPE'] = request_fields['property_type']
    row['LOCALITY_GROUPED'] = locality
    row['BHK'] = request_fields['bhk']
    row['BATHROOM_NUM'] = request_fields['bathroom_num']
    row['BALCONY_NUM'] = request_fields['balcony_num']
    row['AREA_SQFT'] = request_fields['area_sqft']
    row['FLOOR_NUM'] = request_fields['floor_num']
    row['TOTAL_FLOOR'] = request_fields['total_floor']
    row['FURNISH'] = request_fields['furnish']
    row['IS_GATED_COMMUNITY'] = request_fields['is_gated_community']

    # Recompute the fields that depend on what the user just entered, rather than
    # trusting a locality median for something we can derive directly.
    row['FLOOR_RATIO'] = (row['FLOOR_NUM'] / row['TOTAL_FLOOR']) if row['TOTAL_FLOOR'] else 0.0
    row['IS_GROUND_FLOOR'] = row['FLOOR_NUM'] == 0
    row['IS_TOP_FLOOR'] = row['FLOOR_NUM'] == row['TOTAL_FLOOR']
    # CARPET_SQFT / SUPERBUILTUP_SQFT ratios to AREA_SQFT tend to be fairly stable --
    # scale the locality-median ratio by the user's actual area instead of using a
    # flat median that ignores the size of the requested flat.
    global_area = locality_defaults['__global__'].get('_area_sqft_median', row['AREA_SQFT'])
    if global_area:
        ratio = row['AREA_SQFT'] / global_area
        row['CARPET_SQFT'] = row.get('CARPET_SQFT', row['AREA_SQFT']) * ratio
        row['SUPERBUILTUP_SQFT'] = row.get('SUPERBUILTUP_SQFT', row['AREA_SQFT']) * ratio

    furnish_score_map = {'Unfurnished': 0, 'Semifurnished': 1, 'Furnished': 2, 'Unknown': 0.5}
    row['LUXURY_SCORE'] = round(
        row['AMENITIES_COUNT'] * 0.5
        + row['FEATURES_COUNT'] * 0.3
        + furnish_score_map.get(row['FURNISH'], 0.5) * 3
        + int(row['IS_GATED_COMMUNITY']) * 2
        + row['TOTAL_NEARBY_LANDMARKS'] * 0.5,
        2,
    )
    return row