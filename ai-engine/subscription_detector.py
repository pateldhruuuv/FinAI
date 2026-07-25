from datetime import datetime, timedelta
import pandas as pd
import numpy as np

# Known subscription keywords (lowercase)
KNOWN_SUBSCRIPTIONS = ["netflix", "spotify", "disney+", "prime video", "apple music", "google one", "adobe", "microsoft", "youtube premium", "github copilot", "chatgpt plus", "dropbox", "canva"]

def parse_date(date_str):
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except Exception:
        try:
            return datetime.strptime(date_str[:10], "%Y-%m-%d")
        except Exception:
            return None

def detect_subscriptions(transactions):
    """
    Analyzes transactions to identify subscriptions based on:
    1. Known subscription brands.
    2. Recurring payments to same merchant with regular intervals (28-32, 85-95, 360-370 days) and low variance.
    """
    if not transactions:
        return []
        
    df = pd.DataFrame(transactions)
    if df.empty:
        return []
        
    # Standardize types and dates
    df["date_parsed"] = df["date"].apply(parse_date)
    df = df[df["date_parsed"].notna()]
    df = df[df["transactionType"] == "Debit"]
    
    if df.empty:
        return []
        
    detected = []
    
    # Group by merchant name
    grouped = df.groupby("merchant")
    
    for merchant, group in grouped:
        merchant_lower = merchant.lower()
        is_known = any(brand in merchant_lower for brand in KNOWN_SUBSCRIPTIONS)
        
        # We need at least 1 transaction if it's a known brand, or 2 if it's unknown
        min_txns = 1 if is_known else 2
        if len(group) < min_txns:
            continue
            
        # Sort group by date
        group = group.sort_values("date_parsed")
        amounts = group["amount"].astype(float).tolist()
        dates = group["date_parsed"].tolist()
        
        # Calculate intervals if there are multiple transactions
        intervals = []
        if len(dates) > 1:
            for i in range(1, len(dates)):
                intervals.append((dates[i] - dates[i-1]).days)
        
        mean_amount = np.mean(amounts)
        amount_std = np.std(amounts) if len(amounts) > 1 else 0
        amount_cv = (amount_std / mean_amount) if mean_amount > 0 else 0
        
        # Determine frequency
        frequency = "Monthly"
        days_interval = 30
        
        if intervals:
            mean_interval = np.mean(intervals)
            if 25 <= mean_interval <= 35:
                frequency = "Monthly"
                days_interval = 30
            elif 80 <= mean_interval <= 100:
                frequency = "Quarterly"
                days_interval = 90
            elif 350 <= mean_interval <= 380:
                frequency = "Yearly"
                days_interval = 365
            else:
                # If interval doesn't match standard schedules and it's not a known brand, skip
                if not is_known:
                    continue
                frequency = "Monthly"
                days_interval = 30
        else:
            # Single transaction of known brand is assumed Monthly
            frequency = "Monthly"
            days_interval = 30
            
        # Amount consistency check (allow up to 20% variation for subscriptions)
        if len(amounts) > 1 and amount_cv > 0.20 and not is_known:
            continue
            
        # Calculate costs
        monthly_cost = mean_amount
        annual_cost = mean_amount * 12
        
        if frequency == "Quarterly":
            monthly_cost = mean_amount / 3
            annual_cost = mean_amount * 4
        elif frequency == "Yearly":
            monthly_cost = mean_amount / 12
            annual_cost = mean_amount
            
        # Next renewal date
        last_date = dates[-1]
        renewal_date = last_date + timedelta(days=days_interval)
        
        # Check if renewal date is in the past, if so increment it until it's in the future (next billing date)
        now = datetime.now()
        while renewal_date < now:
            renewal_date += timedelta(days=days_interval)
            
        detected.append({
            "name": merchant,
            "frequency": frequency,
            "monthlyCost": round(monthly_cost, 2),
            "annualCost": round(annual_cost, 2),
            "renewalDate": renewal_date.strftime("%Y-%m-%d"),
            "totalSubscriptionSpending": round(sum(amounts), 2)
        })
        
    return detected

def detect_recurring_payments(transactions):
    """
    Identifies EMIs, Rent, Salary, Utilities, Mobile bills, and Insurance premiums.
    """
    if not transactions:
        return []
        
    df = pd.DataFrame(transactions)
    if df.empty:
        return []
        
    df["date_parsed"] = df["date"].apply(parse_date)
    df = df[df["date_parsed"].notna()]
    
    recurring = []
    
    # 1. Salary Detection (Credits)
    credits_df = df[df["transactionType"] == "Credit"]
    if not credits_df.empty:
        # Group by description/merchant
        salaries = credits_df[credits_df["category"] == "Salary"]
        if not salaries.empty:
            for merchant, s_group in salaries.groupby("merchant"):
                s_group = s_group.sort_values("date_parsed")
                dates = s_group["date_parsed"].tolist()
                amounts = s_group["amount"].astype(float).tolist()
                
                # We need regular salary
                frequency = "Monthly"
                last_date = dates[-1]
                due_date = last_date + timedelta(days=30)
                
                recurring.append({
                    "name": merchant,
                    "category": "Salary",
                    "amount": round(np.mean(amounts), 2),
                    "frequency": frequency,
                    "nextDueDate": due_date.strftime("%Y-%m-%d"),
                    "type": "Salary",
                    "lastPaymentDate": last_date.strftime("%Y-%m-%d")
                })
                
    # 2. Debit Recurring Payments (Rent, EMI, Utilities, Insurance)
    debits_df = df[df["transactionType"] == "Debit"]
    if not debits_df.empty:
        # Group by merchant
        for merchant, d_group in debits_df.groupby("merchant"):
            d_group = d_group.sort_values("date_parsed")
            dates = d_group["date_parsed"].tolist()
            amounts = d_group["amount"].astype(float).tolist()
            desc_lower = d_group["description"].iloc[0].lower()
            merchant_lower = merchant.lower()
            
            # Identify category type based on keywords
            rec_type = None
            category = "Bills"
            
            if any(x in desc_lower or x in merchant_lower for x in ["emi", "loan", "mortgage", "finance"]):
                rec_type = "EMI"
                category = "Bills"
            elif any(x in desc_lower or x in merchant_lower for x in ["rent", "lease"]):
                rec_type = "Rent"
                category = "Transfer"
            elif any(x in desc_lower or x in merchant_lower for x in ["insurance", "lic", "premium", "policy"]):
                rec_type = "Insurance Premium"
                category = "Insurance"
            elif any(x in desc_lower or x in merchant_lower for x in ["electricity", "power", "bescom", "bses", "tata power", "msedcl"]):
                rec_type = "Electricity Bill"
                category = "Utilities"
            elif any(x in desc_lower or x in merchant_lower for x in ["broadband", "act fibernet", "jiofiber", "airtel fiber", "internet"]):
                rec_type = "Internet Bill"
                category = "Utilities"
            elif any(x in desc_lower or x in merchant_lower for x in ["mobile recharge", "jio mobile", "airtel mobile", "vi mobile", "telecom"]):
                rec_type = "Mobile Bill"
                category = "Utilities"
            elif any(x in desc_lower or x in merchant_lower for x in ["water", "municipal water"]):
                rec_type = "Water Bill"
                category = "Utilities"
            elif any(x in desc_lower or x in merchant_lower for x in ["gas", "indane", "hp gas", "bharat gas"]):
                rec_type = "Gas Bill"
                category = "Utilities"
                
            if rec_type:
                # Need to check recurring frequency
                frequency = "Monthly"
                days_interval = 30
                
                # If multiple dates, calculate interval
                if len(dates) > 1:
                    intervals = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
                    mean_int = np.mean(intervals)
                    if 25 <= mean_int <= 35:
                        frequency = "Monthly"
                        days_interval = 30
                    elif 80 <= mean_int <= 100:
                        frequency = "Quarterly"
                        days_interval = 90
                    elif 350 <= mean_int <= 380:
                        frequency = "Yearly"
                        days_interval = 365
                        
                last_date = dates[-1]
                due_date = last_date + timedelta(days=days_interval)
                
                now = datetime.now()
                while due_date < now:
                    due_date += timedelta(days=days_interval)
                    
                recurring.append({
                    "name": merchant,
                    "category": category,
                    "amount": round(np.mean(amounts), 2),
                    "frequency": frequency,
                    "nextDueDate": due_date.strftime("%Y-%m-%d"),
                    "type": rec_type,
                    "lastPaymentDate": last_date.strftime("%Y-%m-%d")
                })
                
    return recurring
