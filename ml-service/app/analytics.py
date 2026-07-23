"""
Precomputes everything the Insights page's charts need, once per city at
startup (same pattern as the SHAP cache) -- these are simple pandas
aggregations, cheap to run once, no reason to recompute per request.
"""

import re
from collections import Counter

import numpy as np
import pandas as pd

WORD_CLOUD_STOPWORDS = set("""
a an the is are was were be been being to of in on at for with and or but this that these those
it its it's as by from up down out over under again further then once here there when where why how
all any both each few more most other some such no nor not only own same so than too very s t can will
just don should now flat apartment property gurgaon sector bhk sq ft sqft floor floors tower society
located situated available comes area buy rent sale purchase project residential looking access easy
per month monthly one two three four five bathrooms balconies balcony bathroom built bedroom bedrooms
you your yourself get within has have had do does did having he she it we they them his her their
well many part total make close popular spread old years possession designed living immediate
builder building move ready house super units unit family families offering offers provides comes
additional details highlights include including includes offer preferred prominent situated developed
""".split())


def _box_stats(series: pd.Series) -> dict:
    s = series.dropna()
    if len(s) == 0:
        return None
    q1, median, q3 = s.quantile([0.25, 0.5, 0.75])
    iqr = q3 - q1
    lower_whisker = max(s.min(), q1 - 1.5 * iqr)
    upper_whisker = min(s.max(), q3 + 1.5 * iqr)
    return {
        'min': round(float(lower_whisker), 2),
        'q1': round(float(q1), 2),
        'median': round(float(median), 2),
        'q3': round(float(q3), 2),
        'max': round(float(upper_whisker), 2),
        'count': int(len(s)),
    }


def build_price_by_property_type(df: pd.DataFrame) -> list:
    """Box-plot data: price (in Cr) distribution per property type."""
    result = []
    for ptype, sub in df.groupby('PROPERTY_TYPE'):
        if len(sub) < 5:
            continue
        stats = _box_stats(sub['PRICE'] / 1e7)
        if stats:
            result.append({'category': ptype, **stats})
    return sorted(result, key=lambda r: -r['count'])


def build_price_vs_area_sample(df: pd.DataFrame, n: int = 600, seed: int = 42) -> list:
    """Scatter-plot data: a random sample (not the full ~7-8k rows) to keep the
    payload light -- a scatter plot doesn't need every point to show the shape
    of the relationship."""
    sample = df.sample(min(n, len(df)), random_state=seed)
    return [
        {'area_sqft': round(float(r.AREA_SQFT), 1), 'price_cr': round(float(r.PRICE) / 1e7, 3), 'bhk': int(r.BHK)}
        for r in sample.itertuples()
    ]


def build_geo_points(df: pd.DataFrame, n: int = 600, seed: int = 42) -> list:
    """Map data: lat/long + price for a sample of listings with valid coordinates."""
    valid = df.dropna(subset=['LATITUDE', 'LONGITUDE'])
    sample = valid.sample(min(n, len(valid)), random_state=seed)
    return [
        {'lat': round(float(r.LATITUDE), 5), 'lng': round(float(r.LONGITUDE), 5), 'price_cr': round(float(r.PRICE) / 1e7, 3)}
        for r in sample.itertuples()
    ]


def build_distribution(df: pd.DataFrame, column: str) -> list:
    """Pie-chart data: category counts for a given column."""
    counts = df[column].value_counts()
    return [{'name': name, 'value': int(count)} for name, count in counts.items()]


def build_word_cloud(df: pd.DataFrame, top_k: int = 35) -> list:
    """Word-cloud data: word frequency from listing DESCRIPTION text, filtered
    down to amenity/feature-relevant words. This is real text mined from the
    scraped listings, not a fabricated or hardcoded amenity list -- the source
    data has no decoded amenity names (AMENITIES is just numeric site codes
    with no public legend), so DESCRIPTION is the only place actual amenity
    words exist in this dataset."""
    text = ' '.join(df['DESCRIPTION'].dropna().str.lower())
    words = re.findall(r"[a-z]+(?:-[a-z]+)?", text)
    words = [w for w in words if w not in WORD_CLOUD_STOPWORDS and len(w) > 2]
    counts = Counter(words)
    return [{'text': w, 'count': c} for w, c in counts.most_common(top_k)]


def build_analytics(df: pd.DataFrame) -> dict:
    """df should already be filtered to PREFERENCE == 'Sale'."""
    return {
        'price_by_property_type': build_price_by_property_type(df),
        'price_vs_area_sample': build_price_vs_area_sample(df),
        'geo_points': build_geo_points(df),
        'property_type_distribution': build_distribution(df, 'PROPERTY_TYPE'),
        'furnish_distribution': build_distribution(df, 'FURNISH'),
        'word_cloud': build_word_cloud(df),
        'total_listings': int(len(df)),
    }