"""
Missing value imputation pipeline replicating Section 7 of gurgaon_pipeline.ipynb.
"""
import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer, SimpleImputer

from pipeline.features import haversine_km, add_luxury_score


def impute_missing_values(df: pd.DataFrame, city_center: tuple) -> pd.DataFrame:
    """Imputes missing values across numeric, categorical, and geospatial features."""
    df = df.copy()

    # 1. Group-median imputation for area columns by (LOCALITY_GROUPED, BHK)
    area_cols = ['AREA_SQFT', 'CARPET_SQFT', 'SUPERBUILTUP_SQFT']
    for col in area_cols:
        if col in df.columns:
            # First by (LOCALITY_GROUPED, BHK)
            df[col] = df.groupby(['LOCALITY_GROUPED', 'BHK'])[col].transform(
                lambda s: s.fillna(s.median()) if s.notna().any() else s
            )
            # Fallback to BHK median
            df[col] = df.groupby('BHK')[col].transform(
                lambda s: s.fillna(s.median()) if s.notna().any() else s
            )
            # Fallback to global column median
            df[col] = df[col].fillna(df[col].median() if df[col].notna().any() else 1000.0)

    # 2. Group-median imputation for room counts by PROPERTY_TYPE
    room_cols = ['BHK', 'BATHROOM_NUM', 'BALCONY_NUM']
    for col in room_cols:
        if col in df.columns:
            df[col] = df.groupby('PROPERTY_TYPE')[col].transform(
                lambda s: s.fillna(s.median()) if s.notna().any() else s
            )
            df[col] = df[col].fillna(df[col].median() if df[col].notna().any() else 2.0)

    # 3. Simple median imputation for floors, brokerage, duration
    simple_median_cols = ['FLOOR_NUM', 'TOTAL_FLOOR', 'BROKERAGE', 'LISTING_DURATION_DAYS']
    existing_simple = [c for c in simple_median_cols if c in df.columns]
    if existing_simple:
        imp = SimpleImputer(strategy='median')
        df[existing_simple] = imp.fit_transform(df[existing_simple])

    # 4. KNN Imputation for Geography (LATITUDE, LONGITUDE)
    # Mask broken coordinates first
    bad_coords = (df['LATITUDE'].isna()) | (df['LONGITUDE'].isna()) | (df['LATITUDE'].abs() < 1.0) | (df['LONGITUDE'].abs() < 1.0)
    df.loc[bad_coords, ['LATITUDE', 'LONGITUDE']] = np.nan

    geo_features = ['LATITUDE', 'LONGITUDE', 'AREA_SQFT', 'BHK']
    if 'PRICE_SQFT' in df.columns and df['PRICE_SQFT'].notna().sum() > 10:
        geo_features.append('PRICE_SQFT')

    # If any coordinates are missing and we have enough valid ones, use KNN
    if df['LATITUDE'].isna().any() and df['LATITUDE'].notna().sum() >= 5:
        knn_imp = KNNImputer(n_neighbors=min(5, df['LATITUDE'].notna().sum()))
        df[geo_features] = knn_imp.fit_transform(df[geo_features])
    else:
        # Fall back to city center coordinates if no coordinates available
        df['LATITUDE'] = df['LATITUDE'].fillna(city_center[0])
        df['LONGITUDE'] = df['LONGITUDE'].fillna(city_center[1])

    # 5. Recompute derived geospatial and floor features with complete data
    df['DIST_FROM_CENTER_KM'] = haversine_km(df['LATITUDE'], df['LONGITUDE'], *city_center)

    floor_num = pd.to_numeric(df['FLOOR_NUM'], errors='coerce').fillna(0)
    total_floor = pd.to_numeric(df['TOTAL_FLOOR'], errors='coerce').replace(0, np.nan)
    df['FLOOR_RATIO'] = (floor_num / total_floor).clip(0.0, 1.5).fillna(0.5)
    df['IS_GROUND_FLOOR'] = (floor_num == 0)
    df['IS_TOP_FLOOR'] = (floor_num == total_floor) & (total_floor > 0)

    # 6. Categorical fills
    df['SOCIETY_NAME'] = df['SOCIETY_NAME'].fillna('Unknown')
    df['BUILDING_NAME'] = df['BUILDING_NAME'].fillna('Unknown')
    df['PROP_NAME'] = df['PROP_NAME'].fillna('Unknown')
    df['FACING_TEXT'] = df['FACING_TEXT'].fillna('Unknown')
    df['RERA_STATUS'] = df['RERA_STATUS'].fillna('Not Specified')
    df['CLASS_LABEL'] = df['CLASS_LABEL'].fillna('Standard')

    for code_col in ['TRANSACT_TYPE_CODE', 'OWNTYPE_CODE', 'FACING_CODE', 'AGE_CODE']:
        if code_col in df.columns:
            df[code_col] = pd.to_numeric(df[code_col], errors='coerce').fillna(0).astype(int)

    for bool_col in ['IS_READY_TO_MOVE', 'IS_RESALE', 'IS_RERA', 'IS_GATED_COMMUNITY', 'IS_HUDA_APPROVED']:
        if bool_col in df.columns:
            df[bool_col] = df[bool_col].fillna(False).astype(bool)

    # Refresh luxury score
    df = add_luxury_score(df)

    # Final check: ensure no NaNs in PRICE or AREA_SQFT
    if df['PRICE'].isna().any() and df['PRICE_SQFT'].notna().any():
        df['PRICE'] = df['PRICE'].fillna(df['PRICE_SQFT'] * df['AREA_SQFT'])

    return df
