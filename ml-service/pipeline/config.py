"""
Configuration and constants for multi-city real estate data pipeline.
"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
DATA_DIR = BASE_DIR / "app" / "data"
MODEL_DIR = BASE_DIR / "app" / "models"

# Reference coordinates for distance calculation
CITY_CENTERS = {
    "gurgaon": (28.4595, 77.0266),      # MG Road / IFFCO Chowk
    "mumbai": (19.0760, 72.8777),       # Bandra Kurla Complex (BKC) / Central Mumbai
    "hyderabad": (17.3850, 78.4867),    # Central Hyderabad / Abids
    "kolkata": (22.5726, 88.3639),      # Park Street / Esplanade
    "bangalore": (12.9716, 77.5946),    # MG Road / Vidhana Soudha
}

# Physical bounds for domain-rule outlier removal
MAX_DISTANCE_KM = {
    "gurgaon": 60.0,
    "mumbai": 75.0,    # Mumbai extends to Thane, Navi Mumbai, Kalyan
    "hyderabad": 65.0,
    "kolkata": 60.0,
    "bangalore": 60.0,
}

# Raw file locations relative to BASE_DIR
RAW_FILES = {
    "gurgaon": RAW_DIR / "gurgoan" / "flats" / "flats_gurgoan.csv",
    "mumbai": RAW_DIR / "mumbai" / "flats" / "flats_mumbai.csv",
    "hyderabad": RAW_DIR / "hyderabad" / "flats" / "flats_hyderabad.csv",
    "kolkata": RAW_DIR / "kolkata" / "flats" / "flats_kolkata.csv",
    "bangalore": RAW_DIR / "bangalore" / "flats" / "flats_bangalore.csv",
}

# Standard final columns order (56 columns)
FINAL_COLUMNS = [
    'PROP_ID', 'PREFERENCE', 'DESCRIPTION', 'PROPERTY_TYPE', 'TRANSACT_TYPE_CODE',
    'OWNTYPE_CODE', 'BHK', 'BATHROOM_NUM', 'BALCONY_NUM', 'FURNISH',
    'FACING_CODE', 'AGE_CODE', 'FLOOR_NUM', 'TOTAL_FLOOR', 'REGISTER_DATE',
    'PROP_NAME', 'PRICE', 'PRICE_SQFT', 'CARPET_SQFT', 'SUPERBUILTUP_SQFT',
    'BROKERAGE', 'AREA_SQFT', 'EXPIRY_DATE', 'CLASS_LABEL', 'SOCIETY_NAME',
    'BUILDING_NAME', 'LOCALITY', 'LATITUDE', 'LONGITUDE', 'RERA_STATUS',
    'IS_READY_TO_MOVE', 'IS_RESALE', 'IS_RERA', 'IS_GATED_COMMUNITY',
    'IS_HUDA_APPROVED', 'FACING_TEXT', 'USP_COUNT', 'NEARBY_SHOPPING',
    'NEARBY_EDUCATION', 'NEARBY_HOSPITAL', 'NEARBY_METROSTATION',
    'NEARBY_RAILWAYSTATION', 'NEARBY_CONNECTIVITY', 'NEARBY_BANK',
    'NEARBY_PARK', 'TOTAL_NEARBY_LANDMARKS', 'AMENITIES_COUNT',
    'FEATURES_COUNT', 'LISTING_DURATION_DAYS', 'FLOOR_RATIO',
    'IS_GROUND_FLOOR', 'IS_TOP_FLOOR', 'PRICE_PER_SQFT_CALC',
    'DIST_FROM_CENTER_KM', 'LOCALITY_GROUPED', 'LUXURY_SCORE'
]

DISPLAY_COLUMNS = [
    'PROP_ID', 'PHOTO_URL', 'MEDIUM_PHOTO_URL', 'PROPERTY_IMAGES',
    'THUMBNAIL_IMAGES', 'DESCRIPTION', 'PROP_HEADING'
]

# Non-feature columns dropped before model training
NON_FEATURE_COLS = [
    'PROP_ID', 'DESCRIPTION', 'PREFERENCE', 'PROP_NAME', 'SOCIETY_NAME',
    'BUILDING_NAME', 'CLASS_LABEL', 'REGISTER_DATE', 'EXPIRY_DATE',
    'RERA_STATUS', 'LOCALITY', 'PRICE_PER_SQFT_CALC', 'PRICE_SQFT'
]

BOOLEAN_COLS = [
    'IS_READY_TO_MOVE', 'IS_RESALE', 'IS_RERA', 'IS_GATED_COMMUNITY',
    'IS_HUDA_APPROVED', 'IS_GROUND_FLOOR', 'IS_TOP_FLOOR'
]

CATEGORICAL_COLS = [
    'PROPERTY_TYPE', 'FURNISH', 'LOCALITY_GROUPED', 'FACING_CODE',
    'AGE_CODE', 'OWNTYPE_CODE', 'TRANSACT_TYPE_CODE', 'FACING_TEXT'
]

TARGET = 'PRICE'
