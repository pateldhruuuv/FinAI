import pandas as pd
import re

def map_columns(df: pd.DataFrame):
    """
    Intelligently inspects the columns of the DataFrame and maps them to standard terms:
    date, description, debit, credit, balance, amount, type.
    """
    mapped = {}
    cols = [str(c) for c in df.columns]
    
    # Standard field definitions with associated keywords
    patterns = {
        "date": ["txn date", "transaction date", "value date", "booking date", "tran date", "date"],
        "description": ["description", "narration", "particulars", "remarks", "transaction remarks", "transaction details", "transaction details/particulars", "details"],
        "debit": ["debit", "withdrawal", "dr", "withdrawal (dr)", "amount (dr)", "dr amount", "dr_amt", "payment", "withdraw"],
        "credit": ["credit", "deposit", "cr", "deposit (cr)", "amount (cr)", "cr amount", "cr_amt", "receipt"],
        "amount": ["amount", "txn amount", "transaction amount", "value", "net amount", "amt"],
        "type": ["type", "dr/cr", "cr_dr", "transaction type", "dr_or_cr"],
        "balance": ["balance", "bal", "running balance", "available balance", "bal (inr)"],
        "reference": ["reference no", "reference number", "ref no", "ref number", "transaction id", "txn id", "chq./ref.no.", "chq/ref no", "reference", "ref", "cheque no", "cheque number", "chq.no."],
        "account": ["account number", "account no", "acc no", "acc number", "account"],
        "currency": ["currency", "curr", "ccy"]
    }
    
    # Try to map columns using exact/partial matching
    for field, keywords in patterns.items():
        found = False
        # Phase 1: Exact matches (ignoring case/whitespace)
        for col in cols:
            col_clean = col.strip().lower()
            if col_clean in keywords:
                mapped[field] = col
                found = True
                break
        
        # Phase 2: Pattern matches (if not found in phase 1)
        if not found:
            for col in cols:
                col_clean = col.strip().lower()
                for kw in keywords:
                    if kw in col_clean:
                        mapped[field] = col
                        found = True
                        break
                if found:
                    break
                    
    return mapped
