"""
config.py

Minimal, flat configuration: secrets read from environment variables,
plus constants that describe the app's current behaviour. No classes,
no validation logic — just values other modules import.
"""

import os

# ---------------------------------------------------------------------
# Secrets (from environment variables — never hardcode these)
# ---------------------------------------------------------------------
NEWS_API_KEY = os.environ.get("NEWS_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# ---------------------------------------------------------------------
# Stock universe source
#
# Documents which mode stock_universe.py is currently running in.
# "static_nifty500" = fixed candidate list (MVP default).
# "dynamic_screener" = reserved for the future top-gainers/high-volume/
# momentum screener described in stock_universe.py's docstring.
# ---------------------------------------------------------------------
UNIVERSE_SOURCE = os.environ.get("UNIVERSE_SOURCE", "static_nifty500")

# ---------------------------------------------------------------------
# Risk profile scoring weights
#
# Reference copy of the point values implemented in ranking.py's
# _score_conservative / _score_moderate / _score_aggressive functions.
# Kept here for visibility and easy tuning; if you change a value in
# ranking.py, update it here too so this stays accurate.
# ---------------------------------------------------------------------
RISK_PROFILE_WEIGHTS = {
    "Conservative": {
        "above_ema200": 20,
        "strong_roe": 20,       # placeholder — no fundamentals data yet
        "rsi_45_to_60": 15,
        "positive_news": 15,
    },
    "Moderate": {
        "macd_bullish": 20,
        "ema20_above_ema50": 20,
        "rsi_40_to_60": 15,
        "positive_news": 15,
        "volume_increasing": 10,
    },
    "Aggressive": {
        "macd_bullish": 25,
        "high_volume": 25,
        "strong_momentum": 20,
        "positive_news": 15,
        "rsi_below_60": 15,
    },
}

# ---------------------------------------------------------------------
# Indicator calculation parameters
#
# Reference copy of the constants used in indicators.py. Kept here so
# indicator settings are visible in one place alongside the rest of
# the app's tunable behaviour.
# ---------------------------------------------------------------------
INDICATOR_PARAMS = {
    "rsi_length": 14,
    "macd_fast": 12,
    "macd_slow": 26,
    "macd_signal": 9,
    "ema_periods": [20, 50, 200],
    "sma_periods": [50, 200],
    "volume_avg_length": 20,
    "min_required_rows": 200,  # needed for EMA200 / SMA200 to be valid
}
