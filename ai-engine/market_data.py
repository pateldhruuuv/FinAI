"""
market_data.py

Isolated market data layer. Every other module gets price/volume data
through the functions below and never talks to yfinance directly.

Why isolated: for the MVP we use yfinance. Later this file can be
rewritten to call Kite Connect (or any other provider) without touching
indicators.py, ranking.py, or main.py — as long as the function
signatures and returned shapes stay the same.

Returned shapes (the "contract" other modules rely on):
- get_price_history(symbol) -> pandas.DataFrame with columns
  [Open, High, Low, Close, Volume], indexed by date, or None on failure.
- get_quote(symbol) -> dict with keys
  {symbol, price, previous_close, volume, market_cap} or None on failure.
- get_price_history_bulk(symbols) -> dict[str, DataFrame], only
  successful fetches are included.
"""

import logging
import time
from typing import Optional

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

NSE_SUFFIX = ".NS"
DEFAULT_PERIOD = "6mo"   # enough history for EMA200
DEFAULT_INTERVAL = "1d"

# Simple in-memory cache so repeated requests within a short window
# (e.g. testing /recommend a few times in a row) don't re-download the
# same year of history for ~150 stocks every time. No Redis needed for
# an MVP — this is just a process-local dict that resets on restart.
# Cache key: (tuple of sorted symbols, period, interval) -> (timestamp, result)
_bulk_history_cache: dict[tuple, tuple[float, dict[str, pd.DataFrame]]] = {}
CACHE_TTL_SECONDS = 900  # 15 minutes — daily price data doesn't change intra-day anyway


def normalize_symbol(symbol: str) -> str:
    """Ensure NSE symbols have the .NS suffix yfinance expects."""
    symbol = symbol.strip().upper()
    if not symbol.endswith(NSE_SUFFIX):
        symbol += NSE_SUFFIX
    return symbol


def get_price_history(
    symbol: str,
    period: str = DEFAULT_PERIOD,
    interval: str = DEFAULT_INTERVAL,
) -> Optional[pd.DataFrame]:
    """
    Fetch OHLCV history for a single stock.

    Returns None if the symbol is invalid, delisted, or the fetch fails,
    so callers can skip it instead of crashing the whole request.
    """
    symbol = normalize_symbol(symbol)
    try:
        df = yf.Ticker(symbol).history(period=period, interval=interval)
    except Exception as exc:
        logger.warning("Failed to fetch history for %s: %s", symbol, exc)
        return None

    if df is None or df.empty:
        logger.warning("No history returned for %s", symbol)
        return None

    df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
    if df.empty:
        return None

    return df


def get_price_history_bulk(
    symbols: list[str],
    period: str = DEFAULT_PERIOD,
    interval: str = DEFAULT_INTERVAL,
) -> dict[str, pd.DataFrame]:
    """
    Fetch OHLCV history for many stocks in one batched call.

    Much faster than calling get_price_history() in a loop for large
    universes (NIFTY 500 scale). Symbols that fail or return empty data
    are silently dropped from the result.

    Results are cached in-memory for CACHE_TTL_SECONDS, keyed by the
    exact set of symbols + period + interval requested — so calling
    /recommend repeatedly while testing reuses the same data instead
    of re-downloading it every time.
    """
    normalized = [normalize_symbol(s) for s in symbols]

    cache_key = (tuple(sorted(normalized)), period, interval)
    cached = _bulk_history_cache.get(cache_key)
    if cached is not None:
        cached_at, cached_result = cached
        age = time.time() - cached_at
        if age < CACHE_TTL_SECONDS:
            logger.info("Using cached price history (%.0fs old, %d symbols)", age, len(cached_result))
            return cached_result

    result: dict[str, pd.DataFrame] = {}

    try:
        data = yf.download(
            normalized,
            period=period,
            interval=interval,
            group_by="ticker",
            threads=True,
            progress=False,
        )
    except Exception as exc:
        logger.warning("Bulk download failed, falling back to per-symbol: %s", exc)
        for symbol in normalized:
            df = get_price_history(symbol, period, interval)
            if df is not None:
                result[symbol] = df
        _bulk_history_cache[cache_key] = (time.time(), result)
        return result

    # yfinance returns a single-level frame when only one symbol is passed
    if len(normalized) == 1:
        symbol = normalized[0]
        if not data.empty:
            df = data[["Open", "High", "Low", "Close", "Volume"]].dropna()
            if not df.empty:
                result[symbol] = df
        _bulk_history_cache[cache_key] = (time.time(), result)
        return result

    for symbol in normalized:
        try:
            df = data[symbol][["Open", "High", "Low", "Close", "Volume"]].dropna()
        except (KeyError, TypeError):
            continue
        if not df.empty:
            result[symbol] = df

    _bulk_history_cache[cache_key] = (time.time(), result)
    return result


def get_quote(symbol: str) -> Optional[dict]:
    """
    Fetch a lightweight current snapshot for a stock — used for quick
    screening steps that don't need full history.
    """
    symbol = normalize_symbol(symbol)
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
    except Exception as exc:
        logger.warning("Failed to fetch quote for %s: %s", symbol, exc)
        return None

    try:
        price = info.get("lastPrice") or info.get("last_price")
        previous_close = info.get("previousClose") or info.get("previous_close")
        volume = info.get("lastVolume") or info.get("last_volume")
        market_cap = info.get("marketCap") or info.get("market_cap")
    except Exception as exc:
        logger.warning("Failed to parse quote for %s: %s", symbol, exc)
        return None

    if price is None:
        return None

    return {
        "symbol": symbol,
        "price": float(price),
        "previous_close": float(previous_close) if previous_close else None,
        "volume": int(volume) if volume else None,
        "market_cap": float(market_cap) if market_cap else None,
    }
