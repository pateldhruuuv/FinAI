"""
sentiment.py

Fetches recent news for a stock and asks an LLM to classify the overall
sentiment. The LLM is strictly a sentiment classifier here — it is
never asked for, and must never give, a buy/sell/hold opinion. That
decision belongs entirely to ranking.py.

Entry point: get_news_sentiment(symbol_or_name) -> dict
"""

import json
import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)

NEWS_API_KEY = os.environ.get("NEWS_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

NEWS_API_URL = "https://newsapi.org/v2/everything"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
GEMINI_MODEL = "gemini-3.5-flash"

MAX_HEADLINES = 10
REQUEST_TIMEOUT_SECONDS = 10

SYSTEM_PROMPT = (
    "You are a financial news sentiment classifier. You analyze a list "
    "of recent news headlines about a stock and report ONLY the overall "
    "sentiment. You must NEVER recommend buying, selling, or holding "
    "the stock, and you must NEVER give investment advice — that is "
    "handled by a separate system. Respond ONLY with a single JSON "
    "object and nothing else, no markdown fences, no preamble, in "
    "exactly this shape: "
    '{"sentiment": "Positive|Neutral|Negative", "score": <0-100 integer>, '
    '"summary": "<one sentence, neutral factual tone, no advice>"}'
)

NEUTRAL_FALLBACK = {
    "sentiment": "Neutral",
    "score": 50,
    "summary": "News sentiment could not be determined at this time.",
    "headlines": [],
}


def _fetch_headlines(query: str) -> list[str]:
    """
    Fetch recent news for the given query and return a list of
    "title: description" strings. Returns an empty list on any
    failure so the caller can fall back gracefully.
    """
    if not NEWS_API_KEY:
        logger.warning("NEWS_API_KEY not set; skipping news fetch.")
        return []

    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": MAX_HEADLINES,
        "apiKey": NEWS_API_KEY,
    }

    try:
        response = requests.get(
            NEWS_API_URL, params=params, timeout=REQUEST_TIMEOUT_SECONDS
        )
        response.raise_for_status()
        articles = response.json().get("articles", [])
    except Exception as exc:
        logger.warning("Failed to fetch news for %s: %s", query, exc)
        return []

    headlines = []
    for article in articles:
        title = (article.get("title") or "").strip()
        description = (article.get("description") or "").strip()
        if not title:
            continue
        headline = f"{title}: {description}" if description else title
        headlines.append(headline)

    return headlines[:MAX_HEADLINES]


def _classify_sentiment(headlines: list[str], api_key: Optional[str] = None) -> Optional[dict]:
    """
    Send headlines to the Gemini LLM and parse its sentiment classification.
    Returns None on any failure (missing key, network error, bad JSON)
    so the caller can fall back gracefully.
    """
    key = api_key or GEMINI_API_KEY
    if not key:
        logger.warning("GEMINI_API_KEY not set; skipping LLM sentiment call.")
        return None

    if not headlines:
        return None

    headlines_text = "\n".join(f"- {h}" for h in headlines)
    user_message = f"Headlines:\n{headlines_text}"
    prompt = f"{SYSTEM_PROMPT}\n\nInput:\n{user_message}"

    payload = {
        "model": GEMINI_MODEL,
        "input": prompt,
    }
    headers = {
        "x-goog-api-key": key,
        "content-type": "application/json",
    }

    try:
        response = requests.post(
            GEMINI_API_URL,
            json=payload,
            headers=headers,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        data = response.json()
        
        raw_text = ""
        if "output_text" in data:
            raw_text = data["output_text"]
        elif "steps" in data:
            model_output = next((step for step in data["steps"] if step.get("type") == "model_output"), None)
            if model_output and "content" in model_output:
                text_part = next((part for part in model_output["content"] if part.get("type") == "text"), None)
                if text_part:
                    raw_text = text_part.get("text", "")
        
        raw_text = raw_text.strip()
    except Exception as exc:
        logger.warning("Gemini sentiment call failed: %s", exc)
        return None

    # Strip accidental markdown fences before parsing, just in case.
    cleaned = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Could not parse Gemini sentiment response: %s", raw_text)
        return None

    sentiment_val = parsed.get("sentiment")
    score_val = parsed.get("score")
    summary_val = parsed.get("summary")

    if sentiment_val not in {"Positive", "Neutral", "Negative"}:
        return None
    if not isinstance(score_val, (int, float)) or not (0 <= score_val <= 100):
        return None

    return {
        "sentiment": sentiment_val,
        "score": int(score_val),
        "summary": summary_val or "",
    }


def get_news_sentiment(symbol_or_name: str, api_key: Optional[str] = None) -> dict:
    """
    Main entry point: fetch recent news for a stock and return its
    overall sentiment.

    Always returns a well-formed dict, even on total failure (no news
    found, NewsAPI down, LLM call fails) — callers never need to
    special-case this function.
    """
    headlines = _fetch_headlines(symbol_or_name)

    if not headlines:
        return {**NEUTRAL_FALLBACK, "headlines": []}

    classification = _classify_sentiment(headlines, api_key=api_key)

    if classification is None:
        return {**NEUTRAL_FALLBACK, "headlines": headlines}

    return {
        "sentiment": classification["sentiment"],
        "score": classification["score"],
        "summary": classification["summary"],
        "headlines": headlines,
    }
