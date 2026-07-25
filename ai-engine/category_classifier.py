import os
import pickle
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from merchant_detector import clean_description

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "transaction_category_model.pkl")
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "transaction_dataset.csv")

# Global model cache
_cached_pipeline = None

def train_classifier():
    """
    Trains an ML categorization model (TF-IDF + Random Forest) using the synthetic 
    dataset generated in generate_statement_data.py. Saves the model to models/.
    """
    print("Training AI Transaction Categorization Model...")
    
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Training dataset not found at {DATA_PATH}. Please run generate_statement_data.py first.")
        
    df = pd.read_csv(DATA_PATH)
    
    # Preprocess text features
    df["CleanDescription"] = df["description"].apply(clean_description)
    df["Merchant"] = df["merchant"].fillna("Unknown")
    
    # Combine merchant and description for TF-IDF feature input
    df["TextFeature"] = df["Merchant"] + " " + df["CleanDescription"]
    
    X = df["TextFeature"]
    y = df["category"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)
    
    # Create ML pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=2500, ngram_range=(1, 2))),
        ('classifier', RandomForestClassifier(n_estimators=60, max_depth=20, random_state=42, n_jobs=-1))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # Evaluation
    train_score = pipeline.score(X_train, y_train)
    test_score = pipeline.score(X_test, y_test)
    
    print(f"Model Training Complete! Train Acc: {train_score:.2f}, Test Acc: {test_score:.2f}")
    
    # Ensure models directory exists
    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)
        
    print(f"Saved category model to {MODEL_PATH}")
    
    # Update global cache
    global _cached_pipeline
    _cached_pipeline = pipeline
    return pipeline

def classify_transaction(description: str, merchant: str, amount: float):
    """
    Predicts the category and provides a confidence score for a transaction description.
    """
    global _cached_pipeline
    
    if _cached_pipeline is None:
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    _cached_pipeline = pickle.load(f)
            except Exception as e:
                print(f"Error loading category model: {e}")
                
        # If still None, train it on demand
        if _cached_pipeline is None:
            try:
                _cached_pipeline = train_classifier()
            except Exception as e:
                print(f"Could not train model: {e}. Falling back to default rules.")
                return "Miscellaneous", 0.5
                
    # Prepare input text
    cleaned_desc = clean_description(description)
    feature_text = f"{merchant} {cleaned_desc}"
    
    try:
        # Predict class probabilities
        probs = _cached_pipeline.predict_proba([feature_text])[0]
        classes = _cached_pipeline.classes_
        
        max_idx = np.argmax(probs)
        predicted_cat = classes[max_idx]
        confidence = float(probs[max_idx])
        
        return predicted_cat, round(confidence, 2)
    except Exception as e:
        print(f"Prediction failed: {e}")
        return "Miscellaneous", 0.5

if __name__ == "__main__":
    train_classifier()
