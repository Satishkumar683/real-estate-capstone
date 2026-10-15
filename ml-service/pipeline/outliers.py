"""
Three-pass outlier detection and removal:
Pass 1: Domain rules
Pass 2: Segment-level IQR
Pass 3: Segment-level Isolation Forest
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest


def iqr_bounds(s: pd.Series, k: float = 1.5):
    """Computes Tukey's IQR lower and upper fences."""
    q1 = s.quantile(0.25)
    q3 = s.quantile(0.75)
    iqr = q3 - q1
    return q1 - k * iqr, q3 + k * iqr


def remove_outliers(df: pd.DataFrame, max_dist_km: float = 65.0) -> pd.DataFrame:
    """Applies domain rules, segment-level IQR, and Isolation Forest filtering."""
    df_clean = df.copy()
    initial_len = len(df_clean)

    # --- Pass 1: Domain-rule filters
    df_clean = df_clean[
        df_clean['BHK'].between(1, 10)
        & df_clean['BATHROOM_NUM'].between(0, 10)
        & df_clean['AREA_SQFT'].between(100, 25000)
        & df_clean['PRICE_SQFT'].between(300, 200000)
        & (df_clean['DIST_FROM_CENTER_KM'] <= max_dist_km)
        & (df_clean['PRICE'] > 0)
    ]
    p1_len = len(df_clean)
    print(f"  [Outliers Pass 1 Domain] {initial_len} -> {p1_len} ({initial_len - p1_len} removed)")

    # --- Pass 2: Segment-level IQR
    mask_keep = pd.Series(True, index=df_clean.index)
    segments = df_clean['PREFERENCE'].unique()

    for pref in segments:
        sub = df_clean[df_clean['PREFERENCE'] == pref]
        if len(sub) < 30:
            continue
        for col in ['PRICE', 'AREA_SQFT']:
            lo, hi = iqr_bounds(sub[col], k=2.0)  # k=2.0 allows luxury penthouses while removing true corrupt data
            out = (df_clean['PREFERENCE'] == pref) & ((df_clean[col] < lo) | (df_clean[col] > hi))
            mask_keep &= ~out

    df_clean = df_clean[mask_keep]
    p2_len = len(df_clean)
    print(f"  [Outliers Pass 2 IQR] {p1_len} -> {p2_len} ({p1_len - p2_len} removed)")

    # --- Pass 3: Multivariate Isolation Forest per segment
    iso_features = ['PRICE', 'AREA_SQFT', 'BHK', 'BATHROOM_NUM', 'PRICE_SQFT']
    keep_indices = []

    for pref in segments:
        sub = df_clean[df_clean['PREFERENCE'] == pref]
        if len(sub) < 50:
            keep_indices.extend(sub.index)
            continue
        iso = IsolationForest(contamination=0.015, random_state=42)
        preds = iso.fit_predict(sub[iso_features])
        keep_indices.extend(sub.index[preds == 1])

    df_clean = df_clean.loc[sorted(keep_indices)]
    p3_len = len(df_clean)
    print(f"  [Outliers Pass 3 IsoForest] {p2_len} -> {p3_len} ({p2_len - p3_len} removed)")

    return df_clean
