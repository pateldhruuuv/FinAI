import os
import json
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DICT_PATH = os.path.join(DATA_DIR, "merchant_dictionary.json")
LEARNING_PATH = os.path.join(DATA_DIR, "merchant_learning.json")

def load_json_file(path, default_val=None):
    if default_val is None:
        default_val = {}
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {path}: {e}")
    return default_val

def save_json_file(path, data):
    try:
        with open(path, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving {path}: {e}")

def clean_description(desc: str) -> str:
    """
    Cleans transaction descriptions: removes transaction reference numbers, dates,
    UPI/POS prefixes, etc., returning the core merchant string.
    """
    if not desc:
        return "Unknown"
    
    desc_upper = desc.strip().upper()
    
    # Remove common banking prefixes/suffixes
    # Remove prefixes like UPI/NETFLIX/12345/Payment -> NETFLIX
    desc_clean = re.sub(r'^(UPI|POS|NEFT|IMPS|ACH|CHG|ATM|IMPS|RTGS|FT|TFR)\b[-/\s]*', '', desc_upper)
    
    # Remove transaction IDs / reference numbers (long number sequences)
    desc_clean = re.sub(r'\b\d{10,18}\b', '', desc_clean)
    desc_clean = re.sub(r'/[A-Z0-9]{8,20}/', '/', desc_clean)
    desc_clean = re.sub(r'/\d{12}/', '/', desc_clean)
    
    # Remove dates (e.g. DD-MM-YYYY, DD/MM/YY)
    desc_clean = re.sub(r'\b\d{2}[-./]\d{2}[-./]\d{2,4}\b', '', desc_clean)
    
    # Remove common extra terms
    desc_clean = re.sub(r'\b(PAYMENT|TRANSFER|ONLINE|MUMBAI|DELHI|IN|DEBIT|CREDIT|BILL|SIP|CORP|SALARY|WAGES)\b', '', desc_clean)
    
    # Clean up excess slashes and non-alphanumeric chars (keep spaces and stars)
    desc_clean = re.sub(r'[^A-Z0-9\s*+&-]', ' ', desc_clean)
    desc_clean = re.sub(r'\s+', ' ', desc_clean).strip()
    
    return desc_clean if desc_clean else desc.strip()

def detect_merchant(description: str):
    """
    Identifies the merchant from the transaction description using:
    1. User corrections (Learning Database)
    2. Substring keyword matching (Merchant Dictionary)
    3. Basic fuzzy/similarity fallback if not found.
    """
    dict_db = load_json_file(DICT_PATH)
    learning_db = load_json_file(LEARNING_PATH)
    
    cleaned = clean_description(description)
    cleaned_lower = cleaned.lower()
    
    # 1. Check user learning database first (exact description match or exact cleaned description match)
    # Check if this exact raw description has been corrected before
    raw_lower = description.strip().lower()
    if raw_lower in learning_db:
        entry = learning_db[raw_lower]
        return {
            "merchant": entry.get("merchant", cleaned),
            "category": entry.get("category", "Miscellaneous"),
            "confidence": 1.0,
            "is_unknown": False,
            "source": "learning"
        }
        
    # Check if cleaned description matches a corrected merchant name in learning database
    for desc_pattern, entry in learning_db.items():
        if desc_pattern in cleaned_lower or cleaned_lower in desc_pattern:
            return {
                "merchant": entry.get("merchant"),
                "category": entry.get("category"),
                "confidence": 1.0,
                "is_unknown": False,
                "source": "learning"
            }
            
    # 1.5 Check explicit high-confidence keyword rules for common financial terms
    cleaned_upper = cleaned.upper()
    raw_upper = description.upper()
    
    if "BALANCE FORWARD" in raw_upper:
        return {"merchant": "Balance Forward", "category": "Miscellaneous", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "CGST" in raw_upper or "SGST" in raw_upper:
        return {"merchant": "GST Tax", "category": "Taxes", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "LIC PREMIUM" in raw_upper or "LIC INSURANCE" in raw_upper or "LIC " in raw_upper:
        return {"merchant": "LIC Insurance", "category": "Insurance", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "INTEREST" in raw_upper:
        return {"merchant": "Interest Credit", "category": "Investment", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "ATM WITHDRAWAL" in raw_upper or "ATM WITHDR" in raw_upper or "CASHNT" in raw_upper or "NON SCB ATM" in raw_upper:
        return {"merchant": "ATM Withdrawal", "category": "ATM", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "PAYTM" in raw_upper:
        return {"merchant": "Paytm Wallet", "category": "Shopping", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "AMAZON" in raw_upper or "AMZN" in raw_upper:
        return {"merchant": "Amazon", "category": "Shopping", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "IXIGO" in raw_upper or "TRAVENUES" in raw_upper:
        return {"merchant": "Ixigo", "category": "Travel", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "ANANDA VILAS" in raw_upper:
        return {"merchant": "Ananda Vilas Hotel", "category": "Food", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "AIRTEL" in raw_upper:
        return {"merchant": "Airtel Bill", "category": "Utilities", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "THANGAMALIGAI" in raw_upper:
        return {"merchant": "G R Thangamaligai", "category": "Shopping", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "LIFE STYLE" in raw_upper or "LIFESTYLE" in raw_upper:
        return {"merchant": "Lifestyle Stores", "category": "Shopping", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "LAKSHMI KANTHAM" in raw_upper:
        return {"merchant": "Lakshmi Kantham Services", "category": "Shopping", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "DUMMY NAME" in raw_upper:
        return {"merchant": "Dummy Name Transfer", "category": "Transfer", "confidence": 1.0, "is_unknown": False, "source": "rules"}
    if "IMPS" in raw_upper or "CRADJ" in raw_upper or "UPI" in raw_upper or "TRANSFER" in raw_upper:
        m_name = cleaned.strip()
        if not m_name:
            m_name = "UPI/IMPS Transfer"
        return {"merchant": m_name, "category": "Transfer", "confidence": 0.95, "is_unknown": False, "source": "rules"}
            
    # 2. Check main merchant dictionary using keyword substring matching
    for merchant, info in dict_db.items():
        keywords = info.get("keywords", [merchant.lower()])
        for kw in keywords:
            kw_clean = kw.lower().strip()
            # If keyword is in the description or cleaned description
            if kw_clean in cleaned_lower or kw_clean in raw_lower:
                return {
                    "merchant": merchant,
                    "category": info.get("category", "Miscellaneous"),
                    "confidence": info.get("confidence", 1.0),
                    "is_unknown": False,
                    "source": "dictionary"
                }
                
    # 3. Fallback: Unknown Transaction Analyzer rules (Feature 9)
    # Perform basic keyword rules for categories
    fallback_cat = "Miscellaneous"
    is_salary = any(x in raw_lower for x in ["salary", "wages", "direct dep", "payroll"])
    is_rent = any(x in raw_lower for x in ["rent", "house rent", "lease"])
    is_emi = any(x in raw_lower for x in ["emi", "loan", "mortgage", "finance"])
    is_insurance = any(x in raw_lower for x in ["lic", "insurance", "premium", "policy"])
    is_investment = any(x in raw_lower for x in ["mutual fund", "sip", "groww", "zerodha", "invest", "broker", "fund"])
    is_atm = any(x in raw_lower for x in ["atm", "cash", "withdrawal"])
    is_utilities = any(x in raw_lower for x in ["electricity", "power", "water", "broadband", "mobile recharge", "jio", "airtel", "dth"])
    is_groceries = any(x in raw_lower for x in ["bigbasket", "blinkit", "groceries", "supermarket", "kirana"])
    
    if is_salary:
        fallback_cat = "Salary"
    elif is_rent:
        fallback_cat = "Transfer"
    elif is_emi or is_utilities:
        fallback_cat = "Bills"
    elif is_insurance:
        fallback_cat = "Insurance"
    elif is_investment:
        fallback_cat = "Investment"
    elif is_atm:
        fallback_cat = "ATM"
    elif is_groceries:
        fallback_cat = "Groceries"
        
    # Return as Unknown / Needs Review (Feature 9)
    # If a possible category is identified, confidence is slightly higher, otherwise low (0.4)
    confidence = 0.6 if fallback_cat != "Miscellaneous" else 0.4
    
    # Capitalize cleaned description to look nice as a merchant name
    possible_merchant = cleaned.title()
    
    return {
        "merchant": possible_merchant,
        "category": fallback_cat,
        "confidence": confidence,
        "is_unknown": True,
        "source": "analyzer"
    }
