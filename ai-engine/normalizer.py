import pandas as pd
import numpy as np
from datetime import datetime
from column_mapper import map_columns
from merchant_detector import detect_merchant, clean_description
from category_classifier import classify_transaction

def clean_amount(val):
    if pd.isna(val) or val == "":
        return 0.0
    val_str = str(val).strip()
    # Remove commas, currency symbols (₹, $, €, etc.)
    val_str = re.sub(r'[^\d.-]', '', val_str)
    try:
        return abs(float(val_str))
    except ValueError:
        return 0.0

import re

def normalize_transactions(df: pd.DataFrame):
    """
    Standardizes a parsed bank statement dataframe into the unified internal format:
    date, description, merchant, category, amount, transactionType, balance.
    """
    mapped_cols = map_columns(df)
    
    # Check what columns we successfully mapped
    date_col = mapped_cols.get("date")
    desc_col = mapped_cols.get("description")
    debit_col = mapped_cols.get("debit")
    credit_col = mapped_cols.get("credit")
    amount_col = mapped_cols.get("amount")
    type_col = mapped_cols.get("type")
    balance_col = mapped_cols.get("balance")
    reference_col = mapped_cols.get("reference")
    account_col = mapped_cols.get("account")
    currency_col = mapped_cols.get("currency")
    
    normalized_list = []
    
    # We must have at least date and description
    if not date_col or not desc_col:
        print("Required columns (date, description) missing from mapping!")
        return [], mapped_cols
        
    running_balance = 0.0
    
    for idx, row in df.iterrows():
        # 1. Parse Date
        raw_date = row[date_col]
        date_str = ""
        if pd.notna(raw_date):
            raw_date_str = str(raw_date).strip()
            # Try parsing various formats
            for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d/%m/%y", "%Y/%m/%d", "%d-%b-%Y", "%d-%b-%y"):
                try:
                    dt = datetime.strptime(raw_date_str, fmt)
                    date_str = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
            if not date_str:
                # Fallback to string slicing if it starts with YYYY-MM-DD
                if len(raw_date_str) >= 10 and re.match(r'^\d{4}-\d{2}-\d{2}', raw_date_str):
                    date_str = raw_date_str[:10]
                else:
                    date_str = datetime.now().strftime("%Y-%m-%d")
        else:
            date_str = datetime.now().strftime("%Y-%m-%d")
            
        # 2. Parse Description
        raw_desc = str(row[desc_col]).strip() if pd.notna(row[desc_col]) else "No Description"
        
        # 3. Determine amount and type (Debit / Credit)
        amount = 0.0
        tx_type = "Debit"
        
        if debit_col and credit_col:
            # We have separate debit and credit columns
            debit_val = clean_amount(row[debit_col])
            credit_val = clean_amount(row[credit_col])
            
            if debit_val > 0:
                amount = debit_val
                tx_type = "Debit"
            elif credit_val > 0:
                amount = credit_val
                tx_type = "Credit"
            else:
                amount = 0.0
                tx_type = "Debit"
        elif amount_col:
            # Single amount column
            amount = clean_amount(row[amount_col])
            
            # Determine type
            if type_col:
                raw_type = str(row[type_col]).strip().lower()
                if "cr" in raw_type or "credit" in raw_type or "dep" in raw_type:
                    tx_type = "Credit"
                else:
                    tx_type = "Debit"
            else:
                # If no type column, check if amount is negative
                raw_val = str(row[amount_col]).strip()
                if raw_val.startswith("-") or "(" in raw_val:
                    tx_type = "Debit"
                else:
                    # Positive values are usually debits in credit cards, but credits in bank statements.
                    # Standard assumption: positive is Debit, negative is Credit? Or positive is Credit?
                    # The instruction says: "Debit -> debit, Withdrawal -> debit, Credit -> credit, Deposit -> credit"
                    # If we only have amount, let's treat it as Debit by default, unless it's explicitly marked.
                    # Or check standard: positive = Credit, negative = Debit (e.g. withdrawal is negative).
                    # Let's map negative to Debit and positive to Credit if we have negative signs.
                    # Wait, let's look at the sample: amount = abs(amount).
                    val_float = float(re.sub(r'[^\d.-]', '', raw_val)) if re.sub(r'[^\d.-]', '', raw_val) else 0.0
                    tx_type = "Credit" if val_float >= 0 else "Debit"
        else:
            amount = 0.0
            tx_type = "Debit"
            
        # 4. Extract Merchant and Category
        det_result = detect_merchant(raw_desc)
        merchant = det_result["merchant"]
        category = det_result["category"]
        confidence = det_result["confidence"]
        is_unknown = det_result["is_unknown"]
        
        # If merchant not found in dictionary/learning, or low confidence, run ML classifier
        if is_unknown or confidence < 0.7:
            ml_category, ml_confidence = classify_transaction(raw_desc, merchant, amount)
            # Use ML prediction if it has higher confidence or if category is Miscellaneous
            if ml_confidence > confidence or category == "Miscellaneous":
                category = ml_category
                confidence = ml_confidence
                # Update is_unknown status based on ML confidence threshold
                if confidence >= 0.7:
                    is_unknown = False
                    
        # 5. Parse Balance
        balance = 0.0
        if balance_col and pd.notna(row[balance_col]):
            balance = clean_amount(row[balance_col])
            running_balance = balance
        else:
            # Propagate running balance
            if tx_type == "Credit":
                running_balance += amount
            else:
                running_balance -= amount
            balance = round(running_balance, 2)
            
        # Parse reference, account, currency values from mapped columns if they exist
        reference_val = ""
        if reference_col and pd.notna(row[reference_col]):
            reference_val = str(row[reference_col]).strip()
            
        account_val = ""
        if account_col and pd.notna(row[account_col]):
            account_val = str(row[account_col]).strip()
            
        currency_val = "INR"
        if currency_col and pd.notna(row[currency_col]):
            currency_val = str(row[currency_col]).strip().upper()

        normalized_list.append({
            "date": date_str,
            "description": raw_desc,
            "merchant": merchant,
            "category": category,
            "amount": round(amount, 2),
            "transactionType": tx_type,
            "balance": round(balance, 2),
            "confidence": round(confidence, 2),
            "is_unknown": is_unknown,
            "referenceNumber": reference_val if reference_val else None,
            "accountNumber": account_val if account_val else None,
            "currency": currency_val if currency_val else "INR"
        })
        
    # Sort final transactions by date
    normalized_list.sort(key=lambda x: x["date"])
    
    return normalized_list, mapped_cols
