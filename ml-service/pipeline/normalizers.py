"""
City-specific raw schema normalizers.
Produces an intermediate dataframe with standardized column names and types.
"""
import json
import re
import numpy as np
import pandas as pd

from pipeline.parsers import (
    safe_eval, parse_price_str, parse_area_str, parse_map_coords,
    parse_secondary_tags, parse_top_usps, parse_landmark_counts,
    count_csv_codes, decode_furnish, extract_bathrooms
)


def safe_str(df: pd.DataFrame, col: str, default: str = '') -> pd.Series:
    """Safely extracts a column as string series with fallback."""
    if col in df.columns:
        return df[col].fillna(default).astype(str)
    return pd.Series([default] * len(df), index=df.index, dtype=str)


def safe_num(df: pd.DataFrame, col: str, default: float = 0.0) -> pd.Series:
    """Safely extracts a column as numeric float series with fallback."""
    if col in df.columns:
        return pd.to_numeric(df[col], errors='coerce').fillna(default)
    return pd.Series([default] * len(df), index=df.index, dtype=float)


def extract_locality_from_location(val):
    """Pulls locality name out of 99acres location dict."""
    parsed = safe_eval(val)
    if isinstance(parsed, dict):
        loc = parsed.get('LOCALITY_NAME')
        if loc and str(loc).strip():
            return str(loc).strip()
        subloc = parsed.get('SUBLOCALITY_NAME')
        if subloc and str(subloc).strip():
            return str(subloc).strip()
        city = parsed.get('CITY_NAME')
        if city and str(city).strip():
            return str(city).strip()
    return 'Unknown'


def normalize_99acres(raw_df: pd.DataFrame, city_name: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Normalizes 99acres API schema (used by Gurgaon, Mumbai, Hyderabad).
    Returns (cleaned_features_df, display_df)."""
    df = pd.DataFrame(index=raw_df.index)

    # 1. Primary key
    if 'PROP_ID' in raw_df.columns:
        df['PROP_ID'] = raw_df['PROP_ID'].astype(str)
    else:
        df['PROP_ID'] = [f"{city_name[:3].upper()}_{i}" for i in range(len(raw_df))]

    # 2. Preference
    pref_map = {'S': 'Sale', 'R': 'Rent', 'P': 'PG', 'Sale': 'Sale', 'Rent': 'Rent'}
    pref_col = raw_df.get('PREFERENCE')
    if pref_col is not None:
        df['PREFERENCE'] = pref_col.map(pref_map).fillna('Sale')
    else:
        df['PREFERENCE'] = 'Sale'

    # 3. Descriptive texts
    df['DESCRIPTION'] = safe_str(raw_df, 'DESCRIPTION', '')
    df['PROP_HEADING'] = safe_str(raw_df, 'PROP_HEADING', '')
    df['PROP_NAME'] = safe_str(raw_df, 'PROP_NAME', 'Unknown')
    df['SOCIETY_NAME'] = safe_str(raw_df, 'SOCIETY_NAME', 'Unknown')
    df['BUILDING_NAME'] = safe_str(raw_df, 'BUILDING_NAME', 'Unknown')
    df['CLASS_LABEL'] = safe_str(raw_df, 'CLASS_LABEL', 'Standard')
    df['RERA_STATUS'] = safe_str(raw_df, 'RERA_STATUS', 'Not Specified')

    # 4. Property type
    ptype_raw = safe_str(raw_df, 'PROPERTY_TYPE', 'Residential Apartment')
    def clean_ptype(p):
        p_low = p.lower()
        if 'builder floor' in p_low:
            return 'Independent/Builder Floor'
        if 'villa' in p_low or 'house' in p_low:
            return 'Independent House/Villa'
        if 'plot' in p_low or 'land' in p_low:
            return 'Residential Land'
        if 'studio' in p_low:
            return 'Studio Apartment'
        if 'serviced' in p_low:
            return 'Serviced Apartments'
        return 'Residential Apartment'
    df['PROPERTY_TYPE'] = ptype_raw.apply(clean_ptype)

    # 5. Price & Area
    if 'MIN_PRICE' in raw_df.columns:
        df['PRICE'] = pd.to_numeric(raw_df['MIN_PRICE'], errors='coerce')
        mask_bad = df['PRICE'].isna() | (df['PRICE'] <= 0)
        if mask_bad.any() and 'PRICE' in raw_df.columns:
            df.loc[mask_bad, 'PRICE'] = raw_df.loc[mask_bad, 'PRICE'].apply(parse_price_str)
    elif 'PRICE' in raw_df.columns:
        df['PRICE'] = raw_df['PRICE'].apply(parse_price_str)
    else:
        df['PRICE'] = np.nan

    # Area: In 99acres API, MIN_AREA_SQFT is in square meters -> multiply by 10.7639
    if 'MIN_AREA_SQFT' in raw_df.columns:
        df['AREA_SQFT'] = pd.to_numeric(raw_df['MIN_AREA_SQFT'], errors='coerce') * 10.7639
        mask_bad_area = df['AREA_SQFT'].isna() | (df['AREA_SQFT'] <= 0)
        if mask_bad_area.any() and 'AREA' in raw_df.columns:
            df.loc[mask_bad_area, 'AREA_SQFT'] = raw_df.loc[mask_bad_area, 'AREA'].apply(parse_area_str)
    elif 'AREA' in raw_df.columns:
        df['AREA_SQFT'] = raw_df['AREA'].apply(parse_area_str)
    else:
        df['AREA_SQFT'] = np.nan

    # 6. Rooms & Floors
    df['BHK'] = pd.to_numeric(raw_df.get('BEDROOM_NUM', raw_df.get('BHK')), errors='coerce')

    if 'BATHROOM_NUM' in raw_df.columns:
        df['BATHROOM_NUM'] = pd.to_numeric(raw_df['BATHROOM_NUM'], errors='coerce')
        mask_na_bath = df['BATHROOM_NUM'].isna()
        if mask_na_bath.any():
            df.loc[mask_na_bath, 'BATHROOM_NUM'] = [
                extract_bathrooms(desc, bhk)
                for desc, bhk in zip(df.loc[mask_na_bath, 'DESCRIPTION'], df.loc[mask_na_bath, 'BHK'])
            ]
    else:
        df['BATHROOM_NUM'] = [
            extract_bathrooms(desc, bhk)
            for desc, bhk in zip(df['DESCRIPTION'], df['BHK'])
        ]

    df['BALCONY_NUM'] = pd.to_numeric(raw_df.get('BALCONY_NUM'), errors='coerce')

    floor_raw = safe_str(raw_df, 'FLOOR_NUM', '0').str.strip().str.upper()
    df['FLOOR_NUM'] = pd.to_numeric(floor_raw.replace({'G': '0', 'GROUND': '0'}), errors='coerce')
    df['TOTAL_FLOOR'] = pd.to_numeric(raw_df.get('TOTAL_FLOOR'), errors='coerce')

    # 7. Furnishing
    df['FURNISH'] = raw_df.get('FURNISH', pd.Series(0, index=raw_df.index)).apply(decode_furnish)

    # 8. Site codes
    for c in ['TRANSACT_TYPE', 'OWNTYPE', 'FACING', 'AGE']:
        df[f'{c}_CODE'] = safe_num(raw_df, c, 0.0).astype(int)

    # 9. Geography & Locality
    if 'MAP_DETAILS' in raw_df.columns:
        coords = raw_df['MAP_DETAILS'].apply(parse_map_coords)
        df['LATITUDE'] = [c[0] for c in coords]
        df['LONGITUDE'] = [c[1] for c in coords]
    else:
        df['LATITUDE'] = safe_num(raw_df, 'LATITUDE', np.nan)
        df['LONGITUDE'] = safe_num(raw_df, 'LONGITUDE', np.nan)

    if 'location' in raw_df.columns:
        df['LOCALITY'] = raw_df['location'].apply(extract_locality_from_location)
    elif 'LOCALITY_WO_CITY' in raw_df.columns:
        df['LOCALITY'] = raw_df['LOCALITY_WO_CITY'].fillna(raw_df.get('LOCALITY', 'Unknown'))
    else:
        df['LOCALITY'] = safe_str(raw_df, 'LOCALITY', 'Unknown')
    df['LOCALITY'] = df['LOCALITY'].replace({'': 'Unknown'}).fillna('Unknown').astype(str).str.strip()

    # 10. Tags & USPs
    if 'SECONDARY_TAGS' in raw_df.columns:
        tags = raw_df['SECONDARY_TAGS'].apply(parse_secondary_tags)
        df['IS_READY_TO_MOVE'] = [t[0] for t in tags]
        df['IS_RESALE'] = [t[1] for t in tags]
        df['IS_RERA'] = [t[2] for t in tags]
        df['IS_GATED_COMMUNITY'] = [t[3] for t in tags]
        df['IS_HUDA_APPROVED'] = [t[4] for t in tags]
    else:
        for f in ['IS_READY_TO_MOVE', 'IS_RESALE', 'IS_RERA', 'IS_GATED_COMMUNITY', 'IS_HUDA_APPROVED']:
            df[f] = False

    if 'TOP_USPS' in raw_df.columns:
        usps = raw_df['TOP_USPS'].apply(parse_top_usps)
        df['FACING_TEXT'] = [u[0] for u in usps]
        df['USP_COUNT'] = [u[1] for u in usps]
    else:
        df['FACING_TEXT'] = 'Unknown'
        df['USP_COUNT'] = 0

    # 11. Landmarks
    if 'FORMATTED_LANDMARK_DETAILS' in raw_df.columns:
        total_col = raw_df.get('TOTAL_LANDMARK_COUNT')
        landmark_data = [
            parse_landmark_counts(lm, tot)
            for lm, tot in zip(raw_df['FORMATTED_LANDMARK_DETAILS'], total_col if total_col is not None else [None]*len(raw_df))
        ]
        landmark_df = pd.DataFrame(landmark_data, index=df.index)
        for c in landmark_df.columns:
            df[c] = landmark_df[c]
    else:
        for cat in ['SHOPPING', 'EDUCATION', 'HOSPITAL', 'METROSTATION', 'RAILWAYSTATION', 'CONNECTIVITY', 'BANK', 'PARK']:
            df[f'NEARBY_{cat}'] = 0
        df['TOTAL_NEARBY_LANDMARKS'] = 0.0

    # 12. Amenities & Features counts
    df['AMENITIES_COUNT'] = raw_df.get('AMENITIES', pd.Series('', index=raw_df.index)).apply(count_csv_codes)
    df['FEATURES_COUNT'] = raw_df.get('FEATURES', pd.Series('', index=raw_df.index)).apply(count_csv_codes)

    # 13. Area details
    df['CARPET_SQFT'] = pd.to_numeric(raw_df.get('CARPET_SQFT'), errors='coerce')
    df['SUPERBUILTUP_SQFT'] = pd.to_numeric(raw_df.get('SUPERBUILTUP_SQFT'), errors='coerce')
    df['BROKERAGE'] = safe_num(raw_df, 'BROKERAGE', 1.0)
    df['PRICE_SQFT'] = pd.to_numeric(raw_df.get('PRICE_SQFT'), errors='coerce')

    # 14. Dates & Listing duration
    if 'REGISTERED_DAYS' in raw_df.columns:
        df['LISTING_DURATION_DAYS'] = safe_num(raw_df, 'REGISTERED_DAYS', 60.0)
    else:
        df['LISTING_DURATION_DAYS'] = 60.0
    df['REGISTER_DATE'] = safe_str(raw_df, 'REGISTER_DATE', '2026-01-01')
    df['EXPIRY_DATE'] = safe_str(raw_df, 'EXPIRY_DATE', '2026-12-31')

    # Build Display Dataframe
    display_df = pd.DataFrame(index=df.index)
    display_df['PROP_ID'] = df['PROP_ID']
    display_df['PHOTO_URL'] = safe_str(raw_df, 'PHOTO_URL', '')
    display_df['MEDIUM_PHOTO_URL'] = safe_str(raw_df, 'MEDIUM_PHOTO_URL', '')
    display_df['PROPERTY_IMAGES'] = safe_str(raw_df, 'PROPERTY_IMAGES', '[]')
    display_df['THUMBNAIL_IMAGES'] = safe_str(raw_df, 'THUMBNAIL_IMAGES', '[]')
    display_df['DESCRIPTION'] = df['DESCRIPTION']
    display_df['PROP_HEADING'] = df['PROP_HEADING']

    return df, display_df


def normalize_kolkata(raw_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Normalizes Kolkata's 35-column dataset variant."""
    df, display_df = normalize_99acres(raw_df, 'kolkata')

    # Kolkata raw PRICE is a string like "19.1 L Onwards"
    if 'PRICE' in raw_df.columns:
        df['PRICE'] = raw_df['PRICE'].apply(parse_price_str)

    # Kolkata raw AREA is a string like "518-623 sq.ft."
    if 'AREA' in raw_df.columns:
        df['AREA_SQFT'] = raw_df['AREA'].apply(parse_area_str)

    # If PRICE is missing but PRICE_SQFT and AREA_SQFT are valid, calculate PRICE
    mask_calc_price = df['PRICE'].isna() & df['PRICE_SQFT'].notna() & df['AREA_SQFT'].notna()
    if mask_calc_price.any():
        df.loc[mask_calc_price, 'PRICE'] = (
            df.loc[mask_calc_price, 'PRICE_SQFT'] * df.loc[mask_calc_price, 'AREA_SQFT']
        ).round()

    return df, display_df


def normalize_bangalore(raw_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Normalizes Bangalore's camelCase scraper dataset (38 columns)."""
    df = pd.DataFrame(index=raw_df.index)

    # 1. Primary key
    if 'property_id' in raw_df.columns:
        df['PROP_ID'] = raw_df['property_id'].astype(str)
    else:
        df['PROP_ID'] = [f"BLR_{i}" for i in range(len(raw_df))]
    df['PREFERENCE'] = 'Sale'

    # 2. Descriptive texts
    df['DESCRIPTION'] = safe_str(raw_df, 'description', '')
    df['PROP_HEADING'] = safe_str(raw_df, 'property_name', '')
    df['PROP_NAME'] = safe_str(raw_df, 'property_name', 'Unknown')
    soc = safe_str(raw_df, 'societyName', '')
    if (soc == '').all() and 'society' in raw_df.columns:
        soc = safe_str(raw_df, 'society', 'Unknown')
    df['SOCIETY_NAME'] = soc.replace({'': 'Unknown'})
    df['BUILDING_NAME'] = df['SOCIETY_NAME']
    df['CLASS_LABEL'] = 'Standard'
    df['RERA_STATUS'] = safe_str(raw_df, 'reraStatus', 'Not Specified')

    # Property type derived from property_name
    def infer_ptype(name):
        n_low = str(name).lower()
        if 'villa' in n_low or 'house' in n_low:
            return 'Independent House/Villa'
        if 'floor' in n_low:
            return 'Independent/Builder Floor'
        if 'plot' in n_low or 'land' in n_low:
            return 'Residential Land'
        return 'Residential Apartment'
    df['PROPERTY_TYPE'] = df['PROP_HEADING'].apply(infer_ptype)

    # 3. Price & Area
    if 'price' in raw_df.columns:
        df['PRICE'] = raw_df['price'].apply(parse_price_str)
    else:
        df['PRICE'] = np.nan

    # Area from areaSqm (in sq.m.) -> convert to sq.ft.
    area_sqm = pd.to_numeric(raw_df.get('areaSqm'), errors='coerce')
    df['AREA_SQFT'] = (area_sqm * 10.7639).round(2)
    mask_bad_area = df['AREA_SQFT'].isna() | (df['AREA_SQFT'] <= 0)
    if mask_bad_area.any() and 'areaWithType' in raw_df.columns:
        df.loc[mask_bad_area, 'AREA_SQFT'] = raw_df.loc[mask_bad_area, 'areaWithType'].apply(parse_area_str)

    # 4. Rooms & Floors
    df['BHK'] = pd.to_numeric(raw_df.get('bedRoom'), errors='coerce')
    bath_fallbacks = pd.Series(
        [extract_bathrooms(d, b) for d, b in zip(df['DESCRIPTION'], df['BHK'])],
        index=df.index
    )
    df['BATHROOM_NUM'] = pd.to_numeric(raw_df.get('bathroom'), errors='coerce').fillna(bath_fallbacks)

    balc_series = safe_str(raw_df, 'balcony', '0')
    df['BALCONY_NUM'] = pd.to_numeric(balc_series.str.extract(r'(\d+)')[0], errors='coerce').fillna(1.0)
    df['FLOOR_NUM'] = pd.to_numeric(raw_df.get('floorNum'), errors='coerce').fillna(1.0)
    df['TOTAL_FLOOR'] = (df['FLOOR_NUM'] + 3.0).clip(lower=4.0)

    # 5. Furnishing
    df['FURNISH'] = raw_df.get('furnishDetails', pd.Series('Unknown', index=raw_df.index)).apply(decode_furnish)

    # 6. Codes
    df['TRANSACT_TYPE_CODE'] = 1
    df['OWNTYPE_CODE'] = 1
    df['FACING_CODE'] = 0
    df['AGE_CODE'] = 0

    # 7. Geography & Locality
    df['LATITUDE'] = pd.to_numeric(raw_df.get('latitude'), errors='coerce')
    df['LONGITUDE'] = pd.to_numeric(raw_df.get('longitude'), errors='coerce')

    loc_series = safe_str(raw_df, 'address', 'Unknown')
    df['LOCALITY'] = loc_series.str.replace(r',?\s*Bangalore$', '', case=False, regex=True).str.strip()
    df['LOCALITY'] = df['LOCALITY'].replace({'': 'Unknown'}).fillna('Unknown')

    # 8. Tags & USPs
    df['IS_READY_TO_MOVE'] = df['DESCRIPTION'].str.contains('ready to move', case=False, na=False)
    df['IS_RESALE'] = df['DESCRIPTION'].str.contains('resale', case=False, na=False)
    df['IS_RERA'] = df['RERA_STATUS'].astype(str).str.contains('approve|register', case=False, na=False)
    df['IS_GATED_COMMUNITY'] = df['DESCRIPTION'].str.contains('gated', case=False, na=False)
    df['IS_HUDA_APPROVED'] = False

    df['FACING_TEXT'] = safe_str(raw_df, 'facing', 'Unknown')
    df['USP_COUNT'] = 0

    # 9. Landmarks
    for cat in ['SHOPPING', 'EDUCATION', 'HOSPITAL', 'METROSTATION', 'RAILWAYSTATION', 'CONNECTIVITY', 'BANK', 'PARK']:
        df[f'NEARBY_{cat}'] = 0
    df['TOTAL_NEARBY_LANDMARKS'] = 0.0

    # 10. Amenities & Features counts
    df['AMENITIES_COUNT'] = raw_df.get('features', pd.Series('', index=raw_df.index)).apply(count_csv_codes)
    df['FEATURES_COUNT'] = 0

    # 11. Area details
    df['CARPET_SQFT'] = df['AREA_SQFT'] * 0.82
    df['SUPERBUILTUP_SQFT'] = df['AREA_SQFT']
    df['BROKERAGE'] = 0.0
    df['PRICE_SQFT'] = (df['PRICE'] / df['AREA_SQFT'].replace(0, np.nan)).round(2)

    # 12. Dates
    df['LISTING_DURATION_DAYS'] = 60.0
    df['REGISTER_DATE'] = '2026-01-01'
    df['EXPIRY_DATE'] = '2026-12-31'

    # Display DF
    display_df = pd.DataFrame(index=df.index)
    display_df['PROP_ID'] = df['PROP_ID']
    main_img = safe_str(raw_df, 'mainImage', '')
    display_df['PHOTO_URL'] = main_img
    display_df['MEDIUM_PHOTO_URL'] = main_img
    display_df['PROPERTY_IMAGES'] = [
        json.dumps([url]) if url and url.startswith('http') else '[]' for url in main_img
    ]
    display_df['THUMBNAIL_IMAGES'] = display_df['PROPERTY_IMAGES']
    display_df['DESCRIPTION'] = df['DESCRIPTION']
    display_df['PROP_HEADING'] = df['PROP_HEADING']

    return df, display_df
