from typing import Optional
from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    budget_min: float = Field(..., gt=0, description="Minimum budget in rupees")
    budget_max: float = Field(..., gt=0, description="Maximum budget in rupees")
    bhk: Optional[int] = Field(None, ge=1, le=10)
    locality: Optional[str] = Field(None, description="Substring match against locality name")
    furnish: Optional[str] = Field(None, description="Furnished / Semifurnished / Unfurnished")
    gated_only: bool = False
    min_amenities: Optional[int] = None
    top_n: int = Field(10, ge=1, le=50)
    value_weight: float = 0.5
    luxury_weight: float = 0.3
    distance_weight: float = 0.2


class ListingCard(BaseModel):
    prop_id: str
    society_name: str
    locality: str
    property_type: str
    bhk: float
    area_sqft: float
    price: float
    predicted_price: float
    value_score: float
    luxury_score: float
    dist_from_center_km: float
    furnish: str
    rank_score: float
    thumbnail_url: Optional[str] = None
    images: list[str] = []
    description: Optional[str] = None


class RecommendResponse(BaseModel):
    count: int
    results: list[ListingCard]


class PredictRequest(BaseModel):
    """Fields a real user filling out a form would actually know. Everything the
    model needs beyond this gets filled in with locality-level defaults server-side --
    see app/defaults.py."""
    property_type: str = Field(..., description="e.g. 'Residential Apartment'")
    locality: str = Field(..., description="Must match a known LOCALITY_GROUPED value")
    bhk: int = Field(..., ge=1, le=10)
    bathroom_num: int = Field(..., ge=0, le=10)
    balcony_num: int = Field(0, ge=0, le=10)
    area_sqft: float = Field(..., gt=0)
    floor_num: float = Field(0, ge=0)
    total_floor: float = Field(1, ge=1)
    furnish: str = Field("Semifurnished", description="Furnished / Semifurnished / Unfurnished")
    is_gated_community: bool = False


class PredictResponse(BaseModel):
    predicted_price: float
    predicted_price_per_sqft: float
    note: str


class InsightFactor(BaseModel):
    label: str
    direction: str  # 'positive' or 'negative'
    magnitude: float


class ExplainResponse(BaseModel):
    predicted_price: float
    top_factors: list[InsightFactor]
    insight: str
    matched_scenario: str  # which cache key was actually used, e.g. "Sector 65|3" or "__global__"
    sample_size: int