import os
import random
import csv
import pandas as pd
import numpy as np

# Ensure data directory exists
os.makedirs("data", exist_ok=True)

def generate_financial_records(n=1000):
    """
    Generates n financial records for health prediction training.
    Fields: Age, Income, Expenses, Savings, Debt, HealthLabel
    Income/Expenses: Monthly in INR
    Savings: Accumulated savings in INR
    Debt: Total outstanding debt in INR
    HealthLabel: Healthy, Moderate, Risky
    """
    records = []
    header = ["Age", "Income", "Expenses", "Savings", "Debt", "HealthLabel"]
    
    for _ in range(n):
        age = random.randint(18, 70)
        # Income ranges from 25k to 300k monthly
        income = random.randint(25000, 300000)
        # Expenses usually 40% to 90% of income
        expense_ratio = random.uniform(0.35, 0.85)
        expenses = int(income * expense_ratio)
        
        # Monthly savings
        monthly_saving = income - expenses
        # Accumulated savings (depends on age and income)
        savings = int(monthly_saving * random.randint(3, 36)) 
        
        # Debt
        debt_prob = random.random()
        if debt_prob < 0.4:
            debt = 0
        else:
            # Debt can be up to 15 times monthly income
            debt = int(income * random.uniform(0.2, 10))
            
        # Ratios for classification rules
        savings_ratio = (income - expenses) / income
        debt_ratio = debt / income
        emergency_fund = savings / max(expenses, 1)
        
        # Rule-based labelling with noise
        if savings_ratio >= 0.3 and debt_ratio <= 1.5 and emergency_fund >= 3:
            label = "Healthy"
        elif savings_ratio < 0.1 or debt_ratio > 5.0 or emergency_fund < 1.0 or expenses > income:
            label = "Risky"
        else:
            label = "Moderate"
            
        # Introduce 5% label noise to simulate real-world data
        if random.random() < 0.05:
            label = random.choice(["Healthy", "Moderate", "Risky"])
            
        records.append([age, income, expenses, savings, debt, label])
        
    with open("data/financial_records.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(records)
    print(f"Generated {n} financial records in data/financial_records.csv")

def generate_investment_records(n=100):
    """
    Generates n investment recommendation records.
    Fields: Age, Income, Savings, RiskProfile, ShortTermSuggestion, LongTermSuggestion
    RiskProfile: Conservative, Moderate, Aggressive
    """
    records = []
    header = ["Age", "Income", "Savings", "RiskProfile", "ShortTermSuggestion", "LongTermSuggestion"]
    
    risk_profiles = ["Conservative", "Moderate", "Aggressive"]
    
    for _ in range(n):
        age = random.randint(18, 75)
        income = random.randint(30000, 250000)
        savings = random.randint(50000, 2000000)
        risk = random.choice(risk_profiles)
        
        # Assign short-term and long-term suggestions based on rules
        if risk == "Conservative":
            short_term = "Fixed Deposit"
            long_term = "Debt Fund"
        elif risk == "Moderate":
            short_term = "Debt Fund"
            # Older moderate risk takers might prefer Mutual Funds, younger might prefer Index Funds
            if age > 50:
                long_term = "Mutual Funds"
            else:
                long_term = "Index Funds"
        else:  # Aggressive
            # High age aggressive suggests Mutual Funds, young suggests Equity
            short_term = "Debt Fund"
            if age > 45:
                long_term = "Mutual Funds"
            else:
                long_term = "Equity"
                
        # Random swap (noise)
        if random.random() < 0.02:
            short_term = random.choice(["Fixed Deposit", "Debt Fund"])
            long_term = random.choice(["Index Funds", "Mutual Funds", "Equity"])
            
        records.append([age, income, savings, risk, short_term, long_term])
        
    with open("data/investment_records.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(records)
    print(f"Generated {n} investment records in data/investment_records.csv")

def generate_insurance_records(n=100):
    """
    Generates n insurance recommendation records.
    Fields: Age, Income, Dependents, MaritalStatus, HealthInsurance, TermInsurance, AccidentInsurance, SuggestedCoverageAmount
    MaritalStatus: Single, Married
    """
    records = []
    header = ["Age", "Income", "Dependents", "MaritalStatus", "HealthInsurance", "TermInsurance", "AccidentInsurance", "SuggestedCoverageAmount"]
    
    marital_statuses = ["Single", "Married"]
    
    for _ in range(n):
        age = random.randint(18, 70)
        income = random.randint(25000, 250000)
        dependents = random.randint(0, 5)
        marital = random.choice(marital_statuses)
        
        # Determine Health Insurance type
        if income > 150000 or age > 50:
            health = "Comprehensive"
        elif income > 75000 or dependents > 1:
            health = "Premium"
        else:
            health = "Basic"
            
        # Determine Term Insurance (Yes if they have dependents or are married)
        term = "Yes" if (dependents > 0 or marital == "Married") else "No"
        
        # Accident Insurance is always recommended for active/working people
        accident = "Yes" if age <= 60 else "No"
        
        # Coverage amount calculation: rule of thumb is 10x-15x monthly/annual income + buffers
        # Let's say annual income approximation: income * 12.
        # Coverage amount is roughly: (monthly income * 12) * (10 + dependents * 2)
        base_multiplier = 10 if age > 45 else 15
        coverage = int(income * 12 * (base_multiplier + dependents * 1.5))
        # Round to nearest 500k
        coverage = round(coverage / 500000) * 500000
        coverage = max(coverage, 1000000)  # Min coverage 10 Lakhs (1M)
        
        records.append([age, income, dependents, marital, health, term, accident, coverage])
        
    with open("data/insurance_records.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(records)
    print(f"Generated {n} insurance records in data/insurance_records.csv")

if __name__ == "__main__":
    generate_financial_records()
    generate_investment_records()
    generate_insurance_records()
