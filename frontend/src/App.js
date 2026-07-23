import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import PremiumProtectedRoute from './components/PremiumProtectedRoute';

// Import Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadStatement from './pages/UploadStatement';
import InvestmentAdvisor from './pages/InvestmentAdvisor';
import InsuranceAdvisor from './pages/InsuranceAdvisor';
import Chatbot from './pages/Chatbot';

// Import Premium Pages
import PremiumDashboard from './pages/PremiumDashboard';
import TaxOptimizer from './pages/TaxOptimizer';
import LoanAdvisor from './pages/LoanAdvisor';
import InsuranceGap from './pages/InsuranceGap';
import PurchaseAdvisor from './pages/PurchaseAdvisor';
import WhatIfSimulator from './pages/WhatIfSimulator';
import PortfolioRisk from './pages/PortfolioRisk';
import StockAdvisor from './pages/StockAdvisor';
import FinancialCoach from './pages/FinancialCoach';
import FinancialTwin from './pages/FinancialTwin';
import FinancialReports from './pages/FinancialReports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadStatement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investments"
              element={
                <ProtectedRoute>
                  <InvestmentAdvisor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance"
              element={
                <ProtectedRoute>
                  <InsuranceAdvisor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chatbot"
              element={
                <ProtectedRoute>
                  <Chatbot />
                </ProtectedRoute>
              }
            />

            {/* Premium Protected Routes */}
            <Route
              path="/premium-dashboard"
              element={
                <PremiumProtectedRoute>
                  <PremiumDashboard />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/tax-optimizer"
              element={
                <PremiumProtectedRoute>
                  <TaxOptimizer />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/loan-advisor"
              element={
                <PremiumProtectedRoute>
                  <LoanAdvisor />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/insurance-gap"
              element={
                <PremiumProtectedRoute>
                  <InsuranceGap />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/purchase-advisor"
              element={
                <PremiumProtectedRoute>
                  <PurchaseAdvisor />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/what-if"
              element={
                <PremiumProtectedRoute>
                  <WhatIfSimulator />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/portfolio-risk"
              element={
                <PremiumProtectedRoute>
                  <PortfolioRisk />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/stock-advisor"
              element={
                <PremiumProtectedRoute>
                  <StockAdvisor />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/financial-coach"
              element={
                <PremiumProtectedRoute>
                  <FinancialCoach />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/digital-twin"
              element={
                <PremiumProtectedRoute>
                  <FinancialTwin />
                </PremiumProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PremiumProtectedRoute>
                  <FinancialReports />
                </PremiumProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
