import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import csv

# Set seeds for reproducibility
random.seed(42)
np.random.seed(42)

# Ensure folders exist
os.makedirs("data", exist_ok=True)
os.makedirs("data/sample_statements", exist_ok=True)

# Categories list
CATEGORIES = [
    "Entertainment", "Food", "Shopping", "Travel", "Bills", "Insurance", 
    "Investment", "Medical", "Education", "Salary", "Transfer", "ATM", 
    "Fuel", "Groceries", "Utilities", "Taxes", "Miscellaneous"
]

# Define base merchant patterns for generating 500 merchants
MERCHANT_TEMPLATES = {
    "Entertainment": ["Netflix", "Spotify", "Disney+", "Prime Video", "Apple Music", "BookMyShow", "Steam", "Xbox", "Playstation", "Youtube Premium", "Hotstar", "Zee5", "SonyLIV", "Audible", "Nintendo"],
    "Food": ["Zomato", "Swiggy", "Starbucks", "McDonalds", "Domino's", "Pizza Hut", "Subway", "KFC", "Burger King", "Chai Point", "Haldirams", "Baskin Robbins", "Barbeque Nation", "Cafe Coffee Day", "Tacobell"],
    "Shopping": ["Amazon", "Flipkart", "Myntra", "Ajio", "Nykaa", "Zara", "H&M", "Decathlon", "Tata Cliq", "Reliance Digital", "Lenskart", "Uniqlo", "Lifestyle", "Shoppers Stop", "Westside"],
    "Travel": ["Uber", "Ola", "MakeMyTrip", "Goibibo", "Yatra", "Indigo", "Air India", "IRCTC", "Redbus", "Zoomcar", "Booking.com", "Agoda", "Expedia", "Cleartrip", "Rapido"],
    "Groceries": ["BigBasket", "Blinkit", "Instamart", "Zepto", "DMart", "Reliance Smart", "Nature's Basket", "More Retail", "Spencer's", "Jiomart", "Star Bazar", "Patangali", "Local Kirana"],
    "Utilities": ["BESCOM", "BSES", "Tata Power", "MSEDCL", "Airtel Fiber", "JioFiber", "Act Fibernet", "Hathway", "Airtel Mobile", "Jio Mobile", "Vi Mobile", "Tata Play", "DishTV"],
    "Bills": ["Indane Gas", "HP Gas", "Bharat Gas", "Municipal Water", "Property Tax Bill", "Broadband Bill", "Mobile Bill", "Electricity Bill"],
    "Insurance": ["LIC", "SBI Life", "HDFC Ergo", "ICICI Prudential", "Max Life", "Care Health", "Niva Bupa", "Star Health", "Bajaj Allianz", "Tata AIG"],
    "Investment": ["HDFC Mutual Fund", "SBI Mutual Fund", "ICICI Prudential MF", "Groww", "Zerodha", "Angel One", "Upstox", "Kuvera", "Coin", "Nippon India MF"],
    "Medical": ["Apollo Pharmacy", "Pharmeasy", "1mg", "Netmeds", "Medplus", "Fortis Hospital", "Max Healthcare", "Apollo Hospital", "SRL Diagnostics", "Lal PathLabs"],
    "Education": ["Udemy", "Coursera", "Edx", "Byjus", "Unacademy", "Simplilearn", "School Fee", "College Tuition", "Book Store", "Stationery Shop"],
    "Fuel": ["Indian Oil", "HP Pump", "Bharat Petroleum", "Shell", "CNG Station", "Reliance Petroleum"],
    "Transfer": ["Self Transfer", "Rent Pay", "Father Account", "Mother Account", "Friend Transfer", "House Owner", "Roommate"],
    "ATM": ["SBI ATM", "HDFC ATM", "ICICI ATM", "Axis ATM", "Kotak ATM", "Canara ATM", "Union Bank ATM", "PNB ATM"],
    "Salary": ["TCS Salary", "Infosys Salary", "Wipro Salary", "HDFC Corp Salary", "Accenture Salary", "Google India Salary", "Cognizant Salary", "Tech Mahindra Salary"],
    "Taxes": ["Income Tax Refund", "GST Payment", "TDS Deducted", "Tax Department"],
    "Miscellaneous": ["Local Store", "Cash Deposit", "Interest Earned", "Refund Received", "General Expense"]
}

# Generate 500 merchants
merchant_list = []
merchant_dict = {}

# Seed initial dictionaries with known high confidence keywords
known_merchants = {
    "Netflix": {"category": "Entertainment", "keywords": ["netflix", "netflixindia"], "confidence": 1.0},
    "Spotify": {"category": "Entertainment", "keywords": ["spotify", "spotify premium"], "confidence": 1.0},
    "Zomato": {"category": "Food", "keywords": ["zomato", "zomato online"], "confidence": 1.0},
    "Swiggy": {"category": "Food", "keywords": ["swiggy", "swiggy payment"], "confidence": 1.0},
    "Uber": {"category": "Travel", "keywords": ["uber", "uber trip"], "confidence": 1.0},
    "Ola": {"category": "Travel", "keywords": ["ola", "olacabs", "ola trip"], "confidence": 1.0},
    "Amazon": {"category": "Shopping", "keywords": ["amazon", "amzn", "amazon seller services"], "confidence": 1.0},
    "Flipkart": {"category": "Shopping", "keywords": ["flipkart", "flipkart payment"], "confidence": 1.0},
    "LIC": {"category": "Insurance", "keywords": ["lic of india", "lic life", "lic premium"], "confidence": 1.0},
    "SBI Life": {"category": "Insurance", "keywords": ["sbi life", "sbi life insurance"], "confidence": 1.0},
    "HDFC Mutual Fund": {"category": "Investment", "keywords": ["hdfc mf", "hdfc mutual fund", "hdfc sip"], "confidence": 1.0},
    "Groww": {"category": "Investment", "keywords": ["groww", "nextbillion"], "confidence": 1.0},
    "Zerodha": {"category": "Investment", "keywords": ["zerodha", "zerodha broking"], "confidence": 1.0}
}

for m_name, info in known_merchants.items():
    merchant_dict[m_name] = info
    merchant_list.append({"name": m_name, "category": info["category"], "keywords": info["keywords"], "confidence": info["confidence"]})

# Generate up to 500 merchants by adding suffixes
counter = len(merchant_list)
cat_keys = list(MERCHANT_TEMPLATES.keys())
while counter < 500:
    cat = random.choice(cat_keys)
    base = random.choice(MERCHANT_TEMPLATES[cat])
    m_name = f"{base} {random.randint(10, 999)}"
    if m_name not in merchant_dict:
        kw = [m_name.lower().replace(" ", "")]
        merchant_dict[m_name] = {
            "category": cat,
            "keywords": kw,
            "confidence": round(random.uniform(0.75, 0.95), 2)
        }
        merchant_list.append({"name": m_name, "category": cat, "keywords": kw, "confidence": merchant_dict[m_name]["confidence"]})
        counter += 1

# Save merchant dictionary JSON
with open("data/merchant_dictionary.json", "w") as f:
    json.dump(merchant_dict, f, indent=2)

print(f"Created merchant dictionary with {len(merchant_dict)} merchants.")

# Define 100 subscriptions
subscriptions_pool = []
sub_names = ["Netflix", "Spotify", "Disney+", "Prime Video", "Apple Music", "Google One", "Adobe Creative Cloud", "Microsoft 365", "Youtube Premium", "Github Copilot", "ChatGPT Plus", "Zoom Premium", "Dropbox", "Canva", "NYT Subscription"]
intervals = ["Monthly", "Quarterly", "Yearly"]

for i in range(100):
    name = f"{random.choice(sub_names)} {random.randint(1, 100)}"
    interval = random.choice(intervals)
    cost = random.choice([199, 299, 499, 699, 999, 1499, 2999])
    subscriptions_pool.append({
        "name": name,
        "interval": interval,
        "cost": cost,
        "category": "Entertainment" if any(x in name for x in ["Netflix", "Spotify", "Disney", "Prime", "Apple", "Youtube"]) else "Utilities"
    })

# Helper to generate description
def make_txn_description(merchant, category):
    pref = random.choice(["UPI", "POS", "NEFT", "IMPS", "ACH", "CHG", "ATM"])
    ref = random.randint(100000000000, 999999999999)
    if pref == "UPI":
        return f"UPI/{merchant.upper().replace(' ', '')}/{ref}/Payment"
    elif pref == "POS":
        return f"POS {merchant.upper()} MUMBAI IN"
    elif pref == "NEFT":
        return f"NEFT-{ref}-{merchant.upper()}-TRANSFER"
    else:
        return f"{pref} {merchant.upper()} TXN {random.randint(1000, 9999)}"

# Generate 10,000 transactions
start_date = datetime(2025, 7, 23)
end_date = datetime(2026, 7, 23)
days_diff = (end_date - start_date).days

transactions = []
current_balance = 150000.0

# Pre-generate subscription transactions
sub_txns = []
for sub in subscriptions_pool:
    sub_name = sub["name"]
    cost = sub["cost"]
    cat = sub["category"]
    interval = sub["interval"]
    
    sub_date = datetime(2025, 8, 1) + timedelta(days=random.randint(0, 15))
    while sub_date < end_date:
        desc = make_txn_description(sub_name, cat)
        sub_txns.append({
            "date": sub_date.strftime("%Y-%m-%d"),
            "description": desc,
            "merchant": sub_name,
            "category": cat,
            "amount": cost,
            "transactionType": "Debit",
            "balance": 0.0
        })
        if interval == "Monthly":
            sub_date += timedelta(days=30)
        elif interval == "Quarterly":
            sub_date += timedelta(days=90)
        else:
            sub_date += timedelta(days=365)

# Pre-generate recurring EMI / Salaries
recurring_txns = []
salaries = [
    {"name": "Google India Salary", "amount": 150000, "day": 1},
    {"name": "TCS Salary", "amount": 80000, "day": 1},
    {"name": "Infosys Salary", "amount": 65000, "day": 28},
    {"name": "Accenture Salary", "amount": 95000, "day": 30},
    {"name": "Wipro Salary", "amount": 55000, "day": 30}
]
for sal in salaries:
    sal_date = datetime(2025, 8, sal["day"])
    while sal_date < end_date:
        desc = f"ACH CREDIT {sal['name'].upper()} SALARY"
        recurring_txns.append({
            "date": sal_date.strftime("%Y-%m-%d"),
            "description": desc,
            "merchant": sal["name"],
            "category": "Salary",
            "amount": sal["amount"],
            "transactionType": "Credit",
            "balance": 0.0
        })
        sal_date += timedelta(days=30)

# Rent payments
rent_dates = datetime(2025, 8, 5)
while rent_dates < end_date:
    desc = "UPI/Rent Owner/3817293817/RENT"
    recurring_txns.append({
        "date": rent_dates.strftime("%Y-%m-%d"),
        "description": desc,
        "merchant": "Rent Pay",
        "category": "Transfer",
        "amount": random.choice([12000, 15000, 18000, 22000]),
        "transactionType": "Debit",
        "balance": 0.0
    })
    rent_dates += timedelta(days=30)

# EMI payments
emi_dates = datetime(2025, 8, 10)
while emi_dates < end_date:
    desc = "ACH DEBIT HDFC HOME LOAN EMI"
    recurring_txns.append({
        "date": emi_dates.strftime("%Y-%m-%d"),
        "description": desc,
        "merchant": "HDFC Loan Dept",
        "category": "Bills",
        "amount": random.choice([15000, 25000, 35000]),
        "transactionType": "Debit",
        "balance": 0.0
    })
    emi_dates += timedelta(days=30)

transactions.extend(sub_txns)
transactions.extend(recurring_txns)

# Fill up the rest to reach 10,000
remaining = 10000 - len(transactions)
for _ in range(remaining):
    tx_date = start_date + timedelta(days=random.randint(0, days_diff))
    m = random.choice(merchant_list)
    m_name = m["name"]
    cat = m["category"]
    
    if cat in ["Salary", "Taxes"] and random.random() > 0.05:
        continue
        
    amount = 0.0
    tx_type = "Debit"
    
    if cat == "Salary":
        amount = random.randint(30000, 120000)
        tx_type = "Credit"
    elif cat == "Investment":
        amount = random.choice([5000, 10000, 20000, 50000])
        tx_type = "Debit"
    elif cat == "Shopping":
        amount = round(random.uniform(200, 15000), 2)
    elif cat == "Food":
        amount = round(random.uniform(100, 3000), 2)
    elif cat == "Travel":
        amount = round(random.uniform(50, 2500), 2)
    elif cat == "Entertainment":
        amount = round(random.uniform(150, 1500), 2)
    elif cat == "ATM":
        amount = random.choice([1000, 2000, 5000, 10000])
    elif cat == "Transfer":
        amount = round(random.uniform(500, 20000), 2)
        tx_type = random.choice(["Debit", "Credit"])
    else:
        amount = round(random.uniform(100, 5000), 2)
        
    desc = make_txn_description(m_name, cat)
    
    transactions.append({
        "date": tx_date.strftime("%Y-%m-%d"),
        "description": desc,
        "merchant": m_name,
        "category": cat,
        "amount": amount,
        "transactionType": tx_type,
        "balance": 0.0
    })

transactions.sort(key=lambda x: x["date"])

# Compute running balance
for t in transactions:
    if t["transactionType"] == "Credit":
        current_balance += t["amount"]
    else:
        current_balance -= t["amount"]
    t["balance"] = round(current_balance, 2)

df = pd.DataFrame(transactions)
df.to_csv("data/transaction_dataset.csv", index=False)
print(f"Saved 10,000 synthetic transactions to data/transaction_dataset.csv")

# ----------------- Generate Sample Statements for Banks -----------------
banks = ["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Canara", "Bank of Baroda"]

bank_headers = {
    "SBI": ["Txn Date", "Value Date", "Description", "Debit", "Credit", "Balance"],
    "ICICI": ["Date", "Narration", "Withdrawal", "Deposit", "Balance"],
    "HDFC": ["Date", "Narration", "Debit", "Credit"],
    "Axis": ["Transaction Date", "Value Date", "Particulars", "Debit", "Credit", "Running Balance"],
    "Kotak": ["Date", "Transaction Details", "Dr Amount", "Cr Amount", "Balance"],
    "Canara": ["Date", "Description", "Withdrawal (Dr)", "Deposit (Cr)", "Balance"],
    "Bank of Baroda": ["Txn Date", "Particulars", "Debit", "Credit", "Balance"]
}

def map_normalized_to_bank(tx, bank):
    headers = bank_headers[bank]
    mapped = {}
    
    date_val = tx["date"]
    desc_val = tx["description"]
    amount = tx["amount"]
    tx_type = tx["transactionType"]
    balance = tx["balance"]
    
    debit_val = amount if tx_type == "Debit" else ""
    credit_val = amount if tx_type == "Credit" else ""
    
    for h in headers:
        hl = h.lower()
        if "date" in hl:
            mapped[h] = date_val
        elif any(x in hl for x in ["description", "narration", "particulars", "details"]):
            mapped[h] = desc_val
        elif any(x in hl for x in ["debit", "withdrawal", "dr"]):
            mapped[h] = debit_val
        elif any(x in hl for x in ["credit", "deposit", "cr"]):
            mapped[h] = credit_val
        elif "balance" in hl:
            mapped[h] = balance
            
    return mapped

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    reportlab_installed = True
except ImportError:
    reportlab_installed = False
    print("ReportLab not found, PDF generation will be simple text layout")

def generate_pdf_statement(filename, bank_name, headers, rows):
    if not reportlab_installed:
        with open(filename, "w") as f:
            f.write(f"BANK STATEMENT FOR {bank_name.upper()}\n\n")
            f.write(",".join(headers) + "\n")
            for r in rows:
                f.write(",".join([str(r.get(h, '')) for h in headers]) + "\n")
        return
        
    doc = SimpleDocTemplate(filename, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    title_style = ParagraphStyle(
        'BankTitle',
        parent=styles['Heading1'],
        textColor=colors.HexColor("#1e3a8a"),
        fontSize=18,
        spaceAfter=10
    )
    story.append(Paragraph(f"{bank_name} Bank Statement", title_style))
    story.append(Paragraph("Account No: XXXXXX9988 | Period: Mock Statements", styles['Normal']))
    story.append(Spacer(1, 10))
    
    table_data = [headers]
    for r in rows:
        row_data = [str(r.get(h, '')) for h in headers]
        table_data.append(row_data)
        
    t = Table(table_data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 4),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#f9fafb")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
        ('FONTSIZE', (0,0), (-1,-1), 8),
    ]))
    
    story.append(t)
    doc.build(story)

for bank in banks:
    sample_txs = random.sample(transactions, 30)
    sample_txs.sort(key=lambda x: x["date"])
    
    headers = bank_headers[bank]
    mapped_rows = [map_normalized_to_bank(tx, bank) for tx in sample_txs]
    df_bank = pd.DataFrame(mapped_rows)
    
    # CSV
    csv_file = f"data/sample_statements/{bank.lower()}_statement.csv"
    df_bank.to_csv(csv_file, index=False)
    
    # XLSX
    xlsx_file = f"data/sample_statements/{bank.lower()}_statement.xlsx"
    df_bank.to_excel(xlsx_file, index=False)
    
    # PDF
    pdf_file = f"data/sample_statements/{bank.lower()}_statement.pdf"
    generate_pdf_statement(pdf_file, bank, headers, mapped_rows)

print("Generated sample statement files in CSV, XLSX, and PDF formats.")
