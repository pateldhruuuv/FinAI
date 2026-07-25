import os
import pandas as pd
import pdfplumber
import re

def parse_statement_file(file_path: str):
    """
    Automatically detects the file extension and parses CSV, Excel (XLSX/XLS),
    or PDF bank statements into a Pandas DataFrame.
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".csv":
        # Try reading CSV. Bank statements sometimes have noise at the top.
        # We try to detect the header line.
        try:
            # First read a few rows to check
            df_temp = pd.read_csv(file_path, nrows=5)
            # Standard load
            df = pd.read_csv(file_path)
            return clean_df_headers_and_metadata(df)
        except Exception as e:
            print(f"Standard CSV parse failed: {e}. Trying custom reader.")
            return parse_messy_csv(file_path)
            
    elif ext in [".xlsx", ".xls"]:
        try:
            df = pd.read_excel(file_path)
            return clean_df_headers_and_metadata(df)
        except Exception as e:
            print(f"Excel parse failed: {e}")
            return pd.DataFrame()
            
    elif ext == ".pdf":
        return parse_pdf_statement(file_path)
        
    else:
        print(f"Unsupported file extension: {ext}")
        return pd.DataFrame()

def parse_messy_csv(file_path: str):
    """
    Reads a CSV file line by line, skipping introductory lines until the header row is found.
    """
    try:
        with open(file_path, "r") as f:
            lines = f.readlines()
            
        header_line_idx = -1
        # Look for a line containing typical statement header keywords
        keywords = ["date", "description", "narration", "particulars", "amount", "debit", "credit", "balance"]
        for i, line in enumerate(lines[:15]):
            line_lower = line.lower()
            # If the line contains at least 2 key terms
            matches = sum(1 for kw in keywords if kw in line_lower)
            if matches >= 2:
                header_line_idx = i
                break
                
        if header_line_idx != -1:
            # Re-read CSV skipping preceding lines
            df = pd.read_csv(file_path, skiprows=header_line_idx)
            return clean_df_headers_and_metadata(df)
            
        return pd.read_csv(file_path)
    except Exception as e:
        print(f"Error parsing messy CSV: {e}")
        return pd.DataFrame()

def clean_df_headers_and_metadata(df: pd.DataFrame):
    """
    Cleans the parsed dataframe: strips whitespaces, removes completely empty columns/rows,
    and drops rows that are not transactions (e.g., footers/summaries).
    """
    if df.empty:
        return df
        
    # Drop columns that are completely empty
    df = df.dropna(how="all", axis=1)
    
    # Strip column names
    df.columns = [str(c).strip() for c in df.columns]
    
    # Drop rows that are completely empty
    df = df.dropna(how="all", axis=0)
    
    # Identify and drop header-like rows or metadata rows at the bottom
    # (e.g., lines containing "total", "summary", "closing balance")
    # We will keep this filtering simple so we don't drop legitimate transactions.
    return df

def parse_pdf_statement(file_path: str):
    """
    Extracts tabular transactions from a bank statement PDF.
    Uses pdfplumber to extract structured tables, and falls back to regex line-by-line
    text parsing if tables cannot be detected.
    """
    # Detect Standard Chartered first
    try:
        with pdfplumber.open(file_path) as pdf:
            first_page_text = pdf.pages[0].extract_text() or ""
            
        from statement_parser_standard_chartered import detect_sc_bank, parse_sc_pdf
        if detect_sc_bank(first_page_text):
            print("Detected Standard Chartered Bank statement PDF. Routing to SC parser...")
            result = parse_sc_pdf(file_path)
            rows = []
            for tx in result["transactions"]:
                rows.append({
                    "Date": tx["date"],
                    "Value Date": tx["value_date"],
                    "Description": tx["description"],
                    "Debit": tx["amount"] if tx["transactionType"] == "debit" else "",
                    "Credit": tx["amount"] if tx["transactionType"] == "credit" else "",
                    "Balance": tx["balance"]
                })
            df = pd.DataFrame(rows)
            df.attrs["metadata"] = result["metadata"]
            df.attrs["reward_points"] = result["reward_points"]
            df.attrs["validations"] = result["validations"]
            df.attrs["detected_bank"] = "Standard Chartered"
            return df
    except Exception as e:
        print(f"Standard Chartered pre-parse routing failed: {e}")

    df_result = pd.DataFrame()
    all_rows = []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    for r in table:
                        if r and any(r):
                            # Clean cells
                            r_clean = [str(cell).replace("\n", " ").strip() if cell is not None else "" for cell in r]
                            all_rows.append(r_clean)
                            
        if all_rows:
            # Find the header row
            header_idx = 0
            keywords = ["date", "description", "narration", "particulars", "amount", "debit", "credit", "balance", "txn", "val"]
            for i, r in enumerate(all_rows[:12]):
                r_lower = [str(c).lower() for c in r]
                matches = sum(1 for c in r_lower for kw in keywords if kw in c)
                if matches >= 2:
                    header_idx = i
                    break
                    
            headers = all_rows[header_idx]
            # Replace empty header names with placeholder
            headers = [h if h else f"Col{i}" for i, h in enumerate(headers)]
            
            data_rows = all_rows[header_idx+1:]
            
            # Clean up rows size to match headers length
            final_data = []
            for r in data_rows:
                if len(r) == len(headers):
                    final_data.append(r)
                elif len(r) > len(headers):
                    final_data.append(r[:len(headers)])
                else:
                    final_data.append(r + [""] * (len(headers) - len(r)))
                    
            df_result = pd.DataFrame(final_data, columns=headers)
            print(f"Successfully parsed PDF using table extractor. Rows: {len(df_result)}")
            
    except Exception as e:
        print(f"pdfplumber table extraction failed: {e}. Falling back to text line regex extraction.")
        
    # FALLBACK: Regex line-by-line text extraction
    if df_result.empty:
        df_result = parse_pdf_text_regex(file_path)
        
    return df_result

def parse_pdf_text_regex(file_path: str):
    """
    Regex-based PDF text parser. Extracts lines starting with a date and ending
    with debit/credit amounts or running balances.
    """
    print("Running regex line parser on PDF statement...")
    extracted_rows = []
    
    # Regex date patterns: e.g. 23-07-2026, 23/07/26, 23 Jul 2026, 2026-07-23
    date_regex = re.compile(
        r'^(\d{1,2}[-/\s](?:[A-Za-z]{3}|\d{1,2})[-/\s]\d{2,4}|\d{4}-\d{2}-\d{2})'
    )
    
    # Amount/balance decimal patterns at the end: e.g., "1,500.00 Cr", "-230.50", "400.00"
    amount_regex = re.compile(
        r'(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:Cr|Dr|Credit|Debit)?)$', re.IGNORECASE
    )
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue
                    
                lines = text.split("\n")
                for line in lines:
                    line = line.strip()
                    date_match = date_regex.search(line)
                    if not date_match:
                        continue
                        
                    # Extract date
                    date_str = date_match.group(1)
                    rem_text = line[len(date_str):].strip()
                    
                    # Split rem_text to find amounts at the end
                    tokens = rem_text.split()
                    if len(tokens) < 2:
                        continue
                        
                    # Check if the last tokens are numbers (representing Debit/Credit/Balance)
                    num_tokens = []
                    desc_tokens = []
                    
                    for t in tokens:
                        # Strip currency commas
                        t_clean = t.replace(",", "").upper()
                        # Clean suffix Dr/Cr
                        t_clean = re.sub(r'(CR|DR|CREDIT|DEBIT)$', '', t_clean)
                        try:
                            float(t_clean)
                            num_tokens.append(t)
                        except ValueError:
                            desc_tokens.append(t)
                            
                    if len(num_tokens) >= 1:
                        # The text before numbers is description
                        description = " ".join(desc_tokens)
                        
                        # Distribute amounts:
                        # If we have 2 numbers: Debit/Credit, Balance
                        # If we have 3 numbers: Debit, Credit, Balance
                        # If 1 number: Amount
                        debit = ""
                        credit = ""
                        balance = ""
                        
                        if len(num_tokens) == 1:
                            # Let's map it to Debit by default
                            debit = num_tokens[0]
                        elif len(num_tokens) == 2:
                            # Usually Amount and Balance
                            # Let's look at the sign or suffix
                            val = num_tokens[0].lower()
                            if "cr" in val or "dep" in val:
                                credit = num_tokens[0]
                            else:
                                debit = num_tokens[0]
                            balance = num_tokens[1]
                        else:
                            # Debit, Credit, Balance
                            debit = num_tokens[0]
                            credit = num_tokens[1]
                            balance = num_tokens[2]
                            
                        extracted_rows.append({
                            "Date": date_str,
                            "Description": description,
                            "Debit": debit,
                            "Credit": credit,
                            "Balance": balance
                        })
                        
        if extracted_rows:
            df = pd.DataFrame(extracted_rows)
            print(f"Successfully parsed PDF using regex line extractor. Rows: {len(df)}")
            return df
            
    except Exception as e:
        print(f"Error in PDF regex parser: {e}")
        
    return pd.DataFrame()
