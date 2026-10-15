"""
Model training pipeline for real estate valuation.
Trains an XGBoost regression model on log1p(PRICE) and persists pipeline to joblib.
"""
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

from pipeline.config import BOOLEAN_COLS, CATEGORICAL_COLS, NON_FEATURE_COLS, TARGET


def train_price_model(df: pd.DataFrame, model_output_path: Path) -> Pipeline:
    """Trains an XGBoost valuation pipeline and saves to disk."""
    model_output_path.parent.mkdir(parents=True, exist_ok=True)

    # Filter to Sale preference (or fallback to full df if too few)
    train_df = df[df['PREFERENCE'] == 'Sale'].copy()
    if len(train_df) < 50:
        train_df = df.copy()

    # Drop target and non-features
    drop_cols = [c for c in NON_FEATURE_COLS if c in train_df.columns] + [TARGET]
    X = train_df.drop(columns=drop_cols)

    # Cast boolean columns to integers
    for b_col in BOOLEAN_COLS:
        if b_col in X.columns:
            X[b_col] = X[b_col].astype(int)

    # Target is log1p transformed price
    y = np.log1p(train_df[TARGET].values)

    # Train / test split for validation metrics
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42
    )

    # Preprocessing with ColumnTransformer matching Gurgaon model
    prep = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_COLS)
        ],
        remainder='passthrough'
    )

    # XGBoost Regressor with hyperparameters from gurgaon_price_model.ipynb
    model = XGBRegressor(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=8,
        colsample_bytree=0.7,
        random_state=42,
        n_jobs=-1,
    )

    pipe = Pipeline([
        ('prep', prep),
        ('model', model)
    ])

    print(f"  [Model] Training on {len(X_train)} listings with {X.shape[1]} features...")
    pipe.fit(X_train, y_train)

    # Evaluate
    preds_log = pipe.predict(X_test)
    r2 = r2_score(y_test, preds_log)
    mae_inr = mean_absolute_error(np.expm1(y_test), np.expm1(preds_log))
    print(f"  [Model Validation] R2 (log scale): {r2:.3f} | Test MAE: INR {mae_inr:,.0f}")

    # Refit on full dataset for maximum performance in production
    pipe.fit(X, y)

    # Save to disk
    joblib.dump(pipe, model_output_path)
    print(f"  [Model] Saved pipeline to {model_output_path}")

    return pipe
