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

## Phase 3 Features Added (Premium)
*   **Premium Hub / Dashboard:** Unified overview widgets displaying Net Worth, Portfolio Pie Charts, Net Worth Trends, Goal horizontal progress bars, and Digital Twin metrics.
*   **Tax Optimization Advisor:** Dynamic Old vs New tax calculators (FY 2024-25), HRA Section 10(13A) exemptions, and actionable ELSS/NPS tax-saving strategies.
*   **Loan Eligibility Advisor:** PV annuity-based borrowing limit calculator for Home, Car, Personal, and Education loans, plus safety EMI ratios.
*   **Insurance Gap Analysis:** Calculates the protection deficit index based on annual income and dependents, recommending Term Life vs Family Health policies.
*   **Purchase Advisor:** Scoring index (0-100) analyzing if a planned purchase (iPhone, Bike, Laptop) compromises active savings/goals, suggesting refurbished or second-hand options.
*   **What-If Simulator:** Projects the impact of milestones (Job loss, salary hike, marriage, home purchase) on future savings, debt levels, and goal delays.
*   **Portfolio Risk Analyzer:** Evaluates asset holding weights (Stocks, Funds, Gold, FD, Crypto, Property), calculating risk index, rebalancing suggestions, and rendering pie charts.
*   **AI Financial Coach:** Profile-aware contextual chat advisor that answers complex budgeting and affordability questions.
*   **Financial Digital Twin:** Dynamic profile engine simulating Financial Age, Risk Level, Savings/Investment Personalities, and Stability Scores.
*   **Financial Reports Engine:** Generates and exports beautiful, structured Monthly/Quarterly/Yearly statements in PDF (using pdfkit) and CSV formats.

---

## Migration and Setup

### 1. Python Environment updates
Before starting the FastAPI AI Engine, install the new plotting and modeling dependencies:
```bash
cd ai-engine
venv\Scripts\pip install -r requirements.txt
```

### 2. Seeding Test Data
We have two seeder scripts inside the `backend/` directory:

- **Phase 2 Seeder** (seeds Goals, Trips, Debts, and Forecasts for dummy user `seeduser@finpilot.com`):
  ```bash
  cd backend
  node seedTestData.js
  ```
- **Phase 3 Premium Seeder** (seeds 500 Premium Users, 1000 Purchase History records, 500 Portfolios, 500 Loans, and sample Tax/Insurance data):
  ```bash
  cd backend
  node seedPremiumData.js
  ```

---

## Testing Guide

1.  **Register a new user:** Navigate to `http://localhost:3000/register` and enter your details (starts as a Free tier user).
2.  **Toggle Trial Premium Mode:** In the navigation bar, toggle the switch to **Go Premium** or **Go Free** to test tier-based access control.
3.  **Explore Premium Hub:** When Premium status is active, click **Premium Hub** to explore widgets and dynamic Seaborn charts.
4.  **Test Premium Advisors:** Open the Tax, Loan, Insurance, Purchase, or What-If advisors via the sidebar navigation and fill out values to get real-time evaluations.
5.  **Chat with AI Coach:** Open the **AI Financial Coach** and select suggestion chips (e.g., "Can I afford Goa trip?") to test profile-aware chat.
6.  **Download PDF Reports:** Go to **Financial Reports**, select PDF, and download your consolidated statements.

### Automated API Integration Tests
We have two automated test suites in the `backend/` directory:

- **Phase 2 Tests**:
  ```bash
  cd backend
  node testEndpoints.js
  ```
- **Phase 3 Premium Tests** (verifies Premium Access Control, toggling, and all 9 premium routes):
  ```bash
  cd backend
  node testPremiumEndpoints.js
  ```

### Postman Collections
- **Phase 2**: Use `postman_collection.json` at the root.
- **Phase 3 Premium**: Use `backend/postman_collection_v2.json` containing endpoints for all 9 premium advisory APIs.
- **Phase 5 Statement Hub**: Use `postman_collection_phase5.json` in the root.

---

## Phase 5 Features Added (Universal Bank Statement Parser & AI Transaction Categorization)

*   **Universal Statement Parser**: Parses CSV, XLSX, and PDF formats for major banks like SBI, HDFC, ICICI, Axis, Kotak, Canara, BoB, etc., using table extraction and regex line-by-line fallback.
*   **Dynamic Column Mapping**: Identifies bank column variants (e.g. `Narration`/`Description`, `Dr Amount`/`Debit`) and maps them to standard terms.
*   **Transaction Normalization**: Unifies all statements into a single schema: `date`, `description`, `merchant`, `category`, `amount`, `transactionType`, `balance`.
*   **Merchant Recognition Engine**: Cleans messy descriptions and matches brand keywords using regex cleaning and database matching.
*   **AI Transaction Categorizer**: Uses a TF-IDF + Random Forest model (87% Test Acc) to categorize transactions into 17 standard budget groups.
*   **Active Learning System**: Captures user category corrections in a JSON database and retrains future classifications.
*   **Subscription Detection**: Group-by interval scanning identifying monthly/yearly billing costs and renewal schedules.
*   **Recurring Payments Dashboard**: Tracks EMIs, Rent, Utilities, Salaries, and Insurance Premiums.
*   **Merchant Analytics Dashboard**: Generates Seaborn pie charts and inflow/outflow cash flow graphs encoded in base64.

### New API Endpoints
*   `POST /upload-statement` - Upload statement, run AI engine, normalized output save.
*   `GET /transactions` - Fetch user's normalized transactions.
*   `GET /subscriptions` - Fetch detected subscriptions.
*   `GET /merchant-analysis` - Fetch merchant spend and base64 Seaborn plots.
*   `GET /expense-summary` - Fetch cash flow metrics.
*   `POST /update-category` - Save user correction and update learning database.

### Running Phase 5 Integration Tests
To test the statement parser end-to-end:
```bash
cd backend
node testStatementParser.js
```
Make sure MongoDB, the FastAPI AI Engine (port 8000), and the Node.js backend (port 5000) are running beforehand.


