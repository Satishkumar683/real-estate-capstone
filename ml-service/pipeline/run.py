"""
Master runner for multi-city real estate processing and ML training.

Usage:
    python -m pipeline.run --city mumbai
    python -m pipeline.run --city hyderabad
    python -m pipeline.run --city kolkata
    python -m pipeline.run --city bangalore
    python -m pipeline.run --city all
"""
import argparse
import sys
from pathlib import Path
import pandas as pd

# Ensure ml-service root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from pipeline.config import (
    CITY_CENTERS, DATA_DIR, DISPLAY_COLUMNS, FINAL_COLUMNS,
    MAX_DISTANCE_KM, MODEL_DIR, RAW_FILES
)
from pipeline.normalizers import (
    normalize_99acres, normalize_bangalore, normalize_kolkata
)
from pipeline.features import (
    add_distance_feature, add_floor_features,
    add_locality_grouped, add_luxury_score, add_price_sqft_calc
)
from pipeline.imputation import impute_missing_values
from pipeline.outliers import remove_outliers
from pipeline.model import train_price_model
from pipeline.shap_cache import generate_shap_cache


def process_city(city: str):
    city = city.lower().strip()
    if city not in RAW_FILES:
        raise ValueError(f"Unknown city '{city}'. Configured: {list(RAW_FILES.keys())}")

    raw_path = RAW_FILES[city]
    if not raw_path.exists():
        raise FileNotFoundError(f"Raw data file not found at: {raw_path}")

    print(f"\n{'='*30} PROCESSING CITY: {city.upper()} {'='*30}")
    print(f"Loading raw data from: {raw_path}")
    raw_df = pd.read_csv(raw_path, low_memory=False)
    print(f"Raw shape: {raw_df.shape}")

    # 1. Normalize schema
    print(f"Normalizing schema for {city}...")
    if city == 'bangalore':
        norm_df, display_df = normalize_bangalore(raw_df)
    elif city == 'kolkata':
        norm_df, display_df = normalize_kolkata(raw_df)
    else:
        norm_df, display_df = normalize_99acres(raw_df, city)

    print(f"Normalized listings: {len(norm_df)}")

    # 2. Add features
    print("Engineering features (geography, floors, luxury score, locality grouping)...")
    center = CITY_CENTERS[city]
    df_feat = add_distance_feature(norm_df, center)
    df_feat = add_floor_features(df_feat)
    df_feat = add_locality_grouped(df_feat, top_n=30)
    df_feat = add_luxury_score(df_feat)
    df_feat = add_price_sqft_calc(df_feat)

    # 3. Impute missing values
    print("Imputing missing values (group medians + KNN geography)...")
    df_imp = impute_missing_values(df_feat, center)

    # 4. Outlier detection & removal
    print("Filtering outliers (3-pass: domain rules, IQR fences, Isolation Forest)...")
    max_dist = MAX_DISTANCE_KM.get(city, 65.0)
    df_final = remove_outliers(df_imp, max_dist_km=max_dist)

    # 5. Schema verification and column ordering
    print("Verifying target schema compatibility...")
    for col in FINAL_COLUMNS:
        if col not in df_final.columns:
            print(f"  [Warning] Missing column '{col}', filling default.")
            if 'IS_' in col:
                df_final[col] = False
            elif 'CODE' in col or 'COUNT' in col or 'NUM' in col or col in ('BHK', 'PRICE'):
                df_final[col] = 0
            else:
                df_final[col] = 'Unknown'

    df_final = df_final[FINAL_COLUMNS].copy()

    # Align display_df to keep only listings present in df_final
    display_df = display_df[display_df['PROP_ID'].isin(df_final['PROP_ID'])].copy()
    for d_col in DISPLAY_COLUMNS:
        if d_col not in display_df.columns:
            display_df[d_col] = ''
    display_df = display_df[DISPLAY_COLUMNS].copy()

    # 6. Save processed datasets
    out_data_dir = DATA_DIR / city
    out_data_dir.mkdir(parents=True, exist_ok=True)
    final_csv_path = out_data_dir / "flats_final.csv"
    display_csv_path = out_data_dir / "listing_display.csv"

    df_final.to_csv(final_csv_path, index=False)
    display_df.to_csv(display_csv_path, index=False)
    print(f"Saved {len(df_final)} listings to: {final_csv_path}")
    print(f"Saved {len(display_df)} display entries to: {display_csv_path}")

    # 7. Train ML valuation model
    print("Training XGBoost valuation model...")
    model_path = MODEL_DIR / city / "price_model.joblib"
    pipe = train_price_model(df_final, model_path)

    # 8. Precompute SHAP explanations
    print("Precomputing SHAP explainability cache...")
    shap_path = out_data_dir / "shap_cache.json"
    generate_shap_cache(df_final, pipe, shap_path)

    # 9. Test compatibility with backend loader
    print("Verifying FastAPI load compatibility...")
    from app.main import _load_city
    city_state = _load_city(city)
    print(f"SUCCESS: Loaded '{city}' into state with {len(city_state['features_df'])} listings!")
    print(f"{'='*30} FINISHED {city.upper()} {'='*30}\n")


def main():
    parser = argparse.ArgumentParser(description="Multi-city real estate data engineering and ML pipeline")
    parser.add_argument(
        "--city",
        type=str,
        default="mumbai",
        help="City to process: 'mumbai', 'hyderabad', 'kolkata', 'bangalore', 'gurgaon', or 'all'"
    )
    args = parser.parse_args()

    if args.city.lower() == "all":
        cities = ["mumbai", "hyderabad", "kolkata", "bangalore"]
        for c in cities:
            try:
                process_city(c)
            except Exception as e:
                print(f"[ERROR] Failed processing {c}: {e}", file=sys.stderr)
                import traceback
                traceback.print_exc()
    else:
        process_city(args.city)


if __name__ == "__main__":
    main()
