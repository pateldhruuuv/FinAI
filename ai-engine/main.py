import os
import pickle
import re
from fastapi import FastAPI, HTTPException
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
        
    return {
        "status": "success",
        "short_term": short_term,
        "long_term": long_term,
        "recommended_allocations": allocations
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
        "recommendations_summary": recommendations
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
        df['month'] = df['date'].dt.to_period('M')
        
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
            
    df['month'] = df['date'].dt.to_period('M')
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

