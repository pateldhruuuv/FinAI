import os
from statement_parser_standard_chartered import parse_sc_pdf

def test_standard_chartered_parser():
    pdf_path = "data/standard_chartered_statement.pdf"
    
    # Check that test statement PDF exists
    assert os.path.exists(pdf_path), f"Sample statement PDF not found at {pdf_path}"
    
    # Run SC statement parser
    result = parse_sc_pdf(pdf_path)
    
    # 1. Assert Metadata
    metadata = result["metadata"]
    assert metadata["account_no"] == "42710540422"
    assert metadata["customer_name"] == "MR SEENIVASAN"
    assert metadata["branch"] == "Rajaji Salai"
    assert metadata["currency"] == "INR"
    assert metadata["account_type"] == "SMART BANKING SAVINGS ACCOUNT"
    assert metadata["ifsc"] == "SCBL0036078"
    assert metadata["micr"] == "600036005"
    assert metadata["branch_address"] == "19 Rajaji Salai Chennai 600001"
    
    # 2. Assert Transactions
    txs = result["transactions"]
    assert len(txs) == 51, f"Expected 51 transactions, got {len(txs)}"
    
    # Verify transaction keys
    first_tx = txs[0]
    assert "date" in first_tx
    assert "value_date" in first_tx
    assert "description" in first_tx
    assert "amount" in first_tx
    assert "transactionType" in first_tx
    assert "balance" in first_tx
    assert first_tx["source_bank"] == "Standard Chartered"
    
    # 3. Assert Validation Checks Pass
    validations = result["validations"]
    assert validations["opening_balance_match"]["pass"] is True
    assert validations["running_balances_match"]["pass"] is True
    assert validations["totals_reconciliation"]["credits_pass"] is True
    assert validations["totals_reconciliation"]["debits_pass"] is True
    assert validations["totals_reconciliation"]["balance_pass"] is True
    assert validations["needs_review"] is False
    
    # 4. Assert Reward Points Excluded but Present
    assert len(result["reward_points"]) > 0
    assert "Reward Plus 2019" in "".join(result["reward_points"])
    
    print("All SC Statement Parser tests passed successfully!")
