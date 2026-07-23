"""
indicators.py

Pure functions that turn OHLCV history (from market_data.py) into the
technical indicators the ranking engine needs. No classes, no state —
every function takes data in and returns data out.

Indicators are computed natively with pandas (.ewm() / .rolling()) 
rather than via the pandas-ta package. pandas-ta's PyPI listing has
been rewritten multiple times with breaking changes (different Python
version requirements, a renamed successor package with an incompatible
API) — RSI/MACD/EMA/SMA are simple enough formulas that depending on
that library isn't worth the fragility for this MVP.
"""

from typing import Optional

import pandas as pd

# EMA200/SMA200 are the longest-lookback indicators we calculate, so we
# need at least this many rows of history to trust any of the numbers.
MIN_REQUIRED_ROWS = 200

RSI_LENGTH = 14
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
VOLUME_AVG_LENGTH = 20


def _ema(series: pd.Series, length: int) -> pd.Series:
    """Exponential moving average, standard span-based smoothing."""
    return series.ewm(span=length, adjust=False).mean()


def _sma(series: pd.Series, length: int) -> pd.Series:
    """Simple moving average."""
    return series.rolling(window=length).mean()


def _rsi(series: pd.Series, length: int = RSI_LENGTH) -> pd.Series:
    """
    RSI using Wilder's smoothing (the standard, widely-used convention —
    matches what pandas-ta and most charting platforms produce).
    """
    delta = series.diff()
    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)
    avg_gain = gains.ewm(alpha=1 / length, adjust=False).mean()
    avg_loss = losses.ewm(alpha=1 / length, adjust=False).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def _macd(series: pd.Series, fast: int = MACD_FAST, slow: int = MACD_SLOW, signal: int = MACD_SIGNAL):
    """Returns (macd_line, signal_line) as a tuple of Series."""
    macd_line = _ema(series, fast) - _ema(series, slow)
    signal_line = _ema(macd_line, signal)
    return macd_line, signal_line


def _last_valid(series: Optional[pd.Series]) -> Optional[float]:
    """
    Safely pull the most recent non-NaN value out of a pandas Series.
    Returns None if the series is missing, empty, or entirely NaN —
    this is the single place that guards every indicator against bad
    or incomplete data.
    """
    if series is None or series.empty:
        return None
    clean = series.dropna()
    if clean.empty:
        return None
    return float(clean.iloc[-1])


def calculate_indicators(df: pd.DataFrame) -> Optional[dict]:
    """
    Calculate all technical indicators for a single stock's OHLCV history.

    Input: DataFrame with columns [Open, High, Low, Close, Volume],
    as returned by market_data.get_price_history().

    Returns a dict of the latest indicator values, or None if there
    isn't enough history to calculate the longer-lookback indicators
    (EMA200 / SMA200) reliably.
    """
    if df is None or df.empty:
        return None

    required_columns = {"Open", "High", "Low", "Close", "Volume"}
    if not required_columns.issubset(df.columns):
        return None

    if len(df) < MIN_REQUIRED_ROWS:
        return None

    close = df["Close"]
    volume = df["Volume"]

    # --- RSI ---
    rsi = _last_valid(_rsi(close, length=RSI_LENGTH))

    # --- MACD ---
    macd_line, signal_line = _macd(close, fast=MACD_FAST, slow=MACD_SLOW, signal=MACD_SIGNAL)
    macd = _last_valid(macd_line)
    macd_signal = _last_valid(signal_line)

    # --- EMAs ---
    ema20 = _last_valid(_ema(close, 20))
    ema50 = _last_valid(_ema(close, 50))
    ema200 = _last_valid(_ema(close, 200))

    # --- SMAs ---
    sma50 = _last_valid(_sma(close, 50))
    sma200 = _last_valid(_sma(close, 200))

    # --- Volume ---
    avg_volume_20 = _last_valid(_sma(volume, VOLUME_AVG_LENGTH))
    latest_volume = _last_valid(volume)
    volume_trend = None
    if avg_volume_20 and avg_volume_20 > 0 and latest_volume is not None:
        # >1.0 means today's volume is running above its 20-day average
        volume_trend = round(latest_volume / avg_volume_20, 3)

    # --- Price change (day-over-day, from the same history already fetched) ---
    latest_close = _last_valid(close)
    previous_close = None
    clean_close = close.dropna()
    if len(clean_close) >= 2:
        previous_close = float(clean_close.iloc[-2])

    price_change = None
    price_change_percent = None
    if latest_close is not None and previous_close is not None and previous_close != 0:
        price_change = latest_close - previous_close
        price_change_percent = (price_change / previous_close) * 100

    result = {
        "rsi": _round_or_none(rsi),
        "macd": _round_or_none(macd),
        "macd_signal": _round_or_none(macd_signal),
        "ema20": _round_or_none(ema20),
        "ema50": _round_or_none(ema50),
        "ema200": _round_or_none(ema200),
        "sma50": _round_or_none(sma50),
        "sma200": _round_or_none(sma200),
        "avg_volume_20": _round_or_none(avg_volume_20),
        "volume_trend": volume_trend,
        "latest_close": _round_or_none(latest_close),
        "previous_close": _round_or_none(previous_close),
        "price_change": _round_or_none(price_change),
        "price_change_percent": _round_or_none(price_change_percent),
    }

    # If every single indicator failed to calculate, treat this stock
    # as unusable rather than returning a dict full of Nones.
    if all(value is None for value in result.values()):
        return None

    return result


def _round_or_none(value: Optional[float], digits: int = 2) -> Optional[float]:
    """Round a value for clean display, passing None through untouched."""
    if value is None:
        return None
    return round(value, digits)
