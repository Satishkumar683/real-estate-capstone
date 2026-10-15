import sys
from pathlib import Path
import pandas as pd
import joblib
import json

sys.stdout.reconfigure(encoding='utf-8')

DATA_DIR = Path('app/data')
MODEL_DIR = Path('app/models')

cities = ['gurgaon', 'mumbai', 'hyderabad', 'kolkata', 'bangalore']

print(f"{'City':<12} | {'Listings':<10} | {'Cols':<6} | {'Display':<10} | {'Model':<8} | {'SHAP':<8}")
print("-" * 65)

ref_cols = None

for city in cities:
    data_city = DATA_DIR / city
    model_city = MODEL_DIR / city
    
    final_csv = data_city / 'flats_final.csv'
    disp_csv = data_city / 'listing_display.csv'
    model_file = model_city / 'price_model.joblib'
    shap_file = data_city / 'shap_cache.json'
    
    if not final_csv.exists():
        print(f"{city:<12} | MISSING flats_final.csv")
        continue
        
    df = pd.read_csv(final_csv)
    disp = pd.read_csv(disp_csv) if disp_csv.exists() else None
    model_ok = model_file.exists()
    shap_ok = shap_file.exists()
    
    if ref_cols is None:
        ref_cols = list(df.columns)
    else:
        diff = set(ref_cols) ^ set(df.columns)
        if diff:
            print(f"  [SCHEMA MISMATCH for {city}]: diff = {diff}")
            
    print(f"{city:<12} | {len(df):<10} | {len(df.columns):<6} | {len(disp) if disp is not None else 0:<10} | {'OK' if model_ok else 'MISSING':<8} | {'OK' if shap_ok else 'MISSING':<8}")

print("\nVerifying FastAPI dynamic discovery:")
from app.main import _discover_cities, _load_city
discovered = _discover_cities()
print("Discovered cities:", discovered)

for city in discovered:
    state = _load_city(city)
    print(f"Loaded {city}: {len(state['features_df'])} listings, model={type(state['model'])}, shap_scenarios={len(state['shap_cache']) if state['shap_cache'] else 0}")
