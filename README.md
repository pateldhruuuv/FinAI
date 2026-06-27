# FinPilot AI - Personal Financial Advisor MVP

FinPilot AI is a Personal Financial Advisor web application that helps users monitor their transactions, evaluate their Financial Health Score, get customized investment and insurance portfolios, and converse with a finance AI assistant.

This application is built as a major college project MVP combining the **MERN (MongoDB, Express, React, Node.js) Stack** and a **Python FastAPI AI Engine** powered by Scikit-Learn.

---

## Folder Structure

```
d:/FinAI/
├── ai-engine/             # Python FastAPI + Pandas + Scikit-Learn
│   ├── data/              # Programmatically generated CSV training data
│   ├── models/            # Sverialized trained Scikit-Learn models
│   ├── generate_data.py   # Programmatic dataset generator
│   ├── train.py           # ML training script (Random Forest, Decision Tree)
│   ├── main.py            # FastAPI endpoints and rule-based chat logic
│   └── requirements.txt   # Python service dependencies
│
├── backend/               # Node.js + Express.js gateway server
│   ├── config/            # MongoDB/Mongoose setup
│   ├── controllers/       # Auth, Transactions (CSV parsing & dashboards), and AI proxies
│   ├── middleware/        # JWT security authorization middleware
│   ├── models/            # MongoDB schemas (User, Transaction, Recommendation, ChatHistory)
│   ├── routes/            # Routes endpoints mounting
│   ├── uploads/           # Temporary uploads directory (Multer target)
│   ├── .env               # Backend configuration variables
│   ├── package.json       # Backend dependencies config
│   └── server.js          # Express app entry point
│
├── frontend/              # React.js SPA (Vite builder)
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Navbar and Route protections
│   │   ├── context/       # Auth Context API and default Axios setups
│   │   ├── pages/         # Landing, Login, Register, Dashboard, Advisors, Upload, Chat
│   │   ├── styles/        # global.css dark-mode/glassmorphism design token styles
│   │   ├── App.js         # Navigation router structure
│   │   └── index.js       # React bootstrap entry point
│   ├── index.html         # HTML root page template
│   ├── vite.config.js     # Bundler and esbuild parser configuration
│   └── package.json       # React dependencies config
│
├── sample_statement.csv   # Standard template CSV for upload testing
└── postman_collection.json# Postman JSON file containing pre-configured request cases
```

---

## Tech Stack Summary

*   **Frontend:** React.js, React Router, Axios, Recharts (visualizations), Context API, Lucide React (icons), Custom CSS (premium glassmorphism theme).
*   **Backend Gateway:** Node.js, Express.js, MongoDB (via Mongoose), JWT (session security), Multer (multipart file uploading), CSV-Parser.
*   **AI Engine Service:** Python FastAPI, Uvicorn, Scikit-Learn, Pandas, Numpy.
    *   *Financial Health Classifier:* Random Forest Classifier.
    *   *Investment Advisor Classifier:* Decision Tree Classifier.
    *   *Insurance Advisor Classifier/Regressor:* Decision Tree + Random Forest Regressor (coverage amount).
    *   *Finance Chatbot:* Rule-based matching engine.

---

## Setup & Running the Services Locally

Ensure you have **Node.js (v18+)**, **Python (v3.11+)**, and a local instance of **MongoDB** running.

### 1. MongoDB Setup
Make sure MongoDB is running locally on port `27017` (default). The backend will automatically create the `finpilot` database.
*   If your URI is different, edit `backend/.env`.

---

### 2. Setup & Start the Python AI Engine

1.  Open a terminal inside the `ai-engine/` folder:
    ```bash
    cd ai-engine
    ```
2.  Install dependencies into a virtual environment (already set up):
    *   To manually run the installer:
        ```bash
        python -m venv venv
        venv\Scripts\pip install fastapi uvicorn pandas scikit-learn pydantic numpy python-multipart jinja2
        ```
3.  Generate datasets and train the ML models:
    ```bash
    venv\Scripts\python generate_data.py
    venv\Scripts\python train.py
    ```
4.  Start the FastAPI server:
    ```bash
    venv\Scripts\uvicorn main:app --port 8000 --reload
    ```
    The engine will run at `http://127.0.0.1:8000`.

---

### 3. Setup & Start the Express Backend Server

1.  Open a new terminal inside the `backend/` folder:
    ```bash
    cd backend
    ```
2.  Install packages (already installed):
    ```bash
    npm install
    ```
3.  Configure variables in the `.env` file if needed (e.g. `JWT_SECRET`, `MONGO_URI`).
4.  Start the dev server:
    ```bash
    npm run dev
    ```
    The server will run at `http://localhost:5000`.

---

### 4. Setup & Start the React Frontend App

1.  Open a new terminal inside the `frontend/` folder:
    ```bash
    cd frontend
    ```
2.  Install packages (already installed):
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm start
    ```
    Open `http://localhost:3000` in your browser.

---

## Phase 2 Features Added
*   **Goal Planner:** Set financial milestones, compute savings rates, and get probability calculations.
*   **Trip Planner:** Vacations cost estimator with alternative destination safety routing.
*   **Debt Rescue:** Risk analysis score, high-interest priority payback lists, and avalanche payback models.
*   **Subscription Leakage:** Scans transaction logs for recurring premium leakage (Netflix, Spotify, Gym, Cloud).
*   **Retirement Planner:** FastAPI Scikit-learn Linear Regression projected retirement growth curves.
*   **Emergency Fund:** Safety buffer limits (3M/6M/12M) and readiness quotients.
*   **Financial Forecast:** M-o-M linear regression prediction maps for savings/expenses.
*   **Spending Insights:** Pandas EDA summaries and dark-mode Seaborn Heatmap diagrams.
*   **Smart Alerts:** Diagnostics warnings (Savings drops, high spends, EMI load, off-track goals).
*   **AI Recommendations:** Algorithmic wealth improvement action items history.

---

## Migration and Setup

### 1. Python Environment updates
Before starting the FastAPI AI Engine, install the new plotting and modeling dependencies:
```bash
cd ai-engine
venv\Scripts\pip install -r requirements.txt
```

### 2. Seeding Test Data (2000 Records)
To populate 500 Goal, 500 Trip, 500 Debt, and 500 Forecast records linked to a dummy test user (`seeduser@finpilot.com`), run the seeder script in the `backend/` directory:
```bash
cd backend
node seedTestData.js
```

---

## Testing Guide

1.  **Register a new user:** Navigate to `http://localhost:3000/register` and enter your details (e.g., Income: 80,000, Age: 29).
2.  **Upload Statement:** Go to the "Upload CSV" page and select `sample_statement.csv` (located at the project root). Submit the file.
3.  **Explore Dashboard:** Switch between tab sections (**Overview, Goal Tracker, Trip Planner, Debt & Subscriptions, Retirement & Forecasts, Alerts**) to interact with all the new Phase 2 features.
4.  **Run Diagnostics:** Click "Run AI Diagnostic" on the dashboard to trigger the Random Forest classifier and view your predicted health rating and recommendations.
5.  **Get Asset Recommendations:** Go to the "Investments" tab, pick a risk level (Conservative, Moderate, Aggressive), and evaluate your Decision Tree portfolio results.
6.  **Get Insurance Coverage:** Go to the "Insurance" tab, fill in dependents/marital status, and view your coverage requirements.
7.  **Chat with Assistant:** Go to the "AI Assistant" tab, click the quick chips (e.g., "Can I invest?"), or type custom questions to test the chatbot's rule-based financial advice.

### Automated API Integration Tests
To run the automated integration tests across all 9 endpoints, start both Express and FastAPI servers and run:
```bash
cd backend
node testEndpoints.js
```

### Postman Collections
Import `postman_collection.json` into Postman. A new `Phase 2 Planners` folder has been added containing pre-configured request payloads for all 8 main planner APIs.
