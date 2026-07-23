"""
explain.py

Generates a short, plain-language explanation for stocks that
ranking.py has ALREADY selected. The LLM here has no say in which
stocks appear — it only explains the reasoning behind a decision
that's already been made deterministically.

Entry point: explain_recommendations(ranked_stocks, risk_profile) -> list[dict]
"""

import json
import logging
import os

import requests

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"
GEMINI_MODEL = "gemini-3.5-flash"
REQUEST_TIMEOUT_SECONDS = 10

SYSTEM_PROMPT = (
    "You explain why a stock was already selected by a deterministic "
    "ranking system. You do NOT choose stocks, you do NOT rank stocks, "
    "and you must NEVER recommend buying, selling, or holding anything "
    "— the selection has already been made before you are called. "
    "Given a stock's technical indicators, news summary, score, and "
    "the investor's risk profile, explain in plain, simple language "
    "why this stock matched that profile. Keep it to 3 short "
    "paragraphs worth of content total: one summary sentence or two, "
    "then 2-3 short pros and 2-3 short risks. Respond ONLY with a "
    "single JSON object, no markdown fences, no preamble, in exactly "
    "this shape: "
    '{"summary": "<1-2 sentences>", "pros": ["<short phrase>", ...], '
    '"risks": ["<short phrase>", ...]}'
)

FALLBACK_SUMMARY = "This stock matched the selected risk profile based on its technical indicators and score."
FALLBACK_PROS = ["Ranked highly by the deterministic scoring engine."]
FALLBACK_RISKS = ["Detailed explanation unavailable right now — review the indicators directly."]


def _build_user_message(symbol, indicators, news_summary, score, risk_profile) -> str:
    return (
        f"Symbol: {symbol}\nRisk profile: {risk_profile}\nScore: {score}\n"
        f"Indicators: {json.dumps(indicators)}\n"
        f"News summary: {news_summary or 'No recent news available.'}"
    )


def _call_llm(user_message: str, api_key: str = None) -> dict | None:
    """Call the Gemini LLM and parse its explanation. Returns None on any
    failure so the caller can fall back gracefully."""
    key = api_key or GEMINI_API_KEY
    if not key:
        logger.warning("GEMINI_API_KEY not set; skipping explanation call.")
        return None

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
            GEMINI_API_URL, json=payload, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS
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
        logger.warning("Gemini explanation call failed: %s", exc)
        return None

    cleaned = raw_text.replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Could not parse Gemini explanation response: %s", raw_text)
        return None

    summary = parsed.get("summary")
    pros = parsed.get("pros")
    risks = parsed.get("risks")

    if not isinstance(summary, str) or not isinstance(pros, list) or not isinstance(risks, list):
        return None

    # Force every item to a string so a malformed LLM response (e.g. a
    # pros/risks list containing numbers or objects) can never cause a
    # Pydantic validation error downstream when building RecommendedStock.
    pros = [str(item) for item in pros][:5]
    risks = [str(item) for item in risks][:5]

    return {"summary": str(summary), "pros": pros, "risks": risks}


def generate_explanation(symbol: str, indicators: dict, news_summary: str, score: int, risk_profile: str, api_key: str = None) -> dict:
    """Generate an explanation for a single already-selected stock.
    Always returns {"symbol", "summary", "pros", "risks"} even if the
    LLM call fails, so callers never need to special-case this."""
    user_message = _build_user_message(symbol, indicators, news_summary, score, risk_profile)
    result = _call_llm(user_message, api_key=api_key)

    if result is None:
        result = {"summary": FALLBACK_SUMMARY, "pros": FALLBACK_PROS, "risks": FALLBACK_RISKS}

    return {
        "symbol": symbol,
        "summary": result["summary"],
        "pros": result["pros"],
        "risks": result["risks"],
    }


def explain_recommendations(ranked_stocks: list[dict], risk_profile: str, api_key: str = None) -> list[dict]:
    """Generate explanations for a list of ranked stocks, as returned
    by ranking.rank_stocks() (each item needs symbol/score/indicators/
    sentiment.summary keys)."""
    explanations = []
    for stock in ranked_stocks:
        news_summary = (stock.get("sentiment") or {}).get("summary", "")
        explanation = generate_explanation(
            symbol=stock["symbol"],
            indicators=stock.get("indicators") or {},
            news_summary=news_summary,
            score=stock.get("score", 0),
            risk_profile=risk_profile,
            api_key=api_key,
        )
        explanations.append(explanation)

    return explanations
