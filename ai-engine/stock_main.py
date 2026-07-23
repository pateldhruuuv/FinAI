"""
main.py

FastAPI app exposing a single endpoint: POST /recommend.

Pipeline:
    candidate stocks -> technical analysis -> initial technical ranking
    -> select top 10 candidates -> fetch news sentiment (top 10 only)
    -> update scores -> return top 3-5 -> AI explanations (final picks only)

Design note on sentiment: the candidate universe can be ~150 stocks
(see stock_universe.py). Calling NewsAPI + an LLM for every single one
on every request would be slow and expensive, and most of those stocks
would never make the final top 3-5 anyway. So we first score every
stock on TECHNICALS ONLY (fast, no external calls beyond market data)
to build a top-10 shortlist, then only fetch sentiment — and only
generate AI explanations — for that shortlist (sentiment) and the
final top 3-5 (explanations). This minimizes NewsAPI and LLM calls
while keeping recommendation quality high.
"""

import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException

import explain
import indicators as indicators_module
import market_data
import ranking
import sentiment
import stock_universe
from schemas import RecommendationRequest, RecommendationResponse, RecommendedStock

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FinAI", description="Deterministic Indian stock recommendations by risk profile.")


@app.get("/health")
def health() -> dict:
    """Basic liveness check — confirms the server is up and responding."""
    return {"status": "ok"}

# How much history to pull per stock. Indicators need 200+ rows for
# EMA200/SMA200 to be valid (see indicators.MIN_REQUIRED_ROWS), and
# "6mo" (market_data's default) isn't enough — 1 year of NSE trading
# days comfortably clears that bar.
HISTORY_PERIOD = "1y"

# How many technically-strong candidates advance to sentiment analysis.
# Keeps per-request NewsAPI/LLM calls bounded no matter how large the
# candidate universe grows.
TOP_10_SHORTLIST_SIZE = 10


def _build_technical_shortlist(risk_profile: str) -> list[dict]:
    """
    Stage 1-3 of the pipeline: fetch market data and calculate
    indicators for the full candidate universe, run an initial
    technical-only ranking (no sentiment yet), and select the top 10
    candidates. Stocks with insufficient history are skipped, not
    treated as failures.
    """
    symbols = stock_universe.get_candidate_universe()
    if not symbols:
        raise HTTPException(status_code=503, detail="Stock universe is empty.")

    price_history = market_data.get_price_history_bulk(symbols, period=HISTORY_PERIOD)
    if not price_history:
        raise HTTPException(status_code=503, detail="Market data is currently unavailable.")

    scored_technicals = []
    for symbol, df in price_history.items():
        try:
            stock_indicators = indicators_module.calculate_indicators(df)
        except Exception as exc:
            logger.warning("Indicator calculation failed for %s: %s", symbol, exc)
            continue

        if not stock_indicators:
            continue  # insufficient history for this stock — skip it

        technical_score = ranking.score_stock(stock_indicators, {}, risk_profile)
        scored_technicals.append({
            "symbol": symbol,
            "indicators": stock_indicators,
            "technical_score": technical_score,
        })

    # Initial technical ranking, then select the top 10 candidates.
    scored_technicals.sort(key=lambda item: item["technical_score"], reverse=True)
    return scored_technicals[:TOP_10_SHORTLIST_SIZE]


def _attach_sentiment(shortlist: list[dict]) -> list[dict]:
    """
    Stage 4 of the pipeline: fetch news sentiment for the top-10
    technical shortlist only (not the full universe). sentiment.py
    already handles its own failures gracefully (returns a neutral
    fallback), so this just wraps it defensively in case of an
    unexpected error.
    """
    candidates = []
    for item in shortlist:
        symbol = item["symbol"]
        company_query = symbol.replace(".NS", "")  # NewsAPI works better on plain names/tickers
        try:
            stock_sentiment = sentiment.get_news_sentiment(company_query)
        except Exception as exc:
            logger.warning("Sentiment fetch failed for %s: %s", symbol, exc)
            stock_sentiment = {"sentiment": "Neutral", "score": 50, "summary": "", "headlines": []}

        candidates.append({
            "symbol": symbol,
            "indicators": item["indicators"],
            "sentiment": stock_sentiment,
        })

    return candidates


@app.post("/recommend", response_model=RecommendationResponse)
def recommend(request: RecommendationRequest) -> RecommendationResponse:
    """
    Return the top 3-5 recommended Indian stocks for the given risk
    profile, each with a deterministic score and a short AI-generated
    explanation of why the ranking engine selected it.
    """
    risk_profile = request.risk_profile.value

    # Stages 1-3: technical analysis -> initial technical ranking ->
    # select top 10 candidates.
    try:
        shortlist = _build_technical_shortlist(risk_profile)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Failed to build technical shortlist: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to analyze market data.")

    if not shortlist:
        raise HTTPException(status_code=503, detail="No stocks had sufficient data to analyze.")

    # Stage 4: fetch news sentiment for the top 10 only.
    candidates = _attach_sentiment(shortlist)

    # Stage 5-6: update scores (technicals + sentiment combined) and
    # return the top 3-5.
    try:
        ranked_stocks = ranking.rank_stocks(candidates, risk_profile)
    except Exception as exc:
        logger.error("Ranking failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to rank stocks.")

    if not ranked_stocks:
        raise HTTPException(status_code=503, detail="No stocks matched this risk profile.")

    # Stage 7: AI explanations for the final recommendations only.
    try:
        explanations = explain.explain_recommendations(ranked_stocks, risk_profile)
    except Exception as exc:
        logger.warning("Explanation generation failed, using fallback text: %s", exc)
        explanations = [
            {"symbol": s["symbol"], "summary": "Explanation unavailable.", "pros": [], "risks": []}
            for s in ranked_stocks
        ]

    explanations_by_symbol = {e["symbol"]: e for e in explanations}

    recommendations = []
    for stock in ranked_stocks:
        explanation = explanations_by_symbol.get(stock["symbol"], {})
        stock_indicators = stock.get("indicators") or {}
        recommendations.append(RecommendedStock(
            symbol=stock["symbol"],
            price=stock_indicators.get("latest_close"),
            price_change=stock_indicators.get("price_change"),
            price_change_percent=stock_indicators.get("price_change_percent"),
            score=stock["score"],
            sentiment=stock["sentiment"].get("sentiment", "Neutral"),
            summary=explanation.get("summary", ""),
            pros=explanation.get("pros", []),
            risks=explanation.get("risks", []),
        ))

    return RecommendationResponse(
        recommendations=recommendations,
        generated_at=datetime.now(timezone.utc),
    )
