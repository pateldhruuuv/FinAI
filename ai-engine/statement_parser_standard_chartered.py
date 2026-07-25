import os
import re
import json
from datetime import datetime
import pdfplumber

def convert_sc_date(date_str):
    if not date_str:
        return None
    date_str = date_str.strip()
    for fmt in ("%d %b %y", "%d %b %Y"):
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    print(f"Date conversion failed for {date_str}")
    return date_str

def clean_amount(val_str):
    if not val_str:
        return 0.0
    cleaned = re.sub(r'[^\d.-]', '', val_str)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def detect_sc_bank(text):
    text_upper = text.upper()
    if "STANDARD CHARTERED" in text_upper:
        return True
    if re.search(r'IFSC:\s*SCBL\d{7}', text_upper):
        return True
    return False

def parse_sc_pdf(file_path):
    metadata = {
        "branch": None,
        "statement_date": None,
        "currency": None,
        "account_type": None,
        "account_no": None,
        "nominee_registered": None,
        "branch_address": None,
        "micr": None,
        "ifsc": None,
        "customer_name": None
    }
    
    transactions = []
    reward_points = []
    
    # State variables for transaction parsing
    last_date = None
    last_value_date = None
    active_tx = None
    desc_buffer = []
    first_opening_balance = None
    
    # Parsing flags
    parsing_reward_points = False
    total_row = None
    
    # Float patterns for amount and balance
    num_pattern = r'(-?\d{1,3}(?:,\d{3})*\.\d{2})'
    two_nums_re = re.compile(r'\s+' + num_pattern + r'\s+' + num_pattern + r'$')
    one_num_re = re.compile(r'\s+' + num_pattern + r'$')
    
    # Address collection state
    collect_address = False
    address_lines = []
    
    with pdfplumber.open(file_path) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue
                
            lines = text.split("\n")
            for line_idx, line in enumerate(lines):
                line_str = line.strip()
                if not line_str:
                    continue
                
                # Check for Reward Points Statement boundary
                if "REWARD POINTS STATEMENT" in line_str.upper():
                    parsing_reward_points = True
                    if active_tx:
                        finalize_tx(active_tx, desc_buffer, transactions)
                        active_tx = None
                    continue
                
                if parsing_reward_points:
                    if any(x in line_str.lower() for x in ["reward plus", "scheme", "opening", "balance"]):
                        reward_points.append(line_str)
                    continue
                
                # Extract Metadata
                if page_idx == 0:
                    # Precise Customer Name match
                    if not metadata["customer_name"]:
                        name_match = re.match(r'^(MR|MRS|MS|DR)\s+([A-Z\s]+)$', line_str.upper())
                        if name_match:
                            metadata["customer_name"] = line_str
                            
                    branch_m = re.search(r'BRANCH\s*:\s*(.*)', line_str)
                    if branch_m:
                        metadata["branch"] = branch_m.group(1).strip()
                        
                    date_m = re.search(r'STATEMENT DATE\s*:\s*(.*)', line_str)
                    if date_m:
                        metadata["statement_date"] = convert_sc_date(date_m.group(1).strip())
                        
                    curr_m = re.search(r'CURRENCY\s*:\s*(.*)', line_str)
                    if curr_m:
                        metadata["currency"] = curr_m.group(1).strip()
                        
                    type_m = re.search(r'ACCOUNT TYPE\s*:\s*(.*)', line_str)
                    if type_m:
                        acc_type = type_m.group(1).strip()
                        if "SMART BANKING SAVINGS" in acc_type.upper():
                            acc_type = "SMART BANKING SAVINGS ACCOUNT"
                        metadata["account_type"] = acc_type
                        
                    no_m = re.search(r'ACCOUNT NO\.\s*:\s*(\d+)', line_str)
                    if no_m:
                        metadata["account_no"] = no_m.group(1).strip()
                        
                    nominee_m = re.search(r'NOMINEE REGISTERED\s*:\s*(.*)', line_str)
                    if nominee_m:
                        metadata["nominee_registered"] = nominee_m.group(1).strip()
                        
                    micr_m = re.search(r'MICR:\s*(\d+)', line_str)
                    if micr_m:
                        metadata["micr"] = micr_m.group(1).strip()
                        
                    ifsc_m = re.search(r'IFSC:\s*([A-Z0-9]+)', line_str)
                    if ifsc_m:
                        metadata["ifsc"] = ifsc_m.group(1).strip()
                        
                    # Branch Address block
                    if "BRANCH ADDRESS:" in line_str:
                        collect_address = True
                        continue
                    if collect_address:
                        if "MICR:" in line_str or "STATEMENT DATE" in line_str or line_str.startswith("Date"):
                            collect_address = False
                            metadata["branch_address"] = " ".join(address_lines).strip()
                        else:
                            address_lines.append(line_str)
                
                # Skip header/footer line noise
                if any(x in line_str.upper() for x in ["PAGE ", "MR SEENIVASAN", "DDA 2019", "BANK DEPOSITS ARE COVERED", "PLEASE REGISTER THE NOMINATION", "REPORT IRREGULARITIES"]):
                    continue
                if line_str.startswith("Date Value") or line_str.startswith("Date Description"):
                    continue
                
                # Check for TOTAL row
                if line_str.startswith("TOTAL"):
                    if active_tx:
                        finalize_tx(active_tx, desc_buffer, transactions)
                        active_tx = None
                    tot_m = re.findall(r'\d{1,3}(?:,\d{3})*\.\d{2}', line_str)
                    if len(tot_m) >= 2:
                        total_row = {
                            "credits": clean_amount(tot_m[0]),
                            "debits": clean_amount(tot_m[1]),
                            "balance": clean_amount(tot_m[2]) if len(tot_m) > 2 else 0.0
                        }
                    continue
                
                # Date match pattern (starts with two dates: Date and Value Date)
                date_pair_match = re.match(r'^(\d{1,2} [A-Z][a-z]{2} \d{2})\s+(\d{1,2} [A-Z][a-z]{2} \d{2})\s+(.*)', line_str)
                
                if date_pair_match:
                    tx_date = convert_sc_date(date_pair_match.group(1))
                    val_date = convert_sc_date(date_pair_match.group(2))
                    rest = date_pair_match.group(3)
                else:
                    rest = line_str
                    tx_date = last_date
                    val_date = last_value_date
                
                # Search for balance markers in "rest" (avoid offset bug)
                two_nums = two_nums_re.search(rest)
                one_num = one_num_re.search(rest)
                
                if one_num or two_nums:
                    # It's a transaction row!
                    if active_tx:
                        finalize_tx(active_tx, desc_buffer, transactions)
                        active_tx = None
                    
                    if date_pair_match:
                        last_date = tx_date
                        last_value_date = val_date
                        
                    if two_nums:
                        amount_val = clean_amount(two_nums.group(1))
                        balance_val = clean_amount(two_nums.group(2))
                        desc_start = rest[:two_nums.start()].strip()
                    else:
                        amount_val = 0.0
                        balance_val = clean_amount(one_num.group(1))
                        desc_start = rest[:one_num.start()].strip()
                        
                    if first_opening_balance is None and "BALANCE FORWARD" in desc_start:
                        first_opening_balance = balance_val
                    
                    active_tx = {
                        "date": tx_date,
                        "value_date": val_date,
                        "description_raw": desc_start,
                        "amount": amount_val,
                        "balance": balance_val,
                        "is_balance_forward": "BALANCE FORWARD" in desc_start
                    }
                    desc_buffer = [desc_start]
                else:
                    # Continuation line for the description
                    if active_tx:
                        desc_buffer.append(line_str)
                        
            if active_tx:
                finalize_tx(active_tx, desc_buffer, transactions)
                active_tx = None
                
    # Finalize statement transactions (filter out BALANCE FORWARD rows)
    sc_transactions = []
    balance_checks = []
    running_bal = first_opening_balance
    
    for tx in transactions:
        if tx["is_balance_forward"]:
            running_bal = tx["balance"]
            continue
            
        prev_bal_temp = running_bal
        new_bal = tx["balance"]
        
        diff = round(new_bal - prev_bal_temp, 2)
        if diff > 0:
            tx_type = "credit"
            calc_diff = abs(tx["amount"] - diff) < 0.02
        else:
            tx_type = "debit"
            calc_diff = abs(tx["amount"] - abs(diff)) < 0.02
            
        balance_checks.append({
            "date": tx["date"],
            "description": tx["description_raw"],
            "expected_amount": tx["amount"],
            "actual_change": abs(diff),
            "stated_balance": new_bal,
            "calculated_balance": round(prev_bal_temp + diff, 2),
            "pass": calc_diff
        })
        
        running_bal = new_bal
        
        sc_transactions.append({
            "date": tx["date"],
            "value_date": tx["value_date"],
            "description": clean_whitespace(tx["description_raw"]),
            "merchant": None,
            "category": None,
            "amount": tx["amount"],
            "transactionType": tx_type,
            "balance": tx["balance"],
            "source_bank": "Standard Chartered",
            "account_no": metadata["account_no"]
        })
        
    validations = run_reconciliation(sc_transactions, first_opening_balance, total_row, balance_checks)
    
    return {
        "metadata": metadata,
        "transactions": sc_transactions,
        "reward_points": reward_points,
        "validations": validations
    }

def finalize_tx(active_tx, desc_buffer, transactions):
    active_tx["description_raw"] = " ".join(desc_buffer)
    transactions.append(active_tx)

def clean_whitespace(text):
    return re.sub(r'\s+', ' ', text).strip()

def run_reconciliation(txs, opening_bal, total_row, balance_checks):
    credits_sum = sum(tx["amount"] for tx in txs if tx["transactionType"] == "credit")
    debits_sum = sum(tx["amount"] for tx in txs if tx["transactionType"] == "debit")
    
    op_check = abs(opening_bal - 114453.65) < 0.01
    bal_checks_pass = all(bc["pass"] for bc in balance_checks)
    failed_rows = [bc for bc in balance_checks if not bc["pass"]]
    
    tot_credits_match = False
    tot_debits_match = False
    final_bal_match = False
    
    if total_row:
        tot_credits_match = abs(credits_sum - total_row["credits"]) < 0.05
        tot_debits_match = abs(debits_sum - total_row["debits"]) < 0.05
        if txs:
            final_bal_match = abs(txs[-1]["balance"] - total_row["balance"]) < 0.05
            
    return {
        "opening_balance_match": {
            "expected": 114453.65,
            "actual": opening_bal,
            "pass": op_check
        },
        "running_balances_match": {
            "pass": bal_checks_pass,
            "failed_details": failed_rows
        },
        "totals_reconciliation": {
            "credits_sum": round(credits_sum, 2),
            "expected_credits": total_row["credits"] if total_row else None,
            "credits_pass": tot_credits_match,
            
            "debits_sum": round(debits_sum, 2),
            "expected_debits": total_row["debits"] if total_row else None,
            "debits_pass": tot_debits_match,
            
            "final_balance": txs[-1]["balance"] if txs else None,
            "expected_final_balance": total_row["balance"] if total_row else None,
            "balance_pass": final_bal_match
        },
        "needs_review": not (op_check and bal_checks_pass and tot_credits_match and tot_debits_match and final_bal_match)
    }

if __name__ == "__main__":
    pdf_file = "data/standard_chartered_statement.pdf"
    if os.path.exists(pdf_file):
        result = parse_sc_pdf(pdf_file)
        
        print("\n" + "="*50)
        print("METADATA:")
        print("="*50)
        print(json.dumps(result["metadata"], indent=2))
        
        print("\n" + "="*50)
        print("TRANSACTIONS (PREVIEW OF FIRST 3):")
        print("="*50)
        for tx in result["transactions"][:3]:
            print(json.dumps(tx, indent=2))
        print(f"... Total parsed transactions: {len(result['transactions'])}")
        
        print("\n" + "="*50)
        print("REWARD POINTS STATEMENT:")
        print("="*50)
        print("\n".join(result["reward_points"]))
        
        print("\n" + "="*50)
        print("VALIDATION SUMMARY:")
        print("="*50)
        print(json.dumps(result["validations"], indent=2))
