# Cell Guide — `gurgaon_pipeline.ipynb`

Reference for every cell in the notebook: what it does, why it exists, and what
variable/file it produces. Cell numbers are 0-indexed and count markdown + code
cells together, matching Jupyter's own numbering.

---

## Section 0 — Title (Cell 0, markdown)
Overview of the notebook and the 9-stage pipeline it runs.

## Section 1 — Load & First Look

**Cell 1 (code) — Imports & config**
Imports pandas/numpy/ast/re, matplotlib/seaborn for plotting, and
`SimpleImputer`/`KNNImputer`/`IsolationForest` from sklearn. Sets global display
and plotting options. Defines `RAW_PATH`, the one line you edit to point at a
different city's CSV.

**Cell 3 (code) — Load the CSV**
`df = pd.read_csv(RAW_PATH, low_memory=False)`. Prints shape, shows first 3 rows.
`low_memory=False` avoids dtype-guessing warnings on a file this wide.

**Cell 4 (code) — `df.info()`**
Full column list with dtypes and non-null counts — the fastest way to see which
columns are strings vs numbers vs already-parsed floats.

**Cell 5 (code) — Missingness bar chart**
Horizontal bar chart of % missing per column, sorted, for every column with at
least one missing value. This is what drives the "drop near-empty columns"
decisions in Section 2.

---

## Section 2 — Column Audit (Cell 6, markdown)
Explains the reasoning: drop scraping artifacts (photo/thumbnail URLs, dealer
photos, page URLs), drop near-empty columns with a reliable substitute
(`BUILTUP_SQFT`, `SUPER_SQFT`, `QUALITY_SCORE`, etc.), keep `MIN_PRICE` /
`MIN_AREA_SQFT` as canonical price/area, and keep the JSON-ish columns for
now — they get parsed into real features in Section 3, not dropped outright.

**Cell 7 (code) — `DROP_COLS` and the first drop**
Defines the full list of columns to remove and produces `df1` by dropping them.
This is the single place to edit if you decide a "junk" column is actually
useful later.

---

## Section 3 — Parsing Nested / JSON-ish Columns (Cell 8, markdown)
Explains that several raw columns are Python dict/list literals stored as
strings (an artifact of how the scraper serialized nested API responses), and
that `ast.literal_eval` is used instead of `eval` for safety.

**Cell 9 (code) — `safe_eval()` + `MAP_DETAILS` parsing**
Defines the reusable `safe_eval()` helper (returns `None` on anything that
isn't valid literal syntax, instead of raising). Uses it to pull `LATITUDE`
and `LONGITUDE` out of `MAP_DETAILS`, and `FURNISH_LABEL`/`RERA_TYPE` out of
`FORMATTED`.

**Cell 10 (code) — `SECONDARY_TAGS` → boolean flags**
Parses the tag list (e.g. `['READY TO MOVE', 'RESALE', 'RERA']`) and creates
five boolean columns: `IS_READY_TO_MOVE`, `IS_RESALE`, `IS_RERA`,
`IS_GATED_COMMUNITY`, `IS_HUDA_APPROVED`. `has_tag()` does a case-insensitive
substring match against each tag.

**Cell 11 (code) — `TOP_USPS` → facing direction + USP count**
Regex-searches the free-text USP list for phrases like "North Facing" /
"South East Facing" and stores the match in `FACING_TEXT` (supplementary to
the numeric `FACING` code — see Cell 16 for why the numeric code isn't
trusted at face value). Also counts how many USPs each listing has
(`USP_COUNT`), a rough proxy for how much the seller emphasized the listing.

**Cell 12 (code) — `FORMATTED_LANDMARK_DETAILS` → per-category counts**
Each row's landmark list looks like
`[{'category': 'Shopping', 'text': '4 Shoppings', ...}, ...]`. This extracts a
count per category (`NEARBY_SHOPPING`, `NEARBY_EDUCATION`, `NEARBY_HOSPITAL`,
`NEARBY_METROSTATION`, `NEARBY_RAILWAYSTATION`, `NEARBY_CONNECTIVITY`,
`NEARBY_BANK`, `NEARBY_PARK`) by regex-pulling the digit out of the `text`
field. Also carries over `TOTAL_NEARBY_LANDMARKS` from the existing
`TOTAL_LANDMARK_COUNT` column.

**Cell 13 (code) — `AMENITIES` / `FEATURES` → counts**
Both columns are comma-separated numeric codes (e.g. `"33,23,12,46,25"`) with
no public legend for what each code means — so rather than guess labels, this
cell just counts how many codes are present per listing:
`AMENITIES_COUNT`, `FEATURES_COUNT`.

**Cell 14 (code) — Drop the now-parsed raw columns**
Drops the original `MAP_DETAILS`, `FORMATTED`, `SECONDARY_TAGS`, `TOP_USPS`,
`FORMATTED_LANDMARK_DETAILS`, `AMENITIES`, `FEATURES`, `TOTAL_LANDMARK_COUNT`,
`metadata` columns now that everything useful has been extracted into `df1`.
Produces `df2`.

---

## Section 4 — Core Data Cleaning (Cell 15, markdown)
Explains that this section fixes dtypes, decodes the one code column we can
confidently decode, parses dates, and checks for duplicates.

**Cell 16 (code) — dtype fixes, `FURNISH` decode, date parsing**
- Drops `CITY` (constant "Gurgaon" for every row), `LOCALITY` (redundant with
  `LOCALITY_WO_CITY`), and `PRICE_PER_UNIT_AREA` (verified identical to
  `PRICE_SQFT` for every row).
- `FLOOR_NUM`: converts the string `'G'` (ground floor) to `0`, everything
  else to numeric.
- `FURNISH`: the raw column is a numeric code (0/1/2/4). Cross-checked against
  the `FURNISH_LABEL` extracted in Cell 9, confirming
  `0→Unknown, 1→Furnished, 2→Unfurnished, 4→Semifurnished` — this is the one
  code column decoded with confidence.
- `REGISTER_DATE` / `EXPIRY_DATE`: strips the ordinal suffix ("29th" → "29")
  and parses to real datetimes; derives `LISTING_DURATION_DAYS`.
- Renames `FACING`, `AGE`, `OWNTYPE`, `TRANSACT_TYPE` to `FACING_CODE`,
  `AGE_CODE`, `OWNTYPE_CODE`, `TRANSACT_TYPE_CODE` and casts them as
  `category` dtype — **these codes have no public legend**, so they're kept
  as unlabeled nominal categories rather than given invented label names.

**Cell 17 (code) — Duplicate handling**
Confirms `PROP_ID` has zero exact duplicates (it's the primary key). Then
flags "relisting" duplicates — rows matching on
`SOCIETY_NAME + MIN_PRICE + MIN_AREA_SQFT + BEDROOM_NUM + FLOOR_NUM`, almost
certainly the same physical unit scraped or listed twice — and drops all but
the first occurrence (491 rows removed on the original 10k dataset).

**Cell 18 (code) — Rename to business-friendly names, unit fix, checkpoint**
`MIN_PRICE→PRICE`, `MIN_AREA_SQFT→AREA_SQFT`, `BEDROOM_NUM→BHK`,
`LOCALITY_WO_CITY→LOCALITY`. Maps `PREFERENCE` from `S`/`R` to `Sale`/`Rent`.

**Unit bug fix:** `MIN_AREA_SQFT` is mislabeled in the source data — despite the
name, it's actually in square **meters**, not square feet (verified against
the raw `AREA` text field: `319.03 * 10.7639 = 3434.0`, an exact match to the
scraped `"3434 sq.ft."` string). This cell multiplies by `10.7639` before
renaming, so the resulting `AREA_SQFT` is genuine square feet — consistent
with `PRICE_SQFT` and with `CARPET_SQFT`/`SUPERBUILTUP_SQFT` (which were
already correctly in sqft). Getting this wrong would have quietly wrecked
every area-based feature and the price model downstream, so it's worth
knowing about if you ever add a new area-related raw column from this source.

Saves `checkpoint_cleaned.csv` — a safe restart point if you want to re-run
just the feature engineering onward.

---

## Section 5 — Feature Engineering (Cell 19, markdown)
States the goal: derive features that actually help explain price — floor
position, geography, amenity/luxury signals, cardinality-reduced categoricals.

**Cell 20 (code) — Floor features + price/sqft sanity check**
`FLOOR_RATIO = FLOOR_NUM / TOTAL_FLOOR` (relative floor position),
`IS_GROUND_FLOOR`, `IS_TOP_FLOOR` booleans. Recomputes price-per-sqft from
scratch (`PRICE / AREA_SQFT`) and compares it against the scraped
`PRICE_SQFT` column, printing how often they disagree by more than ₹1 — a
built-in data-quality check, not just a feature.

**Cell 21 (code) — Geography: distance from city center**
Defines `haversine_km()` and computes `DIST_FROM_CENTER_KM` from each
listing's lat/long to a fixed Gurgaon city-center coordinate (MG Road,
28.4595°N 77.0266°E). Also nulls out lat/long/distance for rows where the
coordinates are obviously broken (`abs(lat) < 1` or `abs(lon) < 1`, i.e.
scraped as ~0), so bad geocodes don't get treated as real values — they're
handled properly in Section 7 (imputation) instead.

**Cell 22 (code) — Locality cardinality reduction**
231 raw locality values is too many levels for most models to handle well.
Keeps the top 30 localities by listing count as-is; buckets everything else
into `'Other'` as `LOCALITY_GROUPED`.

**Cell 23 (code) — Composite `LUXURY_SCORE`**
A simple, explainable weighted sum:
`0.5×AMENITIES_COUNT + 0.3×FEATURES_COUNT + 3×furnish_score + 2×IS_GATED_COMMUNITY + 0.5×TOTAL_NEARBY_LANDMARKS`.
Deliberately hand-weighted rather than learned — meant as a readable starting
feature you can later replace with a model-driven importance score.

**Cell 24 (code) — Checkpoint**
Saves `checkpoint_features.csv`. Prints shape and a dtype count summary.

---

## Section 6 — Exploratory Data Analysis (Cell 25, markdown)
Notes the key EDA design decision: `PREFERENCE` splits listings into **Sale**
(prices in crores) and **Rent** (monthly rent in thousands) — two totally
different price scales — so most price plots are done per-segment.

**Cell 26 (code) — Segment split**
Prints the Sale/Rent value counts, creates `df_sale` and `df_rent`.

**Cell 27 (code) — Sale price distribution**
Two histograms side by side: raw price in crores, and `log(1+price)` — the
log view is the one to trust for judging skew/shape.

**Cell 28 (code) — Rent price distribution**
Histogram of monthly rent (INR), separate scale from sale prices.

**Cell 29 (code) — Sale price by property type**
Boxplot of `log(1+PRICE)` grouped by `PROPERTY_TYPE` (Apartment, Builder
Floor, Villa, Land) — shows which property types command a premium.

**Cell 30 (code) — Price vs area scatter**
Scatter of `AREA_SQFT` vs `PRICE`, colored by `BHK`, sampled to 3,000 points
for readability and clipped to the 99th percentile on both axes so a few
extreme values don't compress the whole plot.

**Cell 31 (code) — Median price by locality**
Horizontal bar chart of median sale price (in crores) for the top 15
localities by listing count — the "where's expensive" chart.

**Cell 32 (code) — Correlation heatmap**
Pearson correlation matrix across the key numeric features (`PRICE`,
`AREA_SQFT`, `BHK`, `BATHROOM_NUM`, `BALCONY_NUM`, `FLOOR_NUM`,
`TOTAL_FLOOR`, `AMENITIES_COUNT`, `FEATURES_COUNT`,
`TOTAL_NEARBY_LANDMARKS`, `LUXURY_SCORE`, `DIST_FROM_CENTER_KM`), sale
listings only.

**Cell 33 (code) — Geospatial scatter**
Plots every sale listing with valid lat/long as a point, colored by
`log(1+PRICE)` — a visual price-heatmap of Gurgaon.

**Cell 34 (code) — Furnishing distribution**
Bar chart of `FURNISH` value counts (Unfurnished / Semifurnished / Furnished
/ Unknown).

---

## Section 7 — Missing Value Imputation (Cell 35, markdown)
A table documenting the strategy and rationale for every column with missing
values — worth reading before touching Cells 36-39, since it explains *why*
each method was chosen (e.g. group-median for area because area correlates
with locality + bedroom count, KNN for lat/long because geography isn't well
captured by a flat median).

**Cell 36 (code) — Group-median impute: area columns**
`AREA_SQFT`, `CARPET_SQFT`, `SUPERBUILTUP_SQFT` are each filled using the
median for that `(LOCALITY_GROUPED, BHK)` combination first, with a global
median as fallback for any group that's entirely missing.

**Cell 37 (code) — Group-median impute: room counts + simple median impute**
`BHK`, `BATHROOM_NUM`, `BALCONY_NUM` filled by median within `PROPERTY_TYPE`.
`FLOOR_NUM`, `TOTAL_FLOOR`, `BROKERAGE`, `LISTING_DURATION_DAYS` filled with
`SimpleImputer(strategy='median')` (no grouping — these aren't as strongly
tied to locality/type).

**Cell 38 (code) — KNN impute: geography**
`LATITUDE`, `LONGITUDE` (plus `AREA_SQFT`, `PRICE_SQFT`, `BHK` as supporting
signals) filled using `KNNImputer(n_neighbors=5)` — finds the 5 most similar
listings by those features and averages their coordinates. `DIST_FROM_CENTER_KM`
is then recomputed using the now-complete lat/long.

**Cell 39 (code) — Categorical fills + final cleanup**
`SOCIETY_NAME`, `BUILDING_NAME`, `PROP_NAME` → `'Unknown'` (independent
houses/plots genuinely have no society). `FACING_TEXT` → `'Unknown'`.
`RERA_STATUS` → `'Not Specified'` (kept as its own category rather than
guessing). `TRANSACT_TYPE_CODE` gets an added `'Unknown'` category for its
NaNs. Drops the now-redundant `FURNISH_LABEL` (already decoded into
`FURNISH`), fills any stray `REGISTER_DATE` gaps with the column median, and
recomputes `FLOOR_RATIO`/`IS_TOP_FLOOR` (these were originally computed in
Section 5 *before* `FLOOR_NUM`/`TOTAL_FLOOR` were imputed, so they're
refreshed here to avoid carrying stale NaNs). Prints whatever columns still
have missing values — should print "None -- fully imputed." on a clean run.

---

## Section 8 — Outlier Detection & Removal (Cell 40, markdown)
Explains the three-pass approach: domain rules first (hard physical/business
bounds), then IQR (statistical, per Sale/Rent segment since scales differ),
then Isolation Forest (multivariate — catches combinations that look fine
individually but are jointly weird, e.g. huge area at a tiny price).

**Cell 41 (code) — Pass 1: domain-rule filters**
Keeps only rows where `BHK` is 1-10, `BATHROOM_NUM` is 0-10, `AREA_SQFT` is
100-20,000 sqft, `PRICE_SQFT` is ₹500-₹1,00,000, and
`DIST_FROM_CENTER_KM < 60` (beyond Gurgaon district bounds = bad geocoding).
Prints the before/after row count.

**Cell 42 (code) — Pass 2: IQR filtering, per segment**
`iqr_bounds()` computes the classic `Q1 - 1.5×IQR` / `Q3 + 1.5×IQR` fences.
Applied separately to `PRICE` and `AREA_SQFT` within the Sale group and
within the Rent group (not combined — their scales differ too much for a
shared fence to make sense).

**Cell 43 (code) — Pass 3: Isolation Forest, per segment**
Fits a separate `IsolationForest(contamination=0.02)` for Sale and for Rent
using `PRICE`, `AREA_SQFT`, `BHK`, `BATHROOM_NUM`, `PRICE_SQFT` jointly, and
keeps only rows flagged as inliers (prediction `== 1`). Catches the "individually
plausible, jointly implausible" cases the first two passes miss.

**Cell 44 (code) — Before/after boxplot**
Side-by-side boxplots of `log(1+PRICE)` by `PREFERENCE`, before (`df5`) vs.
after (`df6`) outlier removal — the visual proof the three passes worked.
Also prints the row counts at every stage: raw → cleaned+featured → final.

---

## Section 9 — Export (Cell 45, markdown)
Explains the two output files: `gurgaon_flats_cleaned.csv` (imputed, outliers
still in) vs `gurgaon_flats_final.csv` (outliers removed, modeling-ready).

**Cell 46 (code) — Write CSVs**
`df5.to_csv('gurgaon_flats_cleaned.csv')`,
`df6.to_csv('gurgaon_flats_final.csv')`. Prints final shapes and previews
`df6.head(3)`.

## Summary (Cell 47, markdown)
Recaps the pipeline stages and row/column counts, and lists natural next
steps: encode remaining categoricals (`PROPERTY_TYPE`, `LOCALITY_GROUPED`,
`FURNISH`, `FACING_CODE`, `AGE_CODE`), log-transform `PRICE` for the Sale
segment before modeling, and do a train/test split stratified by
`PREFERENCE` + `PROPERTY_TYPE`.

---

## Quick reference: variable names across the pipeline

| Variable | Stage | Meaning |
|---|---|---|
| `df` | Cell 3 | Raw load, untouched |
| `df1` | Cell 7 | After dropping junk columns |
| `df2` | Cell 14 | After parsing nested JSON columns |
| `df3` | Cells 16-18 | After core cleaning, renaming, dedup |
| `df4` | Cells 20-24 | After feature engineering |
| `df5` | Cells 36-39 | After missing value imputation |
| `df6` | Cells 41-44 | After outlier removal — the final dataset |
