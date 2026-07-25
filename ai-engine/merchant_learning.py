import os
from merchant_detector import load_json_file, save_json_file, DICT_PATH, LEARNING_PATH

def save_correction(description: str, merchant: str, category: str):
    """
    Saves a user category correction.
    - Saves the raw description to corrected category mapping in merchant_learning.json.
    - Adds/Updates the merchant definition in merchant_dictionary.json.
    """
    if not description or not category:
        return {"status": "error", "message": "Description and Category are required"}
        
    # Standardize names
    merchant = merchant.strip() if merchant else description.strip()
    category = category.strip()
    desc_key = description.strip().lower()
    
    # 1. Update learning database
    learning_db = load_json_file(LEARNING_PATH)
    learning_db[desc_key] = {
        "merchant": merchant,
        "category": category
    }
    save_json_file(LEARNING_PATH, learning_db)
    
    # 2. Update merchant dictionary database
    dict_db = load_json_file(DICT_PATH)
    
    # Check if merchant already exists in dictionary
    found = False
    for m_name, info in dict_db.items():
        if m_name.lower().strip() == merchant.lower().strip():
            # Update category and set confidence to 1.0
            info["category"] = category
            info["confidence"] = 1.0
            # Ensure description keywords is present
            keywords = info.get("keywords", [])
            kw_to_add = merchant.lower().replace(" ", "")
            if kw_to_add not in keywords:
                keywords.append(kw_to_add)
            info["keywords"] = keywords
            found = True
            break
            
    if not found:
        # Create a new entry
        dict_db[merchant] = {
            "category": category,
            "keywords": [merchant.lower().replace(" ", ""), desc_key.replace(" ", "")],
            "confidence": 1.0
        }
        
    save_json_file(DICT_PATH, dict_db)
    
    print(f"Learned correction: '{description}' -> merchant: '{merchant}', category: '{category}'")
    return {"status": "success", "message": f"Successfully updated learning database for {merchant}"}
