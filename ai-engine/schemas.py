"""
schemas.py

Pydantic models for the API request/response boundary only. No
database models here — this app has no database.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class RiskProfile(str, Enum):
    CONSERVATIVE = "Conservative"
    MODERATE = "Moderate"
    AGGRESSIVE = "Aggressive"


class InvestmentHorizon(str, Enum):
    SHORT_TERM = "short_term"    # < 1 year
    MEDIUM_TERM = "medium_term"  # 1-3 years
    LONG_TERM = "long_term"      # 3+ years


class RecommendationRequest(BaseModel):
    risk_profile: RiskProfile
    investment_amount: Optional[float] = Field(
        default=None, gt=0, description="Optional investment amount in INR."
    )
    investment_horizon: Optional[InvestmentHorizon] = Field(
        default=None, description="Optional investment horizon."
    )


class RecommendedStock(BaseModel):
    symbol: str
    price: Optional[float] = Field(default=None, description="Latest closing price (INR).")
    price_change: Optional[float] = Field(default=None, description="Change vs previous close (INR).")
    price_change_percent: Optional[float] = Field(default=None, description="Change vs previous close (%).")
    score: int = Field(ge=0, description="Deterministic ranking score.")
    sentiment: str = Field(description="Positive, Neutral, or Negative.")
    summary: str = Field(description="Short LLM-generated explanation summary.")
    pros: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class RecommendationResponse(BaseModel):
    recommendations: list[RecommendedStock]
    generated_at: datetime
