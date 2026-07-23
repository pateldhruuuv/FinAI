"""
stock_universe.py

Decides WHICH stocks get analyzed on each request. Nothing else in the
app should hardcode a stock list — everyone calls get_candidate_universe().

MVP behaviour: return a static list of liquid NIFTY 500 stocks.

Future behaviour (not implemented yet): replace the static list with a
dynamic screener — e.g. "Top Gainers today", "High Volume", "Momentum
breakouts" — pulled from a market data provider on each request. Because
ranking.py only ever calls get_candidate_universe() and only cares about
the list[str] it gets back, that swap will not require changes anywhere
else in the app.
"""

# ---------------------------------------------------------------------
# Static candidate list (MVP).
#
# Kept as a plain constant so it's easy to review/update — add or remove
# tickers here as needed. Symbols are NSE tickers WITHOUT the ".NS"
# suffix; normalize_universe() appends it before returning.
#
# This is a representative subset of liquid NIFTY 500 constituents
# (large & mid cap, high trading volume) rather than the full 500 —
# intentionally kept smaller for MVP performance. Expand this list
# freely; nothing else in the app assumes a fixed size.
# ---------------------------------------------------------------------
NIFTY_500_SYMBOLS = [
    # Nifty 50 - large cap anchors
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "HINDUNILVR",
    "ITC", "SBIN", "BHARTIARTL", "KOTAKBANK", "LT", "AXISBANK",
    "BAJFINANCE", "ASIANPAINT", "MARUTI", "SUNPHARMA", "TITAN",
    "ULTRACEMCO", "NESTLEIND", "WIPRO", "ONGC", "NTPC", "POWERGRID",
    "M&M", "TATAMOTORS", "TATASTEEL", "ADANIENT", "ADANIPORTS",
    "COALINDIA", "JSWSTEEL", "HCLTECH", "TECHM", "GRASIM", "CIPLA",
    "DRREDDY", "EICHERMOT", "BAJAJFINSV", "BRITANNIA", "DIVISLAB",
    "HEROMOTOCO", "HINDALCO", "INDUSINDBK", "BAJAJ-AUTO", "APOLLOHOSP",
    "SBILIFE", "HDFCLIFE", "UPL", "BPCL", "TATACONSUM", "SHRIRAMFIN",

    # Nifty Next 50 / mid-cap liquid names
    "PIDILITIND", "DABUR", "GODREJCP", "HAVELLS", "SIEMENS", "DLF",
    "VEDL", "AMBUJACEM", "ACC", "BANKBARODA", "PNB", "CANBK",
    "IDFCFIRSTB", "AUBANK", "FEDERALBNK", "PFC", "RECLTD", "IRCTC",
    "NAUKRI", "ZOMATO", "PAYTM", "NYKAA", "POLICYBZR", "TRENT",
    "MUTHOOTFIN", "CHOLAFIN", "LICHSGFIN", "BAJAJHLDNG", "MOTHERSON",
    "TVSMOTOR", "BOSCHLTD", "MRF", "BALKRISIND", "ASHOKLEY",
    "BHARATFORG", "CUMMINSIND", "ABB", "BEL", "HAL",
    "BHEL", "GAIL", "IOC", "PETRONET", "GUJGASLTD", "TORNTPOWER",
    "TATAPOWER", "ADANIGREEN", "ADANIPOWER", "JSWENERGY",

    # Sector diversification - IT, pharma, FMCG, financials
    "LTIM", "MPHASIS", "COFORGE", "PERSISTENT", "LTTS", "OFSS",
    "LUPIN", "AUROPHARMA", "TORNTPHARM", "ALKEM", "BIOCON", "ZYDUSLIFE",
    "MARICO", "COLPAL", "EMAMILTD", "VBL", "UBL", "MCDOWELL-N",
    "ICICIPRULI", "ICICIGI", "SBICARD", "PGHH", "HDFCAMC", "NAM-INDIA",
    "IRFC", "RVNL", "CONCOR",

    # Industrials, cement, real estate, metals
    "SHREECEM", "RAMCOCEM", "JKCEMENT", "DALBHARAT", "OBEROIRLTY",
    "GODREJPROP", "PHOENIXLTD", "PRESTIGE", "LODHA", "SAIL",
    "NMDC", "JINDALSTEL", "NATIONALUM", "HINDZINC", "HINDCOPPER",

    # Consumer, retail, auto ancillary
    "DMART", "JUBLFOOD", "PAGEIND", "RELAXO", "BATAINDIA", "VOLTAS",
    "WHIRLPOOL", "BLUESTARCO", "CROMPTON", "EXIDEIND", "SONACOMS",
    "APOLLOTYRE", "MFSL", "CANFINHOME",
]


def normalize_universe(symbols: list[str]) -> list[str]:
    """
    Append the NSE ".NS" suffix (required by yfinance) to every symbol,
    skipping any that already have it. Also de-duplicates while
    preserving order, in case the source list has repeats.
    """
    seen = set()
    normalized = []
    for symbol in symbols:
        symbol = symbol.strip().upper()
        if not symbol.endswith(".NS"):
            symbol += ".NS"
        if symbol not in seen:
            seen.add(symbol)
            normalized.append(symbol)
    return normalized


def get_candidate_universe() -> list[str]:
    """
    Return the list of stock symbols to analyze this request.

    MVP: returns the static NIFTY_500_SYMBOLS list, normalized to
    yfinance-compatible ".NS" tickers.

    --------------------------------------------------------------
    FUTURE SCREENER HOOK:
    To replace this with a dynamic screener, swap the body below for
    a call to a screener service, e.g.:

        def get_candidate_universe() -> list[str]:
            symbols = screener.get_top_gainers(limit=100)
            # or: screener.get_high_volume(limit=100)
            # or: screener.get_momentum_breakouts(limit=100)
            return normalize_universe(symbols)

    ranking.py and everything downstream only depends on this
    function returning list[str] — no other code needs to change.
    --------------------------------------------------------------
    """
    return normalize_universe(NIFTY_500_SYMBOLS)
