"""
Reusable string, JSON, regex, and domain parsers for raw listing attributes.
"""
import ast
import re
import numpy as np
import pandas as pd

FACING_RE = re.compile(
    r'(North East|North West|South East|South West|North|South|East|West)[- ]Facing',
    re.I
)

BATH_RE = re.compile(
    r'(\d+)\s*(?:baths?|bathrooms?|toilets?|attached\s+bath)',
    re.I
)


def safe_eval(val):
    """Safely evaluates Python dict/list literals stored as strings."""
    if pd.isna(val) or val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    try:
        return ast.literal_eval(str(val).strip())
    except Exception:
        return None


def parse_price_str(val):
    """Parses text price representations like '1.25 Cr', '65 L', '25,000' to integer rupees."""
    if pd.isna(val) or val is None:
        return np.nan
    s = str(val).strip().replace(',', '')
    if not s or s.lower() in ('price on request', 'call for price', 'nan'):
        return np.nan

    # Crore: "1.17 - 1.18 Cr", "2.2 Crore", "3 Cr Onwards"
    cr_match = re.search(r'([\d.]+)(?:\s*-\s*([\d.]+))?\s*(?:cr|crore)', s, re.I)
    if cr_match:
        low = float(cr_match.group(1))
        high = float(cr_match.group(2)) if cr_match.group(2) else low
        return float(round(((low + high) / 2.0) * 1e7))

    # Lakh / Lac: "19.1 L Onwards", "60 - 75 L", "45 Lac"
    l_match = re.search(r'([\d.]+)(?:\s*-\s*([\d.]+))?\s*(?:l|lac|lakh)', s, re.I)
    if l_match:
        low = float(l_match.group(1))
        high = float(l_match.group(2)) if l_match.group(2) else low
        return float(round(((low + high) / 2.0) * 1e5))

    # Thousand / K
    k_match = re.search(r'([\d.]+)\s*k', s, re.I)
    if k_match:
        return float(round(float(k_match.group(1)) * 1e3))

    # Direct digits
    num_match = re.search(r'^\d+(\.\d+)?$', s)
    if num_match:
        return float(round(float(num_match.group(0))))

    return np.nan


def parse_area_str(val):
    """Parses text area strings ('1200 sq.ft.', '500-600 sqft', '112 sq.m.') to float sqft."""
    if pd.isna(val) or val is None:
        return np.nan
    s = str(val).strip().replace(',', '')

    # Range or single in sqft
    range_match = re.search(r'([\d.]+)(?:\s*-\s*([\d.]+))?\s*(?:sq\.?\s*ft|sqft)', s, re.I)
    if range_match:
        low = float(range_match.group(1))
        high = float(range_match.group(2)) if range_match.group(2) else low
        return round((low + high) / 2.0, 2)

    # In sq.m. -> convert to sq.ft.
    sqm_match = re.search(r'([\d.]+)\s*(?:sq\.?\s*m|sqm)', s, re.I)
    if sqm_match:
        return round(float(sqm_match.group(1)) * 10.7639, 2)

    # Plain digits
    num_match = re.search(r'^\d+(\.\d+)?$', s)
    if num_match:
        return round(float(num_match.group(0)), 2)

    return np.nan


def parse_map_coords(map_details_val):
    """Extracts (latitude, longitude) floats from MAP_DETAILS dict/string."""
    parsed = safe_eval(map_details_val)
    if isinstance(parsed, dict):
        try:
            lat = float(parsed.get('LATITUDE', 0))
            lon = float(parsed.get('LONGITUDE', 0))
            if abs(lat) > 1.0 and abs(lon) > 1.0:
                return lat, lon
        except (ValueError, TypeError):
            pass
    return np.nan, np.nan


def parse_secondary_tags(tags_val):
    """Extracts boolean flags from SECONDARY_TAGS list."""
    parsed = safe_eval(tags_val)
    if not isinstance(parsed, (list, tuple)):
        return False, False, False, False, False

    def has_kw(kw):
        return any(kw in str(t).lower() for t in parsed)

    is_ready = has_kw('ready to move')
    is_resale = has_kw('resale')
    is_rera = has_kw('rera')
    is_gated = has_kw('gated')
    is_huda = has_kw('huda')
    return is_ready, is_resale, is_rera, is_gated, is_huda


def parse_top_usps(usps_val):
    """Extracts facing direction text and USP count from TOP_USPS."""
    parsed = safe_eval(usps_val)
    if not isinstance(parsed, (list, tuple)):
        return 'Unknown', 0

    facing_text = 'Unknown'
    for u in parsed:
        m = FACING_RE.search(str(u))
        if m:
            facing_text = m.group(1).title()
            break

    return facing_text, len(parsed)


def parse_landmark_counts(landmarks_val, total_count_val=None):
    """Extracts per-category counts and total landmark count."""
    parsed = safe_eval(landmarks_val)
    categories = {
        'SHOPPING': ['shopping', 'mall', 'market'],
        'EDUCATION': ['education', 'school', 'college', 'university'],
        'HOSPITAL': ['hospital', 'clinic', 'medical'],
        'METROSTATION': ['metro', 'metrostation'],
        'RAILWAYSTATION': ['railway', 'railwaystation', 'train'],
        'CONNECTIVITY': ['connectivity', 'highway', 'road', 'expressway'],
        'BANK': ['bank', 'atm'],
        'PARK': ['park', 'garden'],
    }

    counts = {f'NEARBY_{k}': 0 for k in categories}

    if isinstance(parsed, list):
        for item in parsed:
            if not isinstance(item, dict):
                continue
            cat_field = str(item.get('category', '')).lower()
            text_field = str(item.get('text', '')).lower()
            combined = f'{cat_field} {text_field}'

            # Extract digit count
            m = re.search(r'\d+', text_field)
            cnt = int(m.group()) if m else 1

            matched = False
            for target_cat, keywords in categories.items():
                if any(kw in combined for kw in keywords):
                    counts[f'NEARBY_{target_cat}'] += cnt
                    matched = True
                    break

    # Total landmarks
    if total_count_val is not None and not pd.isna(total_count_val):
        try:
            total = float(total_count_val)
        except (ValueError, TypeError):
            total = float(sum(counts.values()))
    else:
        total = float(sum(counts.values()))

    counts['TOTAL_NEARBY_LANDMARKS'] = total
    return counts


def count_csv_codes(val):
    """Counts comma-separated codes in amenities/features strings."""
    if pd.isna(val) or val is None:
        return 0
    s = str(val).strip()
    if not s or s.lower() == 'nan':
        return 0
    return len([x for x in s.split(',') if x.strip()])


def decode_furnish(val):
    """Maps 0/1/2/4 numeric furnish code to human-readable label."""
    if pd.isna(val):
        return 'Unknown'
    s = str(val).strip().lower()
    mapping = {
        '0': 'Unknown', '0.0': 'Unknown',
        '1': 'Furnished', '1.0': 'Furnished',
        '2': 'Unfurnished', '2.0': 'Unfurnished',
        '4': 'Semifurnished', '4.0': 'Semifurnished',
        'furnished': 'Furnished',
        'unfurnished': 'Unfurnished',
        'semifurnished': 'Semifurnished',
        'semi-furnished': 'Semifurnished',
    }
    return mapping.get(s, 'Unknown')


def extract_bathrooms(text, bhk_val):
    """Attempts regex match for bathrooms in text, falling back to bhk-based estimate."""
    if pd.notna(text):
        m = BATH_RE.search(str(text))
        if m:
            try:
                cnt = int(m.group(1))
                if 1 <= cnt <= 10:
                    return cnt
            except (ValueError, TypeError):
                pass
    if pd.notna(bhk_val) and bhk_val > 0:
        return int(min(max(round(bhk_val), 1), 10))
    return 2
