import os
import re
import sys
import pandas as pd
from datetime import datetime
from typing import Tuple, List, Dict, Any
from rapidfuzz import fuzz, process

# Add parent directory to path so we can import merchant_detector
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from merchant_detector import detect_merchant, clean_description

_merchant_canonical_cache = {}

def get_canonical_merchant(desc: str, threshold: float = 80.0) -> str:
    """
    Extracts a normalized merchant name using the existing detector.
    Then unifies fuzzy variations like 'Netflix India' vs 'Netflix' using RapidFuzz.
    """
    if not desc or str(desc).strip() == "":
        return "UNKNOWN"
        
    cleaned = clean_description(desc).strip().upper()
    # Extra cleaning: remove pure digits and transaction/ref code patterns of any length
    cleaned = re.sub(r'\b\d+\b', '', cleaned)
    cleaned = re.sub(r'\b[A-Z]+\d+[A-Z0-9]*\b', '', cleaned)
    cleaned = re.sub(r'\b[A-Z0-9]+\d+[A-Z]*\b', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    if not cleaned:
        return "UNKNOWN"
        
    # Check cache first
    if cleaned in _merchant_canonical_cache:
        return _merchant_canonical_cache[cleaned]
        
    # Run standard detect_merchant to get base merchant name
    det = detect_merchant(desc)
    merchant_detected = det.get("merchant", cleaned).strip().upper()
    
    # Apply extra cleaning to the detected merchant name as well
    merchant_detected = re.sub(r'\b\d+\b', '', merchant_detected)
    merchant_detected = re.sub(r'\b[A-Z]+\d+[A-Z0-9]*\b', '', merchant_detected)
    merchant_detected = re.sub(r'\b[A-Z0-9]+\d+[A-Z]*\b', '', merchant_detected)
    merchant_detected = re.sub(r'\s+', ' ', merchant_detected).strip()
    
    # Fuzzy match against already registered canonical merchants
    if _merchant_canonical_cache:
        existing_merchants = list(set(_merchant_canonical_cache.values()))
        match = process.extractOne(merchant_detected, existing_merchants, scorer=fuzz.token_set_ratio)
        if match and match[1] >= threshold:
            canonical = match[0]
            _merchant_canonical_cache[cleaned] = canonical
            return canonical
            
    _merchant_canonical_cache[cleaned] = merchant_detected
    return merchant_detected

def normalize_transactions(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalizes transaction values to ensure accurate duplicate comparison:
    - Trim spaces
    - Convert descriptions to uppercase
    - Remove multiple spaces
    - Standardize dates (YYYY-MM-DD)
    - Standardize currency (uppercase, default INR)
    - Convert empty values to None (NULL)
    - Round amounts to 2 decimal places
    """
    df = df.copy()
    
    # 1. Standardize Dates
    if 'date' in df.columns:
        df['date'] = df['date'].apply(lambda d: str(d).strip() if pd.notna(d) else "")
    else:
        df['date'] = ""
        
    # 2. Normalize Description: Trim, uppercase, single-spaces
    if 'description' in df.columns:
        df['description'] = df['description'].apply(
            lambda desc: re.sub(r'\s+', ' ', str(desc).strip().upper()) if pd.notna(desc) and str(desc).strip() != "" else None
        )
    else:
        df['description'] = None
        
    # 3. Standardize Currency
    if 'currency' in df.columns:
        df['currency'] = df['currency'].apply(
            lambda c: str(c).strip().upper() if pd.notna(c) and str(c).strip() != "" else "INR"
        )
    else:
        df['currency'] = "INR"
        
    # 4. Standardize referenceNumber and accountNumber
    for col in ['referenceNumber', 'accountNumber']:
        if col in df.columns:
            df[col] = df[col].apply(
                lambda v: str(v).strip() if pd.notna(v) and str(v).strip() not in ("", "nan", "None", "null", "NULL") else None
            )
        else:
            df[col] = None
            
    # 5. Round amounts to 2 decimal places & derive Debit/Credit amounts
    if 'amount' in df.columns and 'transactionType' in df.columns:
      df['debit_amount'] = df.apply(
          lambda r: round(float(r['amount'] or 0.0), 2) if str(r['transactionType'] or '').strip().lower() == 'debit' else 0.0, axis=1
      )
      df['credit_amount'] = df.apply(
          lambda r: round(float(r['amount'] or 0.0), 2) if str(r['transactionType'] or '').strip().lower() == 'credit' else 0.0, axis=1
      )
    else:
        # Check if debit/credit columns are directly present
        if 'debit_amount' in df.columns:
            df['debit_amount'] = df['debit_amount'].apply(lambda a: round(float(a), 2) if pd.notna(a) and str(a).strip() != "" else 0.0)
        else:
            df['debit_amount'] = 0.0
            
        if 'credit_amount' in df.columns:
            df['credit_amount'] = df['credit_amount'].apply(lambda a: round(float(a), 2) if pd.notna(a) and str(a).strip() != "" else 0.0)
        else:
            df['credit_amount'] = 0.0
            
    # Clean up empty values to None
    for col in df.columns:
        df[col] = df[col].apply(lambda x: None if pd.isna(x) or x == "" else x)
        
    return df

def detect_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Returns a DataFrame containing the duplicate transaction rows (all except the first occurrence).
    Duplicates are identified based on Date, Normalized Description, Debit, Credit, Reference Number,
    Account Number, Currency, and Transaction Type.
    """
    df_normalized = normalize_transactions(df)
    df_normalized['normalized_description'] = df_normalized['description'].apply(get_canonical_merchant)
    
    dup_indices = []
    first_occurrence_indices = df_normalized.groupby(
        ['date', 'normalized_description', 'debit_amount', 'credit_amount', 'referenceNumber', 'accountNumber', 'currency', 'transactionType'],
        dropna=False
    ).indices
    
    for group, indices in first_occurrence_indices.items():
        if len(indices) > 1:
            # Add all indices except the first one (keep the first)
            dup_indices.extend(indices[1:])
            
    dup_indices.sort()
    return df.iloc[dup_indices].copy()

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Removes duplicate transaction rows, keeping only the first occurrence.
    """
    df_normalized = normalize_transactions(df)
    df_normalized['normalized_description'] = df_normalized['description'].apply(get_canonical_merchant)
    
    clean_indices = []
    first_occurrence_indices = df_normalized.groupby(
        ['date', 'normalized_description', 'debit_amount', 'credit_amount', 'referenceNumber', 'accountNumber', 'currency', 'transactionType'],
        dropna=False
    ).indices
    
    for group, indices in first_occurrence_indices.items():
        clean_indices.append(indices[0])
        
    clean_indices.sort()
    return df.iloc[clean_indices].copy()

def save_duplicate_log(df_original: pd.DataFrame, source_file: str) -> Tuple[str, str]:
    """
    Generates a duplicate transactions log DataFrame and writes it to duplicate_transactions.csv.
    Returns a tuple of (file_path, csv_content_string).
    """
    df_normalized = normalize_transactions(df_original)
    df_normalized['normalized_description'] = df_normalized['description'].apply(get_canonical_merchant)
    
    log_rows = []
    first_occurrence_indices = df_normalized.groupby(
        ['date', 'normalized_description', 'debit_amount', 'credit_amount', 'referenceNumber', 'accountNumber', 'currency', 'transactionType'],
        dropna=False
    ).indices
    
    for group, indices in first_occurrence_indices.items():
        if len(indices) > 1:
            original_idx = indices[0]
            original_row_num = int(original_idx) + 1
            for dup_idx in indices[1:]:
                dup_row_num = int(dup_idx) + 1
                row_data = df_original.iloc[dup_idx]
                log_rows.append({
                    "Original Row Number": original_row_num,
                    "Duplicate Row Number": dup_row_num,
                    "Reason": f"Duplicate of row {original_row_num} (matches Date, Description, Amounts, Ref No)",
                    "Timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "Source File": os.path.basename(source_file)
                })
                
    log_df = pd.DataFrame(log_rows)
    if log_df.empty:
        # Create empty template with required headers
        log_df = pd.DataFrame(columns=["Original Row Number", "Duplicate Row Number", "Reason", "Timestamp", "Source File"])
        
    # Write to temp folder
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, "duplicate_transactions.csv")
    log_df.to_csv(file_path, index=False)
    
    csv_string = log_df.to_csv(index=False)
    return file_path, csv_string

def generate_duplicate_summary(df_original: pd.DataFrame, df_clean: pd.DataFrame) -> Dict[str, int]:
    """
    Computes summary metrics for transaction duplicate processing.
    """
    total = len(df_original)
    final = len(df_clean)
    removed = total - final
    return {
        "total_uploaded": total,
        "duplicate_found": removed,
        "duplicate_removed": removed,
        "final_transactions": final
    }

def get_duplicates_with_metadata(df_original: pd.DataFrame, source_file: str) -> List[Dict[str, Any]]:
    """
    Combines duplicate rows with logging columns (row numbers, reason, etc.) into dicts.
    """
    df_normalized = normalize_transactions(df_original)
    df_normalized['normalized_description'] = df_normalized['description'].apply(get_canonical_merchant)
    
    duplicates_with_meta = []
    first_occurrence_indices = df_normalized.groupby(
        ['date', 'normalized_description', 'debit_amount', 'credit_amount', 'referenceNumber', 'accountNumber', 'currency', 'transactionType'],
        dropna=False
    ).indices
    
    for group, indices in first_occurrence_indices.items():
        if len(indices) > 1:
            original_idx = indices[0]
            original_row_num = int(original_idx) + 1
            for dup_idx in indices[1:]:
                dup_row_num = int(dup_idx) + 1
                row_data = df_original.iloc[dup_idx].to_dict()
                
                # Convert nan/NaT to None for JSON compatibility
                row_clean = {}
                for k, v in row_data.items():
                    if pd.isna(v) or v == "":
                        row_clean[k] = None
                    else:
                        row_clean[k] = v
                
                row_clean.update({
                    "originalRowNumber": original_row_num,
                    "duplicateRowNumber": dup_row_num,
                    "reason": f"Duplicate of row {original_row_num} (matches Date, Description, Amounts, Ref No)",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "sourceFile": os.path.basename(source_file)
                })
                duplicates_with_meta.append(row_clean)
                
    return duplicates_with_meta
