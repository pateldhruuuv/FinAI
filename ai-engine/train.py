import os
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.tree import DecisionTreeClassifier

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

def train_health_model():
    print("Training Financial Health Model...")
    df = pd.read_csv("data/financial_records.csv")
    
    X = df[["Age", "Income", "Expenses", "Savings", "Debt"]]
    y = df["HealthLabel"]
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # RandomForestClassifier for health score prediction
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)
    print(f"Health Model - Train Acc: {train_acc:.2f}, Test Acc: {test_acc:.2f}")
    
    # Save model
    with open("models/health_model.pkl", "wb") as f:
        pickle.dump(model, f)
    print("Saved health model to models/health_model.pkl")

def train_investment_model():
    print("Training Investment Recommendation Model...")
    df = pd.read_csv("data/investment_records.csv")
    
    # Preprocessing
    # Map RiskProfile to numerical
    risk_mapping = {"Conservative": 0, "Moderate": 1, "Aggressive": 2}
    df["RiskProfileEncoded"] = df["RiskProfile"].map(risk_mapping)
    
    X = df[["Age", "Income", "Savings", "RiskProfileEncoded"]]
    y_short = df["ShortTermSuggestion"]
    y_long = df["LongTermSuggestion"]
    
    # We train two Decision Trees
    short_model = DecisionTreeClassifier(max_depth=4, random_state=42)
    short_model.fit(X, y_short)
    
    long_model = DecisionTreeClassifier(max_depth=4, random_state=42)
    long_model.fit(X, y_long)
    
    print(f"Investment Short Term Suggestion Model trained.")
    print(f"Investment Long Term Suggestion Model trained.")
    
    # Save models
    with open("models/investment_short_model.pkl", "wb") as f:
        pickle.dump(short_model, f)
    with open("models/investment_long_model.pkl", "wb") as f:
        pickle.dump(long_model, f)
    print("Saved investment models to models/")

def train_insurance_model():
    print("Training Insurance Recommendation Models...")
    df = pd.read_csv("data/insurance_records.csv")
    
    # Preprocessing
    marital_mapping = {"Single": 0, "Married": 1}
    df["MaritalStatusEncoded"] = df["MaritalStatus"].map(marital_mapping)
    
    X = df[["Age", "Income", "Dependents", "MaritalStatusEncoded"]]
    
    y_health = df["HealthInsurance"]
    y_term = df["TermInsurance"]
    y_accident = df["AccidentInsurance"]
    y_coverage = df["SuggestedCoverageAmount"]
    
    # Train classifiers for insurance products
    health_model = DecisionTreeClassifier(max_depth=4, random_state=42)
    health_model.fit(X, y_health)
    
    term_model = DecisionTreeClassifier(max_depth=4, random_state=42)
    term_model.fit(X, y_term)
    
    accident_model = DecisionTreeClassifier(max_depth=4, random_state=42)
    accident_model.fit(X, y_accident)
    
    # Train a regressor for coverage amount
    coverage_model = RandomForestRegressor(n_estimators=50, random_state=42)
    coverage_model.fit(X, y_coverage)
    
    print("Insurance recommendation models trained.")
    
    # Save models
    with open("models/insurance_health_model.pkl", "wb") as f:
        pickle.dump(health_model, f)
    with open("models/insurance_term_model.pkl", "wb") as f:
        pickle.dump(term_model, f)
    with open("models/insurance_accident_model.pkl", "wb") as f:
        pickle.dump(accident_model, f)
    with open("models/insurance_coverage_model.pkl", "wb") as f:
        pickle.dump(coverage_model, f)
    print("Saved insurance models to models/")

if __name__ == "__main__":
    train_health_model()
    train_investment_model()
    train_insurance_model()
