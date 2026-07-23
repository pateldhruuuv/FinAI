"""
ranking.py

Deterministic scoring and ranking engine. Takes technical indicators
(from indicators.py) and news sentiment (from sentiment.py) for each
candidate stock and scores it according to fixed rules per risk
profile. No AI, no database, no randomness — same inputs always
produce the same score.
"""

from typing import Optional

CONSERVATIVE = "Conservative"
MODERATE = "Moderate"
AGGRESSIVE = "Aggressive"

VALID_RISK_PROFILES = {CONSERVATIVE, MODERATE, AGGRESSIVE}

# How many stocks to return per profile. Kept in the 3-5 range as
# specified; conservative investors get a tighter shortlist, aggressive
# investors get more options to compare.
TOP_N_BY_PROFILE = {
    CONSERVATIVE: 3,
    MODERATE: 4,
    AGGRESSIVE: 5,
}

# Thresholds used across scoring rules, named for readability.
HIGH_VOLUME_THRESHOLD = 1.5   # volume_trend > 1.5x its 20-day average
RISING_VOLUME_THRESHOLD = 1.0  # volume_trend > 1.0x = above average


def _is_positive_news(sentiment: dict) -> bool:
    return bool(sentiment) and sentiment.get("sentiment") == "Positive"


def _has_strong_roe(indicators: dict) -> bool:
    """
    Placeholder for a future fundamentals data source (ROE, debt/equity,
    etc.). We don't fetch fundamentals yet, so this always returns
    False today. Once market_data.py (or a new fundamentals.py) exposes
    ROE, replace this with a real threshold check, e.g. roe > 15.
    """
    return False


def _bullish_checks(indicators: dict) -> list[bool]:
    """
    Run a fixed set of technical checks and return one bool per check
    that could actually be evaluated (checks needing a missing value
    are simply omitted, not counted as bearish). This list is the raw
    material for both "how many indicators are bullish" and "how much
    do indicators agree with each other" in calculate_confidence().
    """
    close = indicators.get("latest_close")
    ema20 = indicators.get("ema20")
    ema50 = indicators.get("ema50")
    ema200 = indicators.get("ema200")
    macd = indicators.get("macd")
    macd_signal = indicators.get("macd_signal")
    rsi = indicators.get("rsi")
    volume_trend = indicators.get("volume_trend")

    checks = []
    if close is not None and ema20 is not None:
        checks.append(close > ema20)
    if close is not None and ema50 is not None:
        checks.append(close > ema50)
    if close is not None and ema200 is not None:
        checks.append(close > ema200)
    if ema20 is not None and ema50 is not None:
        checks.append(ema20 > ema50)
    if ema50 is not None and ema200 is not None:
        checks.append(ema50 > ema200)
    if macd is not None and macd_signal is not None:
        checks.append(macd > macd_signal)
    if rsi is not None:
        checks.append(30 <= rsi <= 65)  # healthy zone, not oversold/overbought
    if volume_trend is not None:
        checks.append(volume_trend > 1.0)

    return checks


def calculate_confidence(indicators: dict, sentiment: dict) -> int:
    """
    Compute a 0-100 confidence score, separate from the ranking score.

    Confidence is NOT used for ranking or sorting — score alone still
    decides which stocks are selected and in what order. Confidence is
    purely a "how sure are we about this pick" signal shown to the user.

    Built from three components:
    - Bullish count: what fraction of evaluable technical checks are
      bullish (e.g. 6 of 8 signals bullish = strong technical support).
    - Agreement: how much the indicators agree with EACH OTHER,
      regardless of direction. 7 bullish + 1 bearish = high agreement;
      4 bullish + 4 bearish = indicators are contradicting each other,
      so confidence should drop even if the score is still decent.
    - News sentiment: the numeric sentiment score from sentiment.py
      (0-100), falling back to a neutral 50 if sentiment is unavailable.
    """
    if not indicators:
        return 0

    checks = _bullish_checks(indicators)
    if not checks:
        return 0  # no usable technical data at all — can't be confident

    total = len(checks)
    bullish_count = sum(checks)
    bullish_ratio = bullish_count / total
    agreement_ratio = max(bullish_count, total - bullish_count) / total

    sentiment_score = (sentiment or {}).get("score")
    if sentiment_score is None:
        sentiment_score = 50  # neutral default when sentiment is unavailable

    confidence = (
        0.40 * (bullish_ratio * 100)
        + 0.30 * (agreement_ratio * 100)
        + 0.30 * sentiment_score
    )

    return int(round(max(0, min(100, confidence))))


def _score_conservative(indicators: dict, sentiment: dict) -> tuple[int, list[str]]:
    score = 0
    signals = []

    if indicators.get("latest_close") is not None and indicators.get("ema200") is not None:
        if indicators["latest_close"] > indicators["ema200"]:
            score += 20
            signals.append("Above EMA200")

    if _has_strong_roe(indicators):
        score += 20
        signals.append("Strong ROE")

    rsi = indicators.get("rsi")
    if rsi is not None and 45 <= rsi <= 60:
        score += 15
        signals.append("Healthy RSI (45-60)")

    if _is_positive_news(sentiment):
        score += 15
        signals.append("Positive News")

    return score, signals


def _score_moderate(indicators: dict, sentiment: dict) -> tuple[int, list[str]]:
    score = 0
    signals = []

    macd = indicators.get("macd")
    macd_signal = indicators.get("macd_signal")
    if macd is not None and macd_signal is not None and macd > macd_signal:
        score += 20
        signals.append("MACD Bullish")

    ema20 = indicators.get("ema20")
    ema50 = indicators.get("ema50")
    if ema20 is not None and ema50 is not None and ema20 > ema50:
        score += 20
        signals.append("EMA20 Above EMA50")

    rsi = indicators.get("rsi")
    if rsi is not None and 40 <= rsi <= 60:
        score += 15
        signals.append("Healthy RSI (40-60)")

    if _is_positive_news(sentiment):
        score += 15
        signals.append("Positive News")

    volume_trend = indicators.get("volume_trend")
    if volume_trend is not None and volume_trend > RISING_VOLUME_THRESHOLD:
        score += 10
        signals.append("Volume Increasing")

    return score, signals


def _score_aggressive(indicators: dict, sentiment: dict) -> tuple[int, list[str]]:
    score = 0
    signals = []

    macd = indicators.get("macd")
    macd_signal = indicators.get("macd_signal")
    if macd is not None and macd_signal is not None and macd > macd_signal:
        score += 25
        signals.append("MACD Bullish")

    volume_trend = indicators.get("volume_trend")
    if volume_trend is not None and volume_trend > HIGH_VOLUME_THRESHOLD:
        score += 25
        signals.append("High Volume")

    # "Strong momentum" = short-term uptrend confirmed by price above
    # EMA20 and EMA20 above EMA50 (short-term trend outpacing medium-term).
    close = indicators.get("latest_close")
    ema20 = indicators.get("ema20")
    ema50 = indicators.get("ema50")
    if None not in (close, ema20, ema50) and close > ema20 > ema50:
        score += 20
        signals.append("Strong Momentum")

    if _is_positive_news(sentiment):
        score += 15
        signals.append("Positive News")

    rsi = indicators.get("rsi")
    if rsi is not None and rsi < 60:
        score += 15
        signals.append("RSI Below 60")

    return score, signals


_SCORERS = {
    CONSERVATIVE: _score_conservative,
    MODERATE: _score_moderate,
    AGGRESSIVE: _score_aggressive,
}


def score_stock(indicators: dict, sentiment: dict, risk_profile: str) -> int:
    """
    Score a single stock for a given risk profile.

    Returns 0 if indicators are missing (insufficient historical data —
    see indicators.calculate_indicators, which returns None in that
    case) rather than raising, so one bad stock can't break ranking
    for the whole candidate list.

    This returns the score only (unchanged contract, used by main.py's
    technical pre-filter which just needs a number to sort on). Use
    score_stock_with_signals() if you also need the matched signals.
    """
    score, _ = score_stock_with_signals(indicators, sentiment, risk_profile)
    return score


def score_stock_with_signals(indicators: dict, sentiment: dict, risk_profile: str) -> tuple[int, list[str]]:
    """
    Score a single stock for a given risk profile AND return the list
    of short, human-readable descriptions for every rule that
    contributed positively (e.g. ["MACD Bullish", "Above EMA200",
    "Positive News"]). These are meant for explain.py to reference
    when generating an explanation, so the LLM is grounded in the
    actual deterministic reasons this stock scored well — not just
    the number.

    The scoring algorithm itself is unchanged; this only adds
    descriptive labels alongside the same point values.
    """
    if risk_profile not in VALID_RISK_PROFILES:
        raise ValueError(f"Unknown risk profile: {risk_profile}")

    if not indicators:
        return 0, []

    sentiment = sentiment or {}
    scorer = _SCORERS[risk_profile]
    return scorer(indicators, sentiment)


def rank_stocks(candidates: list[dict], risk_profile: str, top_n: Optional[int] = None) -> list[dict]:
    """
    Score and rank all candidate stocks, returning the top N.

    candidates: list of dicts, each shaped like
        {"symbol": str, "indicators": dict | None, "sentiment": dict}
    as assembled by main.py from market_data / indicators / sentiment.

    top_n: overrides the default per-profile count (see
    TOP_N_BY_PROFILE) if provided.

    Returns a list sorted by score descending, e.g.:
        [{"symbol": "BEL", "score": 92, "confidence": 87,
          "signals": ["MACD Bullish", "Above EMA200", "Positive News"],
          "indicators": {...}, "sentiment": {...}}, ...]
    Sorting and top_n selection are based on "score" only — "confidence"
    and "signals" are separate, informational fields: confidence is
    shown to the user, and signals are handed to explain.py so the LLM
    explanation is grounded in the actual rules that fired, rather than
    the raw score number alone. The extra indicators/sentiment fields
    are included so explain.py can generate a reasoned explanation
    without re-fetching data; trim any of these at the API boundary in
    main.py if you only want a subset in the response.
    """
    if risk_profile not in VALID_RISK_PROFILES:
        raise ValueError(f"Unknown risk profile: {risk_profile}")

    limit = top_n or TOP_N_BY_PROFILE[risk_profile]

    scored = []
    for candidate in candidates:
        indicators = candidate.get("indicators")
        if not indicators:
            # Skip stocks with insufficient history rather than scoring
            # them 0 and letting them clutter the bottom of the list.
            continue

        sentiment = candidate.get("sentiment") or {}
        score, signals = score_stock_with_signals(indicators, sentiment, risk_profile)
        confidence = calculate_confidence(indicators, sentiment)

        scored.append({
            "symbol": candidate["symbol"],
            "score": score,
            "confidence": confidence,
            "signals": signals,
            "indicators": indicators,
            "sentiment": sentiment,
        })

    scored.sort(key=lambda item: item["score"], reverse=True)

    return scored[:limit]
