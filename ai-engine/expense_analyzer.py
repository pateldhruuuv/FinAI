import pandas as pd
import numpy as np
import io
import base64
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

def generate_expense_analysis(transactions):
    """
    Performs analytical aggregations (Top Merchants, Categories, Daily/Weekly spend, Cash Flow)
    and returns a summary JSON along with Seaborn-generated chart plots encoded in base64.
    """
    if not transactions:
        return {
            "summary": {},
            "charts": {}
        }
        
    df = pd.DataFrame(transactions)
    if df.empty:
        return {
            "summary": {},
            "charts": {}
        }
        
    # Ensure types
    df["amount"] = df["amount"].astype(float)
    df["date"] = pd.to_datetime(df["date"])
    
    # 1. Total Metrics
    income_df = df[df["transactionType"] == "Credit"]
    expense_df = df[df["transactionType"] == "Debit"]
    
    total_income = float(income_df["amount"].sum())
    total_expenses = float(expense_df["amount"].sum())
    savings = max(total_income - total_expenses, 0.0)
    
    # Span of statement
    min_date = df["date"].min()
    max_date = df["date"].max()
    days_span = max((max_date - min_date).days, 1)
    
    avg_daily_spend = total_expenses / days_span
    
    # 2. Top Merchants (Debits only)
    top_merch = []
    if not expense_df.empty:
        merchant_group = expense_df.groupby("merchant")["amount"].sum().reset_index()
        merchant_group = merchant_group.sort_values(by="amount", ascending=False).head(5)
        for _, row in merchant_group.iterrows():
            top_merch.append({"merchant": row["merchant"], "amount": float(row["amount"])})
            
    # 3. Top Categories (Debits only)
    top_cats = []
    if not expense_df.empty:
        category_group = expense_df.groupby("category")["amount"].sum().reset_index()
        category_group = category_group.sort_values(by="amount", ascending=False).head(5)
        for _, row in category_group.iterrows():
            top_cats.append({"category": row["category"], "amount": float(row["amount"])})
            
    # 4. Monthly Spending & Cash Flow
    df["Month"] = df["date"].dt.strftime("%Y-%m")
    monthly_flow = []
    
    months = df["Month"].unique()
    months = sorted(months)
    
    for m in months:
        m_df = df[df["Month"] == m]
        m_inc = float(m_df[m_df["transactionType"] == "Credit"]["amount"].sum())
        m_exp = float(m_df[m_df["transactionType"] == "Debit"]["amount"].sum())
        monthly_flow.append({
            "month": m,
            "income": m_inc,
            "expenses": m_exp,
            "savings": max(m_inc - m_exp, 0.0)
        })
        
    # 5. Weekly Spending (Last 8 weeks if span covers it, otherwise all weeks)
    naive_date = df["date"].dt.tz_localize(None) if df["date"].dt.tz is not None else df["date"]
    df["Week"] = naive_date.dt.to_period('W').dt.strftime('%Y-W%U')
    weekly_group = df[df["transactionType"] == "Debit"].groupby("Week")["amount"].sum().reset_index()
    weekly_spending = weekly_group.sort_values(by="Week").tail(8).to_dict(orient="records")
    weekly_spending_cleaned = [{"week": r["Week"], "amount": float(r["amount"])} for r in weekly_spending]
    
    # 6. Generate base64 charts using Seaborn / Matplotlib
    charts = {}
    
    # Chart 1: Category Breakdown (Donut Chart)
    if not expense_df.empty:
        try:
            fig, ax = plt.subplots(figsize=(6, 5))
            fig.patch.set_facecolor('none')
            ax.set_facecolor('none')
            
            cat_data = expense_df.groupby("category")["amount"].sum().reset_index()
            cat_data = cat_data.sort_values(by="amount", ascending=False)
            
            colors = ['#ff6b35', '#918cff', '#ffb59d', '#10b981', '#c4c0ff', '#f43f5e', '#a855f7', '#3b82f6', '#eab308']
            colors = colors[:len(cat_data)]
            
            patches, texts, autotexts = ax.pie(
                cat_data["amount"], 
                labels=cat_data["category"], 
                autopct='%1.1f%%', 
                startangle=140,
                colors=colors,
                wedgeprops=dict(width=0.4, edgecolor='none')
            )
            for t in texts:
                t.set_color('#cbd5e1')
                t.set_fontsize(8)
            for t in autotexts:
                t.set_color('white')
                t.set_fontsize(8)
                t.set_weight('bold')
                
            ax.set_title("Expense Breakdown by Category", color='white', fontsize=12, pad=15)
            plt.tight_layout()
            
            buf = io.BytesIO()
            plt.savefig(buf, format="png", dpi=100, transparent=True)
            buf.seek(0)
            charts["category_pie"] = base64.b64encode(buf.read()).decode("utf-8")
            plt.close()
        except Exception as e:
            print(f"Failed to generate category pie chart: {e}")
            
    # Chart 2: Monthly Cash Flow (Bar Chart)
    if monthly_flow:
        try:
            m_labels = [x["month"] for x in monthly_flow]
            incomes = [x["income"] for x in monthly_flow]
            expenses = [x["expenses"] for x in monthly_flow]
            
            x = np.arange(len(m_labels))
            width = 0.35
            
            fig, ax = plt.subplots(figsize=(7, 4.5))
            fig.patch.set_facecolor('none')
            ax.set_facecolor('none')
            
            rects1 = ax.bar(x - width/2, incomes, width, label='Income', color='#10b981')
            rects2 = ax.bar(x + width/2, expenses, width, label='Expenses', color='#f43f5e')
            
            ax.set_title('Monthly Income vs Expenses (Cash Flow)', color='white', fontsize=12, pad=15)
            ax.set_xticks(x)
            ax.set_xticklabels(m_labels, rotation=45, color='#cbd5e1', fontsize=8)
            ax.tick_params(colors='#e3e2e2', labelsize=8)
            ax.spines['bottom'].set_color('#594139')
            ax.spines['left'].set_color('#594139')
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.xaxis.label.set_color('#e3e2e2')
            ax.yaxis.label.set_color('#e3e2e2')
            
            leg = ax.legend()
            if leg:
                for text in leg.get_texts():
                    text.set_color('#cbd5e1')
                leg.get_frame().set_facecolor('none')
                leg.get_frame().set_edgecolor('#594139')
                
            plt.tight_layout()
            
            buf = io.BytesIO()
            plt.savefig(buf, format="png", dpi=100, transparent=True)
            buf.seek(0)
            charts["cash_flow_bar"] = base64.b64encode(buf.read()).decode("utf-8")
            plt.close()
        except Exception as e:
            print(f"Failed to generate cash flow chart: {e}")

            
    analysis_results = {
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "total_savings": round(savings, 2),
        "days_span": days_span,
        "avg_daily_spend": round(avg_daily_spend, 2),
        "top_merchants": top_merch,
        "top_categories": top_cats,
        "monthly_cash_flow": monthly_flow,
        "weekly_spending": weekly_spending_cleaned,
        "charts": charts
    }
    
    return analysis_results
