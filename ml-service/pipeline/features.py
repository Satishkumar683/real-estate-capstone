"""
Feature engineering functions for real estate listings.
"""
import numpy as np
import pandas as pd


def haversine_km(lat1, lon1, lat2, lon2):
    """Computes great-circle distance in kilometers between two coordinates."""
    lat1, lon1 = np.asarray(lat1, dtype=float), np.asarray(lon1, dtype=float)
    p1, p2 = np.radians(lat1), np.radians(lat2)
    dphi = np.radians(lat2 - lat1)
    dlmb = np.radians(lon2 - lon1)
    a = np.sin(dphi / 2.0) ** 2 + np.cos(p1) * np.cos(p2) * np.sin(dlmb / 2.0) ** 2
    return 2.0 * 6371.0 * np.arcsin(np.sqrt(np.clip(a, 0.0, 1.0)))


def add_floor_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes FLOOR_RATIO, IS_GROUND_FLOOR, and IS_TOP_FLOOR."""
    df = df.copy()
    floor_num = pd.to_numeric(df['FLOOR_NUM'], errors='coerce')
    total_floor = pd.to_numeric(df['TOTAL_FLOOR'], errors='coerce').replace(0, np.nan)

    ratio = floor_num / total_floor
    df['FLOOR_RATIO'] = ratio.clip(0.0, 1.5).fillna(0.5)
    df['IS_GROUND_FLOOR'] = (floor_num == 0)
    df['IS_TOP_FLOOR'] = (floor_num == total_floor) & (total_floor > 0)
    return df


def add_distance_feature(df: pd.DataFrame, center_coords: tuple) -> pd.DataFrame:
    """Computes DIST_FROM_CENTER_KM using haversine formula."""
    df = df.copy()
    lat = pd.to_numeric(df['LATITUDE'], errors='coerce')
    lon = pd.to_numeric(df['LONGITUDE'], errors='coerce')

    # Mask invalid coordinates
    bad_coords = (lat.isna()) | (lon.isna()) | (lat.abs() < 1.0) | (lon.abs() < 1.0)
    df.loc[bad_coords, ['LATITUDE', 'LONGITUDE']] = np.nan

    df['DIST_FROM_CENTER_KM'] = haversine_km(df['LATITUDE'], df['LONGITUDE'], *center_coords)
    return df


def add_locality_grouped(df: pd.DataFrame, top_n: int = 30) -> pd.DataFrame:
    """Retains top_n localities by listing count, mapping remainder to 'Other'."""
    df = df.copy()
    loc = df['LOCALITY'].fillna('Unknown').astype(str).str.strip()
    top_locs = loc.value_counts().nlargest(top_n).index
    df['LOCALITY_GROUPED'] = loc.where(loc.isin(top_locs), 'Other')
    return df


def add_luxury_score(df: pd.DataFrame) -> pd.DataFrame:
    """Computes composite LUXURY_SCORE from amenities, features, furnish, gates, landmarks."""
    df = df.copy()
    furnish_map = {'Unfurnished': 0.0, 'Semifurnished': 1.0, 'Furnished': 2.0, 'Unknown': 0.5}
    furnish_score = df['FURNISH'].map(furnish_map).fillna(0.5)

    amenities = pd.to_numeric(df['AMENITIES_COUNT'], errors='coerce').fillna(0)
    features = pd.to_numeric(df['FEATURES_COUNT'], errors='coerce').fillna(0)
    gated = df['IS_GATED_COMMUNITY'].fillna(False).astype(int)
    landmarks = pd.to_numeric(df['TOTAL_NEARBY_LANDMARKS'], errors='coerce').fillna(0)

    score = (
        0.5 * amenities
        + 0.3 * features
        + 3.0 * furnish_score
        + 2.0 * gated
        + 0.5 * landmarks
    )
    df['LUXURY_SCORE'] = score.round(2)
    return df


def add_price_sqft_calc(df: pd.DataFrame) -> pd.DataFrame:
    """Computes PRICE_PER_SQFT_CALC = PRICE / AREA_SQFT."""
    df = df.copy()
    price = pd.to_numeric(df['PRICE'], errors='coerce')
    area = pd.to_numeric(df['AREA_SQFT'], errors='coerce')
    calc = price / area.replace(0, np.nan)
    df['PRICE_PER_SQFT_CALC'] = calc.round(2)

    # If PRICE_SQFT was missing or 0, use PRICE_PER_SQFT_CALC
    if 'PRICE_SQFT' not in df.columns or df['PRICE_SQFT'].isna().all():
        df['PRICE_SQFT'] = df['PRICE_PER_SQFT_CALC']
    else:
        df['PRICE_SQFT'] = pd.to_numeric(df['PRICE_SQFT'], errors='coerce').fillna(df['PRICE_PER_SQFT_CALC'])
    return df
