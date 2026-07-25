import os
import pickle
import re
import math
import shutil
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64

# Import Statement Parser & Expense Analyzer components
from statement_parser import parse_statement_file
from normalizer import normalize_transactions
from subscription_detector import detect_subscriptions, detect_recurring_payments
from expense_analyzer import generate_expense_analysis
from merchant_learning import save_correction

app = FastAPI(title="FinPilot AI Engine", version="1.0.0")

# Enable CORS for communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request schemas
class HealthPredictionRequest(BaseModel):
    age: int = Field(..., ge=18, le=120)
    income: float = Field(..., ge=0)
    expenses: float = Field(..., ge=0)
    savings: float = Field(..., ge=0)
    debt: float = Field(..., ge=0)

class InvestmentRequest(BaseModel):
    age: int = Field(..., ge=18, le=120)
    income: float = Field(..., ge=0)
    savings: float = Field(..., ge=0)
    risk_profile: str = Field(..., description="Conservative, Moderate, Aggressive")

class InsuranceRequest(BaseModel):
    age: int = Field(..., ge=18, le=120)
    income: float = Field(..., ge=0)
    dependents: int = Field(..., ge=0)
    marital_status: str = Field(..., description="Single, Married")

class ChatRequest(BaseModel):
    message: str

class RetirementRequest(BaseModel):
    current_age: int = Field(..., ge=18, le=100)
    retirement_age: int = Field(..., ge=18, le=100)
    current_savings: float = Field(..., ge=0)
    monthly_investment: float = Field(..., ge=0)
    monthly_expenses: float = Field(..., ge=0)

class TransactionItem(BaseModel):
    date: str
    description: str
    category: str
    amount: float
    type: str

class ForecastRequest(BaseModel):
    transactions: list[TransactionItem]
    monthly_income: float

class SpendingInsightsRequest(BaseModel):
    transactions: list[TransactionItem]

# Helper to load pickled models
models = {}
market_trends = {}

INVESTMENT_PRODUCTS = {
    "Cash_FD": [
        {"name": "Unity Small Finance Bank", "rate": "9.0% p.a.", "type": "High Yield FD"},
        {"name": "IndusInd Bank", "rate": "7.75% p.a.", "type": "Regular Bank FD"},
        {"name": "HDFC Bank / SBI", "rate": "7.10% p.a.", "type": "Safe/Systemic FD"},
        {"name": "Aditya Birla Sun Life Liquid Fund", "rate": "Approx. 6.8% p.a.", "type": "Liquid Mutual Fund"}
    ],
    "Bonds_Debt": [
        {"name": "Government Securities (G-Secs)", "yield": "6.76% p.a. (Elevated)", "type": "Sovereign Risk-Free"},
        {"name": "Sovereign Gold Bonds (SGB)", "yield": "2.5% p.a. + Gold price gain", "type": "Sovereign Gold Debt"},
        {"name": "HDFC Medium Term Debt Fund", "yield": "Approx. 7.5% - 8.0% p.a.", "type": "Corporate Debt Fund"}
    ],
    "Equities": [
        {"name": "UTI Nifty 50 Index Fund (Direct)", "expense_ratio": "0.21%", "type": "Large Cap Index Fund"},
        {"name": "Parag Parikh Flexi Cap Fund", "expense_ratio": "0.62%", "type": "Diversified Equity Fund"},
        {"name": "Nifty Next 50 ETF (Junior BeES)", "expense_ratio": "0.15%", "type": "Junior Equity Index ETF"}
    ]
}

INSURANCE_PRODUCTS = {
    "Term_Life": [
        {"provider": "HDFC Life Click 2 Protect", "claim_ratio": "99.5%", "key_feature": "Accident Rider included"},
        {"provider": "Max Life Smart Secure Plus", "claim_ratio": "99.65%", "key_feature": "Premium back option"},
        {"provider": "LIC Tech Term", "claim_ratio": "98.6%", "key_feature": "Strongest trust & network"}
    ],
    "Health_Insurance": [
        {"plan": "Care Advantage (Care Health)", "sum_insured": "₹1 Crore", "key_feature": "No claim bonus up to 150%"},
        {"plan": "Niva Bupa ReAssure 2.0", "sum_insured": "₹10L - ₹1Cr", "key_feature": "Unlimited lock-in restoration"},
        {"plan": "HDFC Ergo Optima Secure", "sum_insured": "₹5L - ₹2Cr", "key_feature": "2x coverage from day one"}
    ]
}

def load_market_trends():
    global market_trends
    import json
    try:
        trends_path = os.path.join(os.path.dirname(__file__), "data", "market_trends.json")
        if os.path.exists(trends_path):
            with open(trends_path, "r") as f:
                market_trends = json.load(f)
            print("Loaded SEBI Market Trends Successfully")
        else:
            print("Market trends file not found, using empty defaults")
    except Exception as e:
        print(f"Error loading market trends: {e}")

def load_models():
    model_paths = {
        "health": "models/health_model.pkl",
        "invest_short": "models/investment_short_model.pkl",
        "invest_long": "models/investment_long_model.pkl",
        "ins_health": "models/insurance_health_model.pkl",
        "ins_term": "models/insurance_term_model.pkl",
        "ins_accident": "models/insurance_accident_model.pkl",
        "ins_coverage": "models/insurance_coverage_model.pkl",
    }
    
    for key, path in model_paths.items():
        if os.path.exists(path):
            with open(path, "rb") as f:
                models[key] = pickle.load(f)
            print(f"Loaded {path}")
        else:
            print(f"Model path {path} not found! Please run train.py first.")

@app.on_event("startup")
def startup_event():
    load_models()
    load_market_trends()

@app.get("/")
def read_root():
    return {"status": "success", "message": "FinPilot AI Engine is running!"}

@app.post("/predict-health")
def predict_health(data: HealthPredictionRequest):
    if "health" not in models:
        raise HTTPException(status_code=503, detail="Health model is not loaded. Run train.py.")
    
    # Input format: Age, Income, Expenses, Savings, Debt
    input_df = pd.DataFrame([{
        "Age": data.age,
        "Income": data.income,
        "Expenses": data.expenses,
        "Savings": data.savings,
        "Debt": data.debt
    }])
    
    prediction = models["health"].predict(input_df)[0]
    
    # Generate action plan based on result
    suggestions = []
    if prediction == "Healthy":
        suggestions = [
            "Great job maintaining solid savings! Consider allocating surplus funds to equities or mutual funds.",
            "Maintain your emergency fund at current levels and review short-term bond rates.",
            "Ensure you review insurance coverage as your net worth grows."
        ]
    elif prediction == "Moderate":
        suggestions = [
            "Aim to reduce non-essential expenses to increase your savings ratio above 30%.",
            "Try to compile an emergency fund that covers at least 3-6 months of expenses.",
            "Consolidate and pay down high-interest debt progressively."
        ]
    else: # Risky
        suggestions = [
            "CRITICAL: Your monthly expenses exceed or are extremely close to your income. Draw a strict budget immediately.",
            "Prioritize building a basic emergency fund of at least 1 month's expenses.",
            "Avoid taking on new debt and focus on high-interest debt snowball paydowns."
        ]
        
    return {
        "status": "success",
        "prediction": prediction,
        "suggestions": suggestions
    }

@app.post("/recommend-investment")
def recommend_investment(data: InvestmentRequest):
    if "invest_short" not in models or "invest_long" not in models:
        raise HTTPException(status_code=503, detail="Investment models are not loaded. Run train.py.")
    
    risk_mapping = {"Conservative": 0, "Moderate": 1, "Aggressive": 2}
    risk_val = risk_mapping.get(data.risk_profile.capitalize(), 1)  # Default to Moderate
    
    input_df = pd.DataFrame([{
        "Age": data.age,
        "Income": data.income,
        "Savings": data.savings,
        "RiskProfileEncoded": risk_val
    }])
    
    short_term = models["invest_short"].predict(input_df)[0]
    long_term = models["invest_long"].predict(input_df)[0]
    
    # Generate allocation recommendations
    allocations = {}
    if data.risk_profile.capitalize() == "Conservative":
        allocations = {"Cash/FD": "60%", "Bonds/Debt": "30%", "Equity": "10%"}
    elif data.risk_profile.capitalize() == "Moderate":
        allocations = {"Cash/FD": "30%", "Bonds/Debt": "30%", "Equity": "40%"}
    else:  # Aggressive
        allocations = {"Cash/FD": "10%", "Bonds/Debt": "15%", "Equity": "75%"}
        
    # Generate dynamic SEBI trend suggestions
    nifty_pe = market_trends.get("nifty_pe_ratio", 22.1)
    nifty_pe_prev = market_trends.get("nifty_pe_previous_year", 24.2)
    gsec_yield = market_trends.get("bond_gsec_10y_yield", 6.76)
    bullion_grow = market_trends.get("bullion_index_mom_growth", 13.2)
    bullion_streak = market_trends.get("bullion_growth_streak_months", 12)
    
    suggestions = []
    
    # Gold allocation suggestions
    suggestions.append(
        f"Gold ETFs / SGBs are highly recommended. SEBI statistics note that the Bullion index rose {bullion_grow}% "
        f"last month, continuing a stellar {bullion_streak}-month consecutive growth streak."
    )
    
    # Debt allocation suggestions
    suggestions.append(
        f"For fixed income, lock in 10-year Indian Government Bonds (G-Secs) yielding a stable {gsec_yield}% p.a."
    )
    
    # Equity allocation suggestions
    if data.risk_profile.capitalize() in ["Moderate", "Aggressive"]:
        suggestions.append(
            f"Equities are attractive. The Nifty trailing P/E ratio has corrected to {nifty_pe} (down from {nifty_pe_prev} last year), "
            "representing a safer entry point for Index and Flexi Cap Mutual Funds."
        )
        suggestions.append("Sectoral recommendation: Add a small allocation to Metals (Nifty Metal index outperformed by +8.5%).")
    else:
        suggestions.append(
            "Stick to a small, defensive equity allocation via Large Cap Nifty 50 Index funds."
        )
        
    # Passive income strategies based on income source request
    passive_strategies = [
        "REITs Allocation: Invest 15% of your portfolio in high-yield Real Estate Investment Trusts (e.g. Embassy Office Parks REIT) to generate a stable 6.5% - 7.5% annual dividend payout.",
        "Dividend SIP: Build a monthly Systematic Investment Plan in a Dividend Yield Mutual Fund to establish a steady cash flow stream."
    ]

    return {
        "status": "success",
        "short_term": short_term,
        "long_term": long_term,
        "recommended_allocations": allocations,
        "suggestions": suggestions,
        "passive_income_strategies": passive_strategies,
        "concrete_options": INVESTMENT_PRODUCTS
    }

@app.post("/recommend-insurance")
def recommend_insurance(data: InsuranceRequest):
    required_models = ["ins_health", "ins_term", "ins_accident", "ins_coverage"]
    for m in required_models:
        if m not in models:
            raise HTTPException(status_code=503, detail="Insurance models are not loaded. Run train.py.")
            
    marital_val = 1 if data.marital_status.capitalize() == "Married" else 0
    
    input_df = pd.DataFrame([{
        "Age": data.age,
        "Income": data.income,
        "Dependents": data.dependents,
        "MaritalStatusEncoded": marital_val
    }])
    
    health_ins = models["ins_health"].predict(input_df)[0]
    term_ins = models["ins_term"].predict(input_df)[0]
    accident_ins = models["ins_accident"].predict(input_df)[0]
    coverage_amt = float(models["ins_coverage"].predict(input_df)[0])
    
    # Round coverage amount nicely
    coverage_amt = round(coverage_amt / 100000) * 100000
    
    recommendations = []
    if health_ins != "None":
        recommendations.append(f"{health_ins} Health Insurance (Recommended to safeguard against medical emergencies)")
    if term_ins == "Yes":
        recommendations.append("Term Insurance (Highly recommended to secure your family's future)")
    if accident_ins == "Yes":
        recommendations.append("Accident Insurance (Recommended to cover disability or sudden accidental loss)")
        
    return {
        "status": "success",
        "health_insurance_level": health_ins,
        "term_insurance_recommended": term_ins,
        "accident_insurance_recommended": accident_ins,
        "suggested_coverage_amount": coverage_amt,
        "recommendations_summary": recommendations,
        "concrete_options": INSURANCE_PRODUCTS
    }

@app.post("/chat")
def chat(data: ChatRequest):
    msg = data.message.lower().strip()
    
    # 1. Ask about investment
    if any(keyword in msg for keyword in ["invest", "investment", "investing", "where to put money"]):
        reply = (
            "Investing is crucial for long-term wealth creation. I recommend checking our **Investment Advisor** page. "
            "It uses a Decision Tree model to recommend Short-Term assets (like Fixed Deposits or Debt Funds) and "
            "Long-Term assets (like Index Funds, Hybrid Mutual Funds, or direct Equity) based on your risk profile (Conservative, Moderate, Aggressive)."
        )
    # 2. Ask about saving
    elif any(keyword in msg for keyword in ["save", "saving", "savings", "budget", "spend less"]):
        reply = (
            "Savings are the foundation of financial health. A classic rule of thumb is the 50/30/20 rule: "
            "50% for Needs, 30% for Wants, and 20% for Savings. Try to maintain a Savings Ratio above 30%. "
            "You can upload your statement CSV in the **Upload Statement** page to visualize your savings and expense breakdown!"
        )
    # 3. Ask about insurance
    elif any(keyword in msg for keyword in ["insurance", "insure", "health insurance", "term plan"]):
        reply = (
            "Insurance helps you protect against unexpected setbacks. "
            "Generally, you need: \n"
            "1. **Health Insurance** (to cover medical emergencies)\n"
            "2. **Term Insurance** (if you have dependents, to secure their future)\n"
            "3. **Accident/Disability Insurance**.\n"
            "Go to our **Insurance Advisor** page to compute your custom coverage amount!"
        )
    # 4. Greeting
    elif any(keyword in msg for keyword in ["hi", "hello", "hey", "greetings", "finpilot"]):
        reply = (
            "Hello! I am your FinPilot AI assistant. How can I help you today? You can ask me questions like: "
            "'Can I invest?', 'Should I save more?', or 'What insurance should I buy?'"
        )
    # 5. Fallback response
    else:
        reply = (
            "I'm here to guide you on basic financial planning. Try asking questions like:\n"
            "- *'Can I invest?'* to learn about asset options.\n"
            "- *'Should I save more?'* for savings ratio rules of thumb.\n"
            "- *'What insurance should I buy?'* for risk protection advice."
        )
        
    return {
        "status": "success",
        "reply": reply
    }

@app.post("/retirement-plan")
def calculate_retirement_plan(data: RetirementRequest):
    years_left = max(data.retirement_age - data.current_age, 1)
    
    # Simulate compounded savings growth year-by-year with 8% compound annual return
    corpus = data.current_savings
    corpus_history = []
    
    for t in range(years_left + 1):
        corpus_history.append(corpus)
        corpus = corpus * 1.08 + data.monthly_investment * 12

    # Fit linear regression model
    X = np.array(range(years_left + 1)).reshape(-1, 1)
    y = np.array(corpus_history)
    
    reg = LinearRegression()
    reg.fit(X, y)
    
    # Predict projected corpus at retirement age
    projected_corpus = float(reg.predict([[years_left]])[0])
    
    # Required corpus: inflation-adjusted (6%) monthly expenses * 12 * 25 years
    future_monthly_expenses = data.monthly_expenses * (1.06 ** years_left)
    required_corpus = future_monthly_expenses * 12 * 25
    
    gap = required_corpus - projected_corpus
    gap_status = "Shortfall" if gap > 0 else "On Track"
    
    return {
        "status": "success",
        "projected_corpus": round(projected_corpus, 2),
        "required_corpus": round(required_corpus, 2),
        "gap": round(gap, 2),
        "gap_status": gap_status,
        "years_left": years_left,
        "compounded_projection": [round(c, 2) for c in corpus_history]
    }

@app.post("/forecast")
def get_financial_forecast(data: ForecastRequest):
    txs = data.transactions
    
    # If no transactions or not enough history, generate synthetic monthly history (past 6 months)
    if len(txs) < 5:
        avg_exp = data.monthly_income * 0.65
        avg_inc = data.monthly_income
        
        # Introduce reproducibility seed
        np.random.seed(42)
        monthly_exp = [avg_exp * (1 + np.random.uniform(-0.1, 0.1)) for _ in range(6)]
        monthly_inc = [avg_inc * (1 + np.random.uniform(-0.05, 0.05)) for _ in range(6)]
        monthly_sav = [max(i - e, 0) for i, e in zip(monthly_inc, monthly_exp)]
    else:
        df = pd.DataFrame([t.dict() for t in txs])
        df['date'] = pd.to_datetime(df['date'])
        naive_date = df['date'].dt.tz_localize(None) if df['date'].dt.tz is not None else df['date']
        df['month'] = naive_date.dt.to_period('M')
        
        monthly_grp = df.groupby(['month', 'type'])['amount'].sum().unstack(fill_value=0)
        
        if 'Credit' not in monthly_grp.columns:
            monthly_grp['Credit'] = data.monthly_income
        if 'Debit' not in monthly_grp.columns:
            monthly_grp['Debit'] = 0.0
            
        monthly_exp = monthly_grp['Debit'].tolist()
        monthly_inc = monthly_grp['Credit'].tolist()
        monthly_sav = (monthly_grp['Credit'] - monthly_grp['Debit']).clip(lower=0).tolist()
        
        if len(monthly_exp) < 6:
            pad_len = 6 - len(monthly_exp)
            avg_exp = np.mean(monthly_exp) if len(monthly_exp) > 0 else data.monthly_income * 0.65
            avg_inc = np.mean(monthly_inc) if len(monthly_inc) > 0 else data.monthly_income
            
            for _ in range(pad_len):
                monthly_exp.insert(0, avg_exp * (1 + np.random.uniform(-0.08, 0.08)))
                monthly_inc.insert(0, avg_inc * (1 + np.random.uniform(-0.05, 0.05)))
                monthly_sav.insert(0, max(monthly_inc[0] - monthly_exp[0], 0))

    # Fit regression models
    n_months = len(monthly_exp)
    X = np.array(range(n_months)).reshape(-1, 1)
    
    reg_exp = LinearRegression()
    reg_exp.fit(X, np.array(monthly_exp))
    
    reg_sav = LinearRegression()
    reg_sav.fit(X, np.array(monthly_sav))
    
    # Predict 3M, 6M, 12M
    exp_3m = max(float(reg_exp.predict([[n_months + 3]])[0]), 0)
    exp_6m = max(float(reg_exp.predict([[n_months + 6]])[0]), 0)
    exp_12m = max(float(reg_exp.predict([[n_months + 12]])[0]), 0)
    
    sav_3m = max(float(reg_sav.predict([[n_months + 3]])[0]), 0)
    sav_6m = max(float(reg_sav.predict([[n_months + 6]])[0]), 0)
    sav_12m = max(float(reg_sav.predict([[n_months + 12]])[0]), 0)
    
    historical_months = [f"Month -{n_months - i - 1}" for i in range(n_months)]
    
    return {
        "status": "success",
        "expenses_forecast": {
            "3M": round(exp_3m, 2),
            "6M": round(exp_6m, 2),
            "12M": round(exp_12m, 2)
        },
        "savings_forecast": {
            "3M": round(sav_3m, 2),
            "6M": round(sav_6m, 2),
            "12M": round(sav_12m, 2)
        },
        "historical_expenses": [round(e, 2) for e in monthly_exp],
        "historical_savings": [round(s, 2) for s in monthly_sav],
        "months": historical_months
    }

@app.post("/spending-insights")
def get_spending_insights(data: SpendingInsightsRequest):
    txs = data.transactions
    if not txs:
        return {
            "status": "success",
            "top_categories": [],
            "highest_month": "N/A",
            "average_monthly_savings": 0.0,
            "trends": [],
            "heatmap": ""
        }
        
    df = pd.DataFrame([t.dict() for t in txs])
    df['date'] = pd.to_datetime(df['date'])
    
    df_exp = df[df['type'] == 'Debit']
    
    top_cats = []
    if not df_exp.empty:
        cat_sums = df_exp.groupby('category')['amount'].sum().sort_values(ascending=False).head(5)
        for cat, amt in cat_sums.items():
            top_cats.append({"category": cat, "amount": float(amt)})
            
    highest_month = "N/A"
    if not df_exp.empty:
        df_exp['month'] = df_exp['date'].dt.strftime('%B %Y')
        month_sums = df_exp.groupby('month')['amount'].sum()
        if not month_sums.empty:
            highest_month = month_sums.idxmax()
            
    naive_date = df['date'].dt.tz_localize(None) if df['date'].dt.tz is not None else df['date']
    df['month'] = naive_date.dt.to_period('M')
    monthly_inc = df[df['type'] == 'Credit'].groupby('month')['amount'].sum()
    monthly_exp = df[df['type'] == 'Debit'].groupby('month')['amount'].sum()
    
    all_months = df['month'].unique()
    monthly_savs = []
    for m in all_months:
        inc = monthly_inc.get(m, 0.0)
        exp = monthly_exp.get(m, 0.0)
        monthly_savs.append(max(inc - exp, 0.0))
        
    avg_savings = float(np.mean(monthly_savs)) if monthly_savs else 0.0
    
    trends = []
    sorted_months = sorted(all_months)
    for m in sorted_months:
        trends.append({
            "month": str(m),
            "expenses": float(monthly_exp.get(m, 0.0)),
            "income": float(monthly_inc.get(m, 0.0))
        })
        
    heatmap_base64 = ""
    if not df_exp.empty:
        try:
            df_exp['Day'] = df_exp['date'].dt.day_name()
            pivot = df_exp.pivot_table(index='category', columns='Day', values='amount', aggfunc='sum').fillna(0)
            
            days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            existing_days = [d for d in days_order if d in pivot.columns]
            pivot = pivot[existing_days]
            
            plt.figure(figsize=(7, 4.5))
            plt.style.use('dark_background')
            sns.heatmap(pivot, annot=True, fmt=".0f", cmap="magma", cbar=True, linewidths=0.5)
            plt.title("Expense Density: Category vs Day of Week", fontsize=11, color='white', pad=12)
            plt.xlabel("Day of Week", color='#94a3b8', labelpad=8)
            plt.ylabel("Category", color='#94a3b8', labelpad=8)
            plt.xticks(rotation=45, color='#cbd5e1')
            plt.yticks(color='#cbd5e1')
            plt.tight_layout()
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=100, facecolor='#111827')
            buf.seek(0)
            heatmap_base64 = base64.b64encode(buf.read()).decode('utf-8')
            plt.close()
        except Exception as e:
            print("Heatmap generation error:", e)
            plt.close()
            
    return {
        "status": "success",
        "top_categories": top_cats,
        "highest_month": highest_month,
        "average_monthly_savings": round(avg_savings, 2),
        "trends": trends,
        "heatmap": heatmap_base64
    }

# --- PHASE 3 PREMIUM API SCHEMAS & ENDPOINTS ---

class TaxOptimizerRequest(BaseModel):
    annual_income: float
    salary_basic: float
    salary_hra: float
    salary_special: float
    salary_other: float
    deductions_80c: float
    deductions_80d: float
    home_loan: float
    education_loan: float
    rent_paid: float

class LoanAdvisorRequest(BaseModel):
    income: float
    age: int
    credit_score: int = 750
    current_emi: float
    existing_loans: float

class InsuranceGapRequest(BaseModel):
    current_coverage: float
    dependents: int
    income: float

class PurchaseAdvisorRequest(BaseModel):
    item: str
    cost: float
    income: float
    savings: float
    goals_target: float
    debt: float
    emergency_fund: float
    investments: float

class WhatIfGoal(BaseModel):
    goalName: str
    targetAmount: float
    currentSavings: float

class WhatIfRequest(BaseModel):
    scenario: str
    value: float
    current_savings: float
    current_income: float
    current_expenses: float
    current_debt: float
    goals: list[WhatIfGoal] = []

class PortfolioRiskRequest(BaseModel):
    stocks: float
    mutual_funds: float
    gold: float
    fd: float
    crypto: float
    property: float

class FinancialCoachGoal(BaseModel):
    goalName: str
    targetAmount: float
    currentSavings: float

class FinancialCoachRequest(BaseModel):
    question: str
    age: int
    income: float
    expenses: float
    savings: float
    debt: float
    goals: list[FinancialCoachGoal] = []
    investments: dict = {}
    insurance: dict = {}

class DashboardPlotsRequest(BaseModel):
    portfolio: dict
    net_worth_history: list[dict]
    tax: dict
    goals: list[dict]
    investments: dict
    debt: dict
    forecast: dict


def calculate_old_regime_tax(taxable_income: float) -> float:
    if taxable_income <= 250000:
        return 0.0
    tax = 0.0
    if taxable_income <= 500000:
        tax = (taxable_income - 250000) * 0.05
        # Rebate under 87A makes tax zero up to 5L under old regime
        if taxable_income <= 500000:
            tax = 0.0
    elif taxable_income <= 1000000:
        tax = 12500 + (taxable_income - 500000) * 0.20
    else:
        tax = 12500 + 100000 + (taxable_income - 1000000) * 0.30
    return tax * 1.04


def calculate_new_regime_tax(taxable_income: float) -> float:
    # FY 2024-25 new regime slabs
    if taxable_income <= 700000:
        return 0.0
    tax = 0.0
    if taxable_income <= 300000:
        return 0.0
    elif taxable_income <= 600000:
        tax = (taxable_income - 300000) * 0.05
    elif taxable_income <= 900000:
        tax = 15000 + (taxable_income - 600000) * 0.10
    elif taxable_income <= 1200000:
        tax = 15000 + 30000 + (taxable_income - 900000) * 0.15
    elif taxable_income <= 1500000:
        tax = 15000 + 30000 + 45000 + (taxable_income - 1200000) * 0.20
    else:
        tax = 15000 + 30000 + 45000 + 60000 + (taxable_income - 1500000) * 0.30
    return tax * 1.04


@app.post("/tax-optimizer")
def get_tax_optimization(data: TaxOptimizerRequest):
    # Calculate HRA Exemption: section 10(13A)
    # Min of: 1) HRA received, 2) Rent Paid - 10% of Basic, 3) 50% of Basic (metro standard)
    hra_exemption = 0.0
    if data.salary_hra > 0 and data.rent_paid > 0:
        opt1 = data.salary_hra
        opt2 = max(data.rent_paid - (0.10 * data.salary_basic), 0)
        opt3 = 0.50 * data.salary_basic
        hra_exemption = min(opt1, opt2, opt3)

    # 80C Cap is 150,000 INR
    ded_80c = min(data.deductions_80c, 150000.0)
    # 80D Cap is 25,000 INR (non-senior)
    ded_80d = min(data.deductions_80d, 25000.0)
    # Home loan interest deduction under Section 24(b) cap 200,000
    home_ded = min(data.home_loan, 200000.0)
    # Education loan interest deduction under Section 80E (no cap)
    edu_ded = data.education_loan

    # Standard Deduction is 50,000 INR under Old Regime
    total_deductions = 50000.0 + hra_exemption + ded_80c + ded_80d + home_ded + edu_ded
    taxable_old = max(data.annual_income - total_deductions, 0)
    old_tax = calculate_old_regime_tax(taxable_old)

    # New Regime Standard Deduction is 75,000 INR
    taxable_new = max(data.annual_income - 75000.0, 0)
    new_tax = calculate_new_regime_tax(taxable_new)

    # Suggest Tax-Saving Strategies (Optimized Plan)
    # Target maximum 80C, 80D, NPS (up to 50k under 80CCD(1B))
    suggestions = []
    recommended_investments = []
    
    if data.deductions_80c < 150000:
        diff = 150000 - data.deductions_80c
        suggestions.append(f"Invest ₹{diff:,.0f} more in ELSS or PPF to maximize Section 80C deduction.")
        recommended_investments.append(f"ELSS / PPF: ₹{diff:.0f}")
    if data.deductions_80d < 25000:
        diff = 25000 - data.deductions_80d
        suggestions.append(f"Purchase Health Insurance up to ₹{diff:,.0f} to fully utilize Section 80D.")
        recommended_investments.append(f"Health Insurance: ₹{diff:.0f}")
        
    # NPS suggestion
    suggestions.append("Invest ₹50,000 in NPS (National Pension System) to claim additional deduction under Section 80CCD(1B).")
    recommended_investments.append("NPS: ₹50000")
    
    # FD tax saver suggestion
    suggestions.append("Lock in surplus funds in 5-Year Tax Saver Fixed Deposits (FDs) to claim secure 80C benefits.")

    # Calculate potential tax savings (compared to current old/new tax)
    best_current_tax = min(old_tax, new_tax)
    
    # Optimized Old Tax if they maximize deductions
    opt_deductions = 50000.0 + hra_exemption + 150000.0 + 25000.0 + home_ded + edu_ded + 50000.0
    opt_taxable_old = max(data.annual_income - opt_deductions, 0)
    opt_old_tax = calculate_old_regime_tax(opt_old_taxable := opt_taxable_old)
    
    savings = max(best_current_tax - opt_old_tax, 0.0)

    # Plot tax comparison chart
    chart_base64 = ""
    try:
        regimes = ['Old Regime', 'New Regime', 'Optimized Old']
        taxes = [old_tax, new_tax, opt_old_tax]
        
        plt.figure(figsize=(6, 4))
        plt.style.use('dark_background')
        bars = plt.bar(regimes, taxes, color=['#ef4444', '#3b82f6', '#10b981'], width=0.5, edgecolor='white', linewidth=0.7)
        plt.title("Tax Comparison & Potential Savings", fontsize=11, color='white', pad=12)
        plt.ylabel("Tax Amount (₹)", color='#94a3b8', labelpad=8)
        
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2.0, height + (max(taxes)*0.02), f"₹{height:,.0f}", ha='center', va='bottom', color='white', fontsize=9)
            
        plt.ylim(0, max(taxes) * 1.15 if max(taxes) > 0 else 1000)
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, facecolor='#111827')
        buf.seek(0)
        chart_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
    except Exception as e:
        print("Tax chart error:", e)
        plt.close()

    return {
        "status": "success",
        "taxable_income": taxable_old,
        "old_tax": round(old_tax, 2),
        "new_tax": round(new_tax, 2),
        "potential_savings": round(savings, 2),
        "suggestions": suggestions,
        "recommended_investments": recommended_investments,
        "tax_breakdown_chart": chart_base64
    }


@app.post("/loan-advisor")
def get_loan_advice(data: LoanAdvisorRequest):
    # Max EMI (50% of monthly income)
    max_emi = data.income * 0.50
    # Safe EMI (35% of monthly income)
    safe_emi = data.income * 0.35

    # Subtract current EMIs
    available_max_emi = max(max_emi - data.current_emi, 0)
    available_safe_emi = max(safe_emi - data.current_emi, 0)

    # Loan Eligibility Formulas (Present Value of Annuity)
    # P = EMI * [1 - (1+r)^-n] / r
    def pv(emi, rate, years):
        r = rate / 12.0
        n = years * 12
        if r == 0:
            return emi * n
        return emi * (1.0 - (1.0 + r)**(-n)) / r

    # Tenures & Rates
    # Personal: 3 yrs @ 12%, Car: 5 yrs @ 9%, Home: 20 yrs @ 8.5%, Edu: 7 yrs @ 10.5%
    personal_eligible = pv(available_safe_emi, 0.12, 3)
    car_eligible = pv(available_safe_emi, 0.09, 5)
    home_eligible = pv(available_safe_emi, 0.085, 20)
    education_eligible = pv(available_safe_emi, 0.105, 7)

    # Risk Assessment
    debt_burden = (data.current_emi / data.income) if data.income > 0 else 1.0
    
    if debt_burden > 0.45 or data.credit_score < 650:
        risk = "High"
    elif debt_burden > 0.20 or data.credit_score < 720:
        risk = "Medium"
    else:
        risk = "Low"

    return {
        "status": "success",
        "eligible_amount": round(home_eligible, 2),
        "maximum_emi": round(max_emi, 2),
        "safe_emi": round(safe_emi, 2),
        "loan_risk": risk,
        "breakdown": {
            "personalLoan": round(personal_eligible, 2),
            "educationLoan": round(education_eligible, 2),
            "carLoan": round(car_eligible, 2),
            "homeLoan": round(home_eligible, 2)
        }
    }


@app.post("/insurance-gap")
def get_insurance_gap(data: InsuranceGapRequest):
    # Required coverage rule of thumb: 10x Annual Income + 1.5x Annual Income per dependent
    annual_income = data.income * 12 if data.income < 1000000 else data.income # Check if monthly or annual input
    required_coverage = annual_income * (10 + 1.5 * data.dependents)
    gap = max(required_coverage - data.current_coverage, 0.0)

    # Priority Level
    if gap > (0.60 * required_coverage) and data.dependents > 0:
        priority = "Critical"
    elif gap > 0.25 * required_coverage:
        priority = "High"
    elif gap > 0.0:
        priority = "Medium"
    else:
        priority = "Low"

    best_type = "Term Life Insurance" if data.dependents > 0 else "Comprehensive Family Health Plan"

    return {
        "status": "success",
        "required_coverage": round(required_coverage, 2),
        "coverage_gap": round(gap, 2),
        "recommended_additional_coverage": round(gap, 2),
        "best_insurance_type": best_type,
        "priority_level": priority
    }


@app.post("/purchase-advisor")
def get_purchase_advice(data: PurchaseAdvisorRequest):
    # Purchase Score calculation: starts at 100, subtracts risk factors
    score = 100
    
    # 1. Cost relative to monthly income
    if data.income > 0:
        cost_income_ratio = data.cost / data.income
        if cost_income_ratio > 3.0:
            score -= 30
        elif cost_income_ratio > 1.0:
            score -= 15
        elif cost_income_ratio > 0.5:
            score -= 5
            
    # 2. Cost relative to savings minus emergency fund
    usable_savings = data.savings - data.emergency_fund
    if usable_savings <= 0:
        score -= 40
    elif data.cost > usable_savings:
        excess = data.cost - usable_savings
        # scale deduction
        score -= min(int((excess / data.cost) * 35), 35)

    # 3. Debt to income ratio
    if data.income > 0:
        debt_ratio = data.debt / data.income
        if debt_ratio > 0.40:
            score -= 25
        elif debt_ratio > 0.20:
            score -= 10

    score = max(score, 0)

    # Recommendation
    if score >= 75:
        status = "Buy"
    elif score >= 45:
        status = "Wait"
    else:
        status = "Avoid"

    # Suggest alternative options
    refurbished = f"Refurbished model estimated at ₹{data.cost * 0.65:,.0f} (saves 35%)"
    second_hand = f"Good-condition pre-owned estimated at ₹{data.cost * 0.50:,.0f} (saves 50%)"
    
    # EMI calculation: 6-month EMI at 12% p.a.
    r = 0.12 / 12
    emi_val = data.cost * r * (1+r)**6 / ((1+r)**6 - 1) if data.cost > 0 else 0
    emi = f"₹{emi_val:,.0f}/month for 6 months at 12% p.a. interest"
    
    # Better alternative suggestion
    item_lower = data.item.lower()
    if "iphone" in item_lower:
        alt = "Look for last year's base model or a premium Android flag-ship, saving up to ₹25,000."
    elif "bike" in item_lower:
        alt = "Consider a high-mileage commuter bike or public transit pass to keep transportation expenses low."
    elif "laptop" in item_lower:
        alt = "Opt for a mid-range model with upgradeable RAM rather than a top-tier premium workstation."
    else:
        alt = "Rent it first if it is for one-time use, or wait for seasonal clearance/discount events."

    return {
        "status": "success",
        "purchase_score": score,
        "status_recommendation": status,
        "suggestions": {
            "refurbishedOption": refurbished,
            "emiOption": emi,
            "secondHandOption": second_hand,
            "betterAlternative": alt
        }
    }


@app.post("/what-if")
def run_what_if_simulation(data: WhatIfRequest):
    # Simulate impacts on: Future savings, Debt, Goal delay, Investment impact
    future_savings = data.current_savings
    debt = data.current_debt
    goal_delay_months = 0
    investment_impact = 0.0

    # Base values
    monthly_savings = max(data.current_income - data.current_expenses, 0.0)

    if data.scenario == "salary_increase":
        hike = data.value # e.g. 15 for 15%
        new_income = data.current_income * (1 + hike/100.0)
        added_savings = (new_income - data.current_income) * 12 # Annual added
        future_savings += (added_savings * 3) # Projected over 3 years
        investment_impact = added_savings * 0.60 # assume 60% of raise goes to investments
        goal_delay_months = -6 # Goals accelerate by 6 months

    elif data.scenario == "job_loss":
        months_unemployed = int(data.value) if data.value > 0 else 4
        # lose income, drain savings for expenses + debt
        drain = (data.current_expenses + data.current_debt) * months_unemployed
        future_savings = max(future_savings - drain, 0.0)
        goal_delay_months = months_unemployed + 3 # delays goals significantly due to compounding loss

    elif data.scenario == "medical_emergency":
        cost = data.value
        future_savings = max(future_savings - cost, 0.0)
        if cost > data.current_savings:
            debt += (cost - data.current_savings)
        goal_delay_months = int(cost / (monthly_savings + 1)) # months needed to rebuild savings

    elif data.scenario == "marriage":
        cost = data.value
        future_savings = max(future_savings - cost, 0.0)
        if cost > data.current_savings:
            debt += (cost - data.current_savings)
        goal_delay_months = int(cost / (monthly_savings + 1)) + 2

    elif data.scenario == "child_education" or data.scenario == "buying_house" or data.scenario == "buying_car":
        cost = data.value
        future_savings = max(future_savings - (cost * 0.20), 0.0) # Assume 20% down payment
        remaining = cost * 0.80
        # Add to debt (loan)
        debt += remaining
        # Monthly EMI increase (at 9% p.a. for 10 years)
        # delays future goals
        goal_delay_months = int(remaining / 50000)

    return {
        "status": "success",
        "future_savings": round(future_savings, 2),
        "debt": round(debt, 2),
        "goal_delay_months": goal_delay_months,
        "investment_impact": round(investment_impact, 2)
    }


@app.post("/portfolio-risk")
def get_portfolio_risk(data: PortfolioRiskRequest):
    total = data.stocks + data.mutual_funds + data.gold + data.fd + data.crypto + data.property
    
    if total <= 0:
        return {
            "status": "success",
            "diversification": "Low",
            "risk_score": 0.0,
            "safe_allocation": {"cashFd": 20, "bondsDebt": 30, "equity": 40, "gold": 10},
            "high_risk_assets": [],
            "recommendations": ["Fund your portfolio to analyze assets."]
        }

    # Weights
    weights = {
        "stocks": data.stocks / total,
        "mutual_funds": data.mutual_funds / total,
        "gold": data.gold / total,
        "fd": data.fd / total,
        "crypto": data.crypto / total,
        "property": data.property / total
    }

    # Risk Score: Crypto: 95, Stocks: 75, Funds: 45, Property: 30, Gold: 15, FD: 5
    risk_score = (
        weights["crypto"] * 95 +
        weights["stocks"] * 75 +
        weights["mutual_funds"] * 45 +
        weights["property"] * 30 +
        weights["gold"] * 15 +
        weights["fd"] * 5
    )

    # Diversification Check
    max_weight = max(weights.values())
    asset_types_funded = sum(1 for w in weights.values() if w > 0.02)

    if max_weight > 0.70 or asset_types_funded <= 1:
        diversification = "Low"
    elif max_weight > 0.40 or asset_types_funded <= 3:
        diversification = "Medium"
    else:
        diversification = "High"

    # Safe Allocation recommendation values
    safe_cash_fd = total * 0.20
    safe_bonds = total * 0.30
    safe_equity = total * 0.40
    safe_gold = total * 0.10

    high_risk = []
    if weights["crypto"] > 0.05:
        high_risk.append("Cryptocurrency (exposure above recommended 5% limit)")
    if weights["stocks"] > 0.50:
        high_risk.append("Direct Stocks (high single-asset equity exposure)")

    recommendations = []
    if diversification == "Low":
        recommendations.append("Rebalance portfolio to reduce concentration risk in a single asset class.")
    if risk_score > 65:
        recommendations.append("Reduce risk by moving funds from high-volatility Crypto/Stocks into secure FDs or Debt Mutual Funds.")
    if weights["gold"] < 0.05:
        recommendations.append("Consider allocating 5-10% in Gold as a hedge against equity market shocks.")
    if not recommendations:
        recommendations.append("Your portfolio is well-balanced. Maintain periodic automated SIP rebalancing.")

    # Render pie chart
    chart_base64 = ""
    try:
        labels = []
        sizes = []
        colors = []
        
        mapping = [
            ('Stocks', data.stocks, '#ef4444'),
            ('Mutual Funds', data.mutual_funds, '#3b82f6'),
            ('Gold', data.gold, '#eab308'),
            ('Fixed Deposits', data.fd, '#10b981'),
            ('Crypto', data.crypto, '#a855f7'),
            ('Property', data.property, '#f97316')
        ]
        
        for lbl, val, col in mapping:
            if val > 0:
                labels.append(lbl)
                sizes.append(val)
                colors.append(col)
                
        plt.figure(figsize=(5, 5))
        plt.style.use('dark_background')
        plt.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors, startangle=140, textprops={'fontsize': 9, 'color': 'white'})
        plt.title("Portfolio Asset Allocation", fontsize=11, color='white', pad=12)
        plt.tight_layout()
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100, facecolor='#111827')
        buf.seek(0)
        chart_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
    except Exception as e:
        print("Portfolio pie error:", e)
        plt.close()

    return {
        "status": "success",
        "diversification": diversification,
        "risk_score": round(risk_score, 2),
        "safe_allocation": {
            "cashFd": round(safe_cash_fd, 2),
            "bondsDebt": round(safe_bonds, 2),
            "equity": round(safe_equity, 2),
            "gold": round(safe_gold, 2)
        },
        "high_risk_assets": high_risk,
        "recommendations": recommendations,
        "portfolio_chart": chart_base64
    }


@app.post("/financial-coach")
def get_financial_coach_advice(data: FinancialCoachRequest):
    q = data.question.lower().strip()
    
    # Context summary
    savings_ratio = (data.savings / data.income) if data.income > 0 else 0
    debt_ratio = (data.debt / data.income) if data.income > 0 else 0
    
    # 1. Goa Trip Affordability
    if "goa" in q or "afford" in q or "trip" in q:
        trip_cost = 25000.0
        if data.savings >= trip_cost and debt_ratio < 0.35:
            reply = (
                f"Based on your profile, **Yes, you can afford a Goa trip!** You have accumulated savings of ₹{data.savings:,.0f} "
                f"which covers the estimated ₹25,000 cost. Your debt-to-income ratio is at a manageable {debt_ratio*100:.1f}%. "
                "Enjoy the trip, but make sure to log the expense and keep at least a basic emergency fund untouched!"
            )
        else:
            suggested_wait = math.ceil((trip_cost - data.savings) / (data.income * 0.15 + 1)) if data.savings < trip_cost else 2
            reply = (
                f"I advise **postponing the trip for now**. Your current savings are ₹{data.savings:,.0f} "
                f"and your debt-to-income ratio is {debt_ratio*100:.1f}%. I recommend saving at least ₹5,000 per month for the next "
                f"{suggested_wait} months to pay for the trip in cash without incurring new debt."
            )
            
    # 2. How to save more
    elif "save" in q or "budget" in q:
        savings_pct = savings_ratio * 100
        if savings_pct >= 30:
            reply = (
                f"Excellent job! You are saving {savings_pct:.1f}% of your monthly income (₹{data.income:,.0f}). To optimize further, "
                "automate your savings through Mutual Fund SIPs on your pay day. Review your statement category details to identify "
                "recurring subscriptions or non-essential lifestyle expenses you can trim by 5-10%."
            )
        else:
            reply = (
                f"Your savings ratio is currently {savings_pct:.1f}% of income. Aim to increase this to at least 20-30% by applying the **50/30/20 budget rule**:\n"
                "- 50% for fixed Needs (Rent, Utilities, EMI)\n"
                "- 30% for flex Wants (Dining, Shopping)\n"
                "- 20% dedicated immediately to Savings.\n"
                "Try cutting down on high-spending categories like dining/ordering in and auto-debiting savings."
            )

    # 3. Should I invest now?
    elif "invest" in q or "investment" in q:
        if data.savings < data.expenses * 3:
            reply = (
                "Before investing, you should **build a strong emergency fund**. Currently, your savings are ₹"
                f"{data.savings:,.0f}, which covers less than 3 months of expenses. I recommend building a liquid reserve "
                "equal to 6 months of expenses before allocating surplus funds to volatile equity markets."
            )
        else:
            reply = (
                "**Yes, you should begin investing immediately.** You have a healthy liquid buffer. If you are new to the market, "
                "start a monthly SIP (Systematic Investment Plan) in a diversified **Nifty 50 Index Mutual Fund** or a Conservative Hybrid Fund. "
                "This dollar-cost averages your purchases and mitigates short-term market timing risks."
            )

    # 4. Should I buy insurance?
    elif "insurance" in q or "insure" in q:
        if data.goals:
            reply = (
                "**Absolutely.** Insurance is the foundation of risk management. Because you have active goals and financial dependencies, "
                "you should secure a **Term Life Insurance policy** (aim for 10-15x your annual income) to protect your family's future, "
                "along with a standalone **Family Health Insurance plan** to safeguard your investments from medical bill shocks."
            )
        else:
            reply = (
                "Yes. Even without extensive dependents, a basic **Health Insurance Policy** is critical. A single medical emergency "
                "can wipe out years of accumulated savings. Ensure you have health cover (at least ₹5-10 Lakhs) independent of your employer-provided policy."
            )

    # 5. Should I close my loan?
    elif "close" in q or "loan" in q or "debt" in q or "emi" in q:
        if debt_ratio > 0.35:
            reply = (
                f"**Yes, prioritizing loan pre-payments is highly advised.** Your monthly debt/EMI burden is {debt_ratio*100:.1f}% of income, "
                "which is high. Focus on clearing credit cards or high-interest personal loans first using the **Debt Avalanche** method "
                "(pay extra towards the highest interest rate loan first). This frees up cash flow rapidly."
            )
        else:
            reply = (
                "Since your debt burden is a safe, low level, you should compare interest rates. If your loan interest rate is under 8-9% "
                "(like a home loan), it might be better to maintain regular EMI payments and invest surplus cash in equity mutual funds "
                "which historically return 12%+ over the long term. If it's a high-interest loan (12%+), prepay it immediately."
            )

    else:
        reply = (
            f"Hello! As your AI Coach, I see you have a monthly income of ₹{data.income:,.0f}, savings of ₹{data.savings:,.0f}, and "
            f"debt obligations of ₹{data.debt:,.0f}. Ask me specific questions like: 'Can I afford Goa trip?', 'How can I save more?', "
            "'Should I invest now?', or 'Should I close my loan?' and I'll compute custom answers!"
        )

    return {
        "status": "success",
        "reply": reply
    }


@app.post("/premium-dashboard-plots")
def get_premium_dashboard_plots(data: DashboardPlotsRequest):
    # Generates multiple plots as base64 images in a single payload
    plots = {}
    
    # Helper to convert figure to base64
    def fig_to_base64(fig):
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=100, facecolor='#1f2937')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        return img_str

    plt.style.use('dark_background')

    # 1. Portfolio Pie Chart
    try:
        portfolio = data.portfolio
        labels = [k.replace('_', ' ').title() for k, v in portfolio.items() if v > 0]
        sizes = [v for k, v in portfolio.items() if v > 0]
        
        if sizes:
            fig, ax = plt.subplots(figsize=(4, 3.5))
            ax.pie(sizes, labels=labels, autopct='%1.0f%%', startangle=90, 
                   colors=['#ef4444', '#3b82f6', '#eab308', '#10b981', '#a855f7', '#f97316'])
            ax.set_title("Portfolio Breakdown", color='white', fontsize=10, pad=10)
            fig.tight_layout()
            plots["portfolio_pie"] = fig_to_base64(fig)
        else:
            plots["portfolio_pie"] = ""
    except Exception as e:
        print("Plot portfolio error:", e)
        plots["portfolio_pie"] = ""

    # 2. Net Worth Trend
    try:
        nw = data.net_worth_history
        if nw:
            months = [item["month"] for item in nw]
            net_worth = [item["assets"] - item["liabilities"] for item in nw]
            
            fig, ax = plt.subplots(figsize=(4.5, 3.5))
            ax.plot(months, net_worth, marker='o', linewidth=2, color='#10b981', label='Net Worth')
            ax.fill_between(months, net_worth, color='#10b981', alpha=0.15)
            ax.set_title("Net Worth Trend", color='white', fontsize=10)
            ax.set_ylabel("Net Worth (₹)", color='#cbd5e1', fontsize=8)
            plt.xticks(rotation=30, fontsize=8)
            plt.yticks(fontsize=8)
            fig.tight_layout()
            plots["net_worth_trend"] = fig_to_base64(fig)
        else:
            plots["net_worth_trend"] = ""
    except Exception as e:
        print("Plot net worth error:", e)
        plots["net_worth_trend"] = ""

    # 3. Tax Breakdown
    try:
        tax = data.tax
        if tax:
            fig, ax = plt.subplots(figsize=(4, 3.5))
            labels = ['Old Tax', 'New Tax', 'Optimized']
            values = [tax.get("old_tax", 0), tax.get("new_tax", 0), tax.get("optimized_tax", 0)]
            bars = ax.bar(labels, values, color=['#ef4444', '#3b82f6', '#10b981'], width=0.4)
            ax.set_title("Tax Optimization Breakdown", color='white', fontsize=10)
            ax.set_ylabel("Tax (₹)", color='#cbd5e1', fontsize=8)
            plt.yticks(fontsize=8)
            
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2.0, height + 100, f"₹{height:,.0f}", ha='center', va='bottom', color='white', fontsize=7)
                
            fig.tight_layout()
            plots["tax_breakdown"] = fig_to_base64(fig)
        else:
            plots["tax_breakdown"] = ""
    except Exception as e:
        print("Plot tax error:", e)
        plots["tax_breakdown"] = ""

    # 4. Goal Progress
    try:
        goals = data.goals
        if goals:
            names = [g["name"][:12] for g in goals[:4]] # limit to 4 goals
            progresses = [g["progress"] for g in goals[:4]]
            
            fig, ax = plt.subplots(figsize=(4.5, 3.5))
            bars = ax.barh(names, progresses, color='#8b5cf6', edgecolor='white', height=0.4)
            ax.set_title("Goal Progress Summary (%)", color='white', fontsize=10)
            ax.set_xlim(0, 100)
            plt.xticks(fontsize=8)
            plt.yticks(fontsize=8)
            
            for bar in bars:
                width = bar.get_width()
                ax.text(width + 2, bar.get_y() + bar.get_height()/2.0, f"{width}%", ha='left', va='center', color='white', fontsize=8)
                
            fig.tight_layout()
            plots["goal_progress"] = fig_to_base64(fig)
        else:
            plots["goal_progress"] = ""
    except Exception as e:
        print("Plot goals error:", e)
        plots["goal_progress"] = ""

    # 5. Investment Allocation
    try:
        investments = data.investments
        labels = [k.replace('_', ' ').title() for k, v in investments.items() if v > 0]
        values = [v for k, v in investments.items() if v > 0]
        
        if values:
            fig, ax = plt.subplots(figsize=(4, 3.5))
            ax.bar(labels, values, color='#ec4899', width=0.4)
            ax.set_title("Investment Assets (₹)", color='white', fontsize=10)
            plt.xticks(rotation=15, fontsize=8)
            plt.yticks(fontsize=8)
            fig.tight_layout()
            plots["investment_allocation"] = fig_to_base64(fig)
        else:
            plots["investment_allocation"] = ""
    except Exception as e:
        print("Plot investments error:", e)
        plots["investment_allocation"] = ""

    # 6. Debt Analysis
    try:
        debt = data.debt
        if debt:
            fig, ax = plt.subplots(figsize=(4, 3.5))
            categories = ['Income', 'Debt Payments']
            values = [debt.get("monthly_income", 0), debt.get("current_emi", 0) + debt.get("other_debts", 0)]
            ax.bar(categories, values, color=['#10b981', '#f43f5e'], width=0.4)
            ax.set_title("Debt vs Monthly Income", color='white', fontsize=10)
            ax.set_ylabel("Amount (₹)", color='#cbd5e1', fontsize=8)
            plt.yticks(fontsize=8)
            fig.tight_layout()
            plots["debt_analysis"] = fig_to_base64(fig)
        else:
            plots["debt_analysis"] = ""
    except Exception as e:
        print("Plot debt error:", e)
        plots["debt_analysis"] = ""

    # 7. Financial Forecast
    try:
        forecast = data.forecast
        if forecast:
            hist_exp = forecast.get("historical_expenses", [])
            hist_sav = forecast.get("historical_savings", [])
            
            fig, ax = plt.subplots(figsize=(4.5, 3.5))
            indices = list(range(len(hist_exp)))
            ax.plot(indices, hist_exp, label='Expenses', marker='x', color='#ef4444', linestyle='--')
            ax.plot(indices, hist_sav, label='Savings', marker='o', color='#10b981')
            ax.set_title("Historical Savings & Expenses", color='white', fontsize=10)
            ax.legend(fontsize=8, loc='upper left')
            plt.xticks(fontsize=8)
            plt.yticks(fontsize=8)
            fig.tight_layout()
            plots["financial_forecast"] = fig_to_base64(fig)
        else:
            plots["financial_forecast"] = ""
    except Exception as e:
        print("Plot forecast error:", e)
        plots["financial_forecast"] = ""

    return {
        "status": "success",
        "plots": plots
    }


# ==========================================
# STATEMENT PARSING & EXPENSE ANALYSIS ROUTES
# ==========================================

class ExpenseAnalysisRequest(BaseModel):
    transactions: list[dict]

class UpdateLearningRequest(BaseModel):
    description: str
    merchant: Optional[str] = None
    category: str

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/parse-statement")
def parse_statement(file: UploadFile = File(...)):
    # Save the file temporarily
    file_path = os.path.join(TEMP_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        df = parse_statement_file(file_path)
        if df.empty:
            raise HTTPException(status_code=400, detail="Could not parse statement file or file is empty")
            
        transactions, mapped_columns = normalize_transactions(df)
        if not transactions:
            raise HTTPException(status_code=400, detail="No transactions found or failed to normalize transactions")
            
        subscriptions = detect_subscriptions(transactions)
        recurring_expenses = detect_recurring_payments(transactions)
        
        ext = os.path.splitext(file.filename)[1].lower()
        detected_format = ext.replace(".", "").upper()
        detected_bank = df.attrs.get("detected_bank", "Generic")
        metadata = df.attrs.get("metadata", None)
        reward_points = df.attrs.get("reward_points", [])
        validations = df.attrs.get("validations", None)
        
        return {
            "transactions": transactions,
            "subscriptions": subscriptions,
            "recurring_expenses": recurring_expenses,
            "detected_bank": detected_bank,
            "detected_format": detected_format,
            "mapped_columns": mapped_columns,
            "metadata": metadata,
            "reward_points": reward_points,
            "validations": validations
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse statement in AI Engine: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/expense-analysis")
def expense_analysis(data: ExpenseAnalysisRequest):
    try:
        analysis_results = generate_expense_analysis(data.transactions)
        return {
            "status": "success",
            "data": analysis_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate expense analysis: {str(e)}")

@app.post("/update-learning")
def update_learning(data: UpdateLearningRequest):
    try:
        res = save_correction(data.description, data.merchant, data.category)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update category learning: {str(e)}")


# ==========================================
# PREMIUM STOCK ADVISOR INTEGRATION ROUTE
# ==========================================
from typing import Optional
from fastapi import Header
import stock_universe
import market_data
import indicators as stock_indicators
import ranking as stock_ranking
import sentiment as stock_sentiment
import explain as stock_explain
from schemas import RecommendationRequest as StockRecRequest, RecommendationResponse as StockRecResponse, RecommendedStock

@app.post("/recommend-stocks", response_model=StockRecResponse)
def recommend_stocks(
    request: StockRecRequest,
    x_gemini_api_key: Optional[str] = Header(default=None)
) -> StockRecResponse:
    risk_profile = request.risk_profile.value
    
    # 1. Technical Shortlist
    symbols = stock_universe.get_candidate_universe()
    if not symbols:
        raise HTTPException(status_code=503, detail="Stock universe is empty.")

    price_history = market_data.get_price_history_bulk(symbols, period="1y")
    if not price_history:
        raise HTTPException(status_code=503, detail="Market data is currently unavailable.")

    scored_technicals = []
    for symbol, df in price_history.items():
        try:
            stock_ind = stock_indicators.calculate_indicators(df)
        except Exception as exc:
            continue

        if not stock_ind:
            continue

        technical_score = stock_ranking.score_stock(stock_ind, {}, risk_profile)
        scored_technicals.append({
            "symbol": symbol,
            "indicators": stock_ind,
            "technical_score": technical_score,
        })

    scored_technicals.sort(key=lambda item: item["technical_score"], reverse=True)
    shortlist = scored_technicals[:10]

    if not shortlist:
        raise HTTPException(status_code=503, detail="No stocks had sufficient data to analyze.")

    # 2. Attach news sentiment (passing the gemini api key)
    candidates = []
    for item in shortlist:
        symbol = item["symbol"]
        company_query = symbol.replace(".NS", "")
        try:
            stock_sent = stock_sentiment.get_news_sentiment(company_query, api_key=x_gemini_api_key)
        except Exception as exc:
            stock_sent = {"sentiment": "Neutral", "score": 50, "summary": "", "headlines": []}

        candidates.append({
            "symbol": symbol,
            "indicators": item["indicators"],
            "sentiment": stock_sent,
        })

    # 3. Update scores and rank
    try:
        ranked_stocks = stock_ranking.rank_stocks(candidates, risk_profile)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to rank stocks.")

    # 4. Generate AI explanations using Gemini
    try:
        explanations = stock_explain.explain_recommendations(ranked_stocks, risk_profile, api_key=x_gemini_api_key)
    except Exception as exc:
        explanations = [
            {"symbol": s["symbol"], "summary": "Explanation unavailable.", "pros": [], "risks": []}
            for s in ranked_stocks
        ]

    explanations_by_symbol = {e["symbol"]: e for e in explanations}

    recommendations = []
    for stock in ranked_stocks:
        explanation = explanations_by_symbol.get(stock["symbol"], {})
        stock_ind = stock.get("indicators") or {}
        recommendations.append(RecommendedStock(
            symbol=stock["symbol"],
            price=stock_ind.get("latest_close"),
            price_change=stock_ind.get("price_change"),
            price_change_percent=stock_ind.get("price_change_percent"),
            score=stock["score"],
            sentiment=stock["sentiment"].get("sentiment", "Neutral"),
            summary=explanation.get("summary", ""),
            pros=explanation.get("pros", []),
            risks=explanation.get("risks", []),
        ))

    from datetime import datetime, timezone
    return StockRecResponse(
        recommendations=recommendations,
        generated_at=datetime.now(timezone.utc),
    )


