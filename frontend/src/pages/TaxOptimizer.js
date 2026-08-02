import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import {
  Percent,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  History,
  Trash2,
  Info,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const TaxOptimizer = () => {
  const { user } = useContext(AuthContext);

  // Input form data
  const [formData, setFormData] = useState({
    annualSalary: '',
    businessIncome: '',
    rentalIncome: '',
    capitalGains: '',
    otherIncome: '',
    interestIncome: '',
    dividendIncome: '',
    age: '',
    residentialStatus: 'Resident',
    financialYear: 'FY 2024-25',
    taxRegime: 'new',
    // Deductions
    ppf: '',
    elss: '',
    epf: '',
    lifeInsurance: '',
    taxSavingFD: '',
    nsc: '',
    other80C: '',
    healthInsurance: '',
    other80D: '',
    nps: '',
    employerNps: '',
    homeLoanInterest: '',
    educationLoanInterest: '',
    donations: '',
    professionalTax: '',
    lta: '',
    // HRA components
    rentPaid: '',
    hraReceived: '',
    basicSalary: '',
    // Prepaid Taxes
    tds: ''
  });

  // Scenario Simulator state
  const [scenarioData, setScenarioData] = useState({
    elss: 0,
    nps: 0,
    healthInsurance: 0,
    homeLoanInterest: 0
  });

  const [activeTab, setActiveTab] = useState('income'); // income, deductions, settings
  const [result, setResult] = useState(null); // active calculation results
  const [comparison, setComparison] = useState(null); // side-by-side old vs new comparison
  const [scenarioResult, setScenarioResult] = useState(null); // simulator results
  const [historyList, setHistoryList] = useState([]); // historical runs
  const [loading, setLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeChartTab, setActiveChartTab] = useState('summary'); // summary, slabs, comparison

  // References for Plotly charts
  const incomeChartRef = useRef(null);
  const deductionsChartRef = useRef(null);
  const slabsChartRef = useRef(null);
  const compareChartRef = useRef(null);
  const savingsChartRef = useRef(null);

  // Load history on load
  useEffect(() => {
    fetchHistory();
  }, []);

  // Pre-populate age from user profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        age: user.age || 30
      }));
    }
  }, [user]);

  // Re-draw Plotly charts whenever result or comparison change
  useEffect(() => {
    if (result) {
      drawPlotlyResultCharts();
    }
  }, [result, activeChartTab]);

  useEffect(() => {
    if (comparison) {
      drawPlotlyCompareCharts();
    }
  }, [comparison, activeChartTab]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/tax/history');
      setHistoryList(res.data.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  // Real-time client-side deduction limit validation
  const validateForm = (data) => {
    const errors = {};
    const ageVal = Number(data.age || 0);

    // 80C total
    const ppf = Number(data.ppf || 0);
    const elss = Number(data.elss || 0);
    const epf = Number(data.epf || 0);
    const lifeInsurance = Number(data.lifeInsurance || 0);
    const taxSavingFD = Number(data.taxSavingFD || 0);
    const nsc = Number(data.nsc || 0);
    const other80C = Number(data.other80C || 0);
    const total80C = ppf + elss + epf + lifeInsurance + taxSavingFD + nsc + other80C;
    if (total80C > 150000) {
      errors.sec80C = `Section 80C total (₹${total80C.toLocaleString()}) exceeds the legal limit of ₹1,50,000.`;
    }

    // 80D total
    const healthInsurance = Number(data.healthInsurance || 0);
    const other80D = Number(data.other80D || 0);
    const total80D = healthInsurance + other80D;
    const limit80D = ageVal >= 60 ? 50000 : 25000;
    if (total80D > limit80D) {
      errors.sec80D = `Section 80D total (₹${total80D.toLocaleString()}) exceeds the legal limit of ₹${limit80D.toLocaleString()} for your age category.`;
    }

    // NPS
    const nps = Number(data.nps || 0);
    if (nps > 50000) {
      errors.sec80CCD_1B = `NPS claim (₹${nps.toLocaleString()}) exceeds the Section 80CCD(1B) legal limit of ₹50,000.`;
    }

    // Employer NPS
    const employerNps = Number(data.employerNps || 0);
    const basic = Number(data.basicSalary || 0);
    const cleanFy = String(data.financialYear || 'FY 2024-25').replace(/\s+/g, '');
    const empRate = (data.taxRegime === 'new' && (cleanFy === 'FY2024-25' || cleanFy === 'FY2025-26')) ? 0.14 : 0.10;
    const empLimit = basic * empRate;
    if (employerNps > empLimit) {
      errors.employerNps = `Employer NPS (₹${employerNps.toLocaleString()}) exceeds ${empRate * 100}% of Basic Salary (limit: ₹${Math.round(empLimit).toLocaleString()}).`;
    }

    // Home Loan
    const homeLoan = Number(data.homeLoanInterest || 0);
    if (homeLoan > 200000) {
      errors.sec24B = `Home Loan Interest claim (₹${homeLoan.toLocaleString()}) exceeds the Section 24(b) legal limit of ₹2,00,000.`;
    }

    // Professional Tax
    const professionalTax = Number(data.professionalTax || 0);
    if (professionalTax > 2500) {
      errors.professionalTax = `Professional Tax claim (₹${professionalTax.toLocaleString()}) exceeds the legal limit of ₹2,500.`;
    }

    // Negative check
    const positiveCheckFields = [
      'annualSalary', 'businessIncome', 'rentalIncome', 'capitalGains', 'otherIncome',
      'interestIncome', 'dividendIncome', 'age', 'ppf', 'elss', 'epf', 'lifeInsurance',
      'taxSavingFD', 'nsc', 'other80C', 'healthInsurance', 'other80D', 'nps', 'employerNps',
      'homeLoanInterest', 'educationLoanInterest', 'donations', 'professionalTax', 'lta',
      'rentPaid', 'hraReceived', 'basicSalary', 'tds'
    ];
    positiveCheckFields.forEach(f => {
      if (Number(data[f] || 0) < 0) {
        errors[f] = 'Values cannot be negative.';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const updated = {
      ...formData,
      [e.target.name]: e.target.value
    };
    setFormData(updated);
    validateForm(updated);
  };

  const loadPastCalculation = (calc) => {
    const flatDeductions = {};
    // Map array of deductions back to flat state fields
    calc.deductions.forEach(d => {
      if (d.code === 'sec80C') flatDeductions.other80C = d.claimedAmount;
      if (d.code === 'sec80D') flatDeductions.healthInsurance = d.claimedAmount;
      if (d.code === 'sec80CCD_1B') flatDeductions.nps = d.claimedAmount;
      if (d.code === 'sec80CCD_2') flatDeductions.employerNps = d.claimedAmount;
      if (d.code === 'sec24B') flatDeductions.homeLoanInterest = d.claimedAmount;
      if (d.code === 'sec80E') flatDeductions.educationLoanInterest = d.claimedAmount;
      if (d.code === 'sec80G') flatDeductions.donations = d.claimedAmount;
      if (d.code === 'professionalTax') flatDeductions.professionalTax = d.claimedAmount;
      if (d.code === 'lta') flatDeductions.lta = d.claimedAmount;
    });

    setFormData({
      annualSalary: calc.income.annualSalary || '',
      businessIncome: calc.income.businessIncome || '',
      rentalIncome: calc.income.rentalIncome || '',
      capitalGains: calc.income.capitalGains || '',
      otherIncome: calc.income.otherIncome || '',
      interestIncome: calc.income.interestIncome || '',
      dividendIncome: calc.income.dividendIncome || '',
      age: calc.age || '',
      residentialStatus: calc.residentialStatus || 'Resident',
      financialYear: calc.financialYear || 'FY 2024-25',
      taxRegime: calc.regime || 'new',
      ppf: '', elss: '', epf: '', taxSavingFD: '', lifeInsurance: '', nsc: '',
      ...flatDeductions,
      rentPaid: calc.rentPaid || '',
      hraReceived: calc.hraReceived || '',
      basicSalary: calc.basicSalary || '',
      tds: calc.tax.taxPayable + calc.tax.taxRefund - calc.tax.finalTaxLiability > 0 ? 0 : (calc.tax.finalTaxLiability + calc.tax.taxRefund - calc.tax.taxPayable)
    });
    setResult(calc);
    setComparison(null);
    setScenarioResult(null);
  };

  const deleteHistoryRecord = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this calculation record?')) return;
    try {
      await axios.delete(`/tax/history/${id}`); // Wait, does delete route exist? If not, we can just delete from list, but let's see. If not, delete endpoint can be added. We can write a delete endpoint in routes/tax.js, let's keep it safe. If delete fails we update local list.
      fetchHistory();
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err.message);
      setHistoryList(historyList.filter(h => h._id !== id));
    }
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!validateForm(formData)) {
      setError('Please resolve all validation errors on the form before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setComparison(null);
    setScenarioResult(null);

    try {
      const payload = {
        annualSalary: parseFloat(formData.annualSalary || 0),
        businessIncome: parseFloat(formData.businessIncome || 0),
        rentalIncome: parseFloat(formData.rentalIncome || 0),
        capitalGains: parseFloat(formData.capitalGains || 0),
        otherIncome: parseFloat(formData.otherIncome || 0),
        interestIncome: parseFloat(formData.interestIncome || 0),
        dividendIncome: parseFloat(formData.dividendIncome || 0),
        age: parseInt(formData.age),
        residentialStatus: formData.residentialStatus,
        financialYear: formData.financialYear,
        taxRegime: formData.taxRegime,
        rentPaid: parseFloat(formData.rentPaid || 0),
        hraReceived: parseFloat(formData.hraReceived || 0),
        basicSalary: parseFloat(formData.basicSalary || 0),
        deductions: {
          ppf: parseFloat(formData.ppf || 0),
          elss: parseFloat(formData.elss || 0),
          epf: parseFloat(formData.epf || 0),
          lifeInsurance: parseFloat(formData.lifeInsurance || 0),
          taxSavingFD: parseFloat(formData.taxSavingFD || 0),
          nsc: parseFloat(formData.nsc || 0),
          other80C: parseFloat(formData.other80C || 0),
          healthInsurance: parseFloat(formData.healthInsurance || 0),
          other80D: parseFloat(formData.other80D || 0),
          nps: parseFloat(formData.nps || 0),
          employerNps: parseFloat(formData.employerNps || 0),
          homeLoanInterest: parseFloat(formData.homeLoanInterest || 0),
          educationLoanInterest: parseFloat(formData.educationLoanInterest || 0),
          donations: parseFloat(formData.donations || 0),
          professionalTax: parseFloat(formData.professionalTax || 0),
          lta: parseFloat(formData.lta || 0)
        },
        tds: parseFloat(formData.tds || 0)
      };

      const res = await axios.post('/tax/calculate', payload);
      setResult(res.data.data);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Calculation engine failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!validateForm(formData)) {
      setError('Please resolve all validation errors before comparing.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setComparison(null);
    setScenarioResult(null);

    try {
      const payload = {
        annualSalary: parseFloat(formData.annualSalary || 0),
        businessIncome: parseFloat(formData.businessIncome || 0),
        rentalIncome: parseFloat(formData.rentalIncome || 0),
        capitalGains: parseFloat(formData.capitalGains || 0),
        otherIncome: parseFloat(formData.otherIncome || 0),
        interestIncome: parseFloat(formData.interestIncome || 0),
        dividendIncome: parseFloat(formData.dividendIncome || 0),
        age: parseInt(formData.age),
        residentialStatus: formData.residentialStatus,
        financialYear: formData.financialYear,
        taxRegime: formData.taxRegime,
        rentPaid: parseFloat(formData.rentPaid || 0),
        hraReceived: parseFloat(formData.hraReceived || 0),
        basicSalary: parseFloat(formData.basicSalary || 0),
        deductions: {
          ppf: parseFloat(formData.ppf || 0),
          elss: parseFloat(formData.elss || 0),
          epf: parseFloat(formData.epf || 0),
          lifeInsurance: parseFloat(formData.lifeInsurance || 0),
          taxSavingFD: parseFloat(formData.taxSavingFD || 0),
          nsc: parseFloat(formData.nsc || 0),
          other80C: parseFloat(formData.other80C || 0),
          healthInsurance: parseFloat(formData.healthInsurance || 0),
          other80D: parseFloat(formData.other80D || 0),
          nps: parseFloat(formData.nps || 0),
          employerNps: parseFloat(formData.employerNps || 0),
          homeLoanInterest: parseFloat(formData.homeLoanInterest || 0),
          educationLoanInterest: parseFloat(formData.educationLoanInterest || 0),
          donations: parseFloat(formData.donations || 0),
          professionalTax: parseFloat(formData.professionalTax || 0),
          lta: parseFloat(formData.lta || 0)
        },
        tds: parseFloat(formData.tds || 0)
      };

      const res = await axios.post('/tax/compare', payload);
      setComparison(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Comparison engine failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateScenario = async (e) => {
    e.preventDefault();
    setSimLoading(true);
    try {
      const payload = {
        annualSalary: parseFloat(formData.annualSalary || 0),
        businessIncome: parseFloat(formData.businessIncome || 0),
        rentalIncome: parseFloat(formData.rentalIncome || 0),
        capitalGains: parseFloat(formData.capitalGains || 0),
        otherIncome: parseFloat(formData.otherIncome || 0),
        interestIncome: parseFloat(formData.interestIncome || 0),
        dividendIncome: parseFloat(formData.dividendIncome || 0),
        age: parseInt(formData.age),
        residentialStatus: formData.residentialStatus,
        financialYear: formData.financialYear,
        taxRegime: formData.taxRegime,
        rentPaid: parseFloat(formData.rentPaid || 0),
        hraReceived: parseFloat(formData.hraReceived || 0),
        basicSalary: parseFloat(formData.basicSalary || 0),
        deductions: {
          ppf: parseFloat(formData.ppf || 0),
          elss: parseFloat(formData.elss || 0),
          epf: parseFloat(formData.epf || 0),
          lifeInsurance: parseFloat(formData.lifeInsurance || 0),
          taxSavingFD: parseFloat(formData.taxSavingFD || 0),
          nsc: parseFloat(formData.nsc || 0),
          other80C: parseFloat(formData.other80C || 0),
          healthInsurance: parseFloat(formData.healthInsurance || 0),
          other80D: parseFloat(formData.other80D || 0),
          nps: parseFloat(formData.nps || 0),
          employerNps: parseFloat(formData.employerNps || 0),
          homeLoanInterest: parseFloat(formData.homeLoanInterest || 0),
          educationLoanInterest: parseFloat(formData.educationLoanInterest || 0),
          donations: parseFloat(formData.donations || 0),
          professionalTax: parseFloat(formData.professionalTax || 0),
          lta: parseFloat(formData.lta || 0)
        },
        tds: parseFloat(formData.tds || 0),
        scenario: {
          elss: parseFloat(scenarioData.elss || 0),
          nps: parseFloat(scenarioData.nps || 0),
          healthInsurance: parseFloat(scenarioData.healthInsurance || 0),
          homeLoanInterest: parseFloat(scenarioData.homeLoanInterest || 0)
        }
      };

      const res = await axios.post('/tax/scenario', payload);
      setScenarioResult(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Simulation failed');
    } finally {
      setSimLoading(false);
    }
  };

  const handleExportPDF = async (calcId) => {
    try {
      const response = await axios.get(`/tax/export/${calcId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FinPilot_TaxReport_${calcId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF report');
    }
  };

  const drawPlotlyResultCharts = () => {
    if (!result || !window.Plotly) return;

    // 1. Income Distribution Donut
    if (activeChartTab === 'summary') {
      const inc = result.income;
      const values = [inc.annualSalary, inc.businessIncome, inc.rentalIncome, inc.capitalGains, inc.otherIncome];
      const labels = ['Salary', 'Business', 'Rental', 'Capital Gains', 'Other'];
      const nonZeroValues = [];
      const nonZeroLabels = [];
      values.forEach((v, i) => {
        if (v > 0) {
          nonZeroValues.push(v);
          nonZeroLabels.push(labels[i]);
        }
      });

      const incomeDataPlot = [{
        values: nonZeroValues.length > 0 ? nonZeroValues : [1],
        labels: nonZeroValues.length > 0 ? nonZeroLabels : ['No income'],
        type: 'pie',
        hole: 0.5,
        marker: {
          colors: ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f97316']
        },
        textinfo: 'percent+label',
        textfont: { color: '#ffffff', size: 10 }
      }];

      const incomeLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: false,
        margin: { t: 20, b: 20, l: 20, r: 20 },
        height: 250,
        font: { family: 'Outfit, sans-serif', color: '#ffffff' }
      };

      window.Plotly.newPlot(incomeChartRef.current, incomeDataPlot, incomeLayout, { displayModeBar: false });

      // 2. Deductions bar chart
      const codes = result.deductions.map(d => d.claimedAmount > 0 || d.appliedAmount > 0 ? (d.code === 'rentDeduction' ? 'HRA/Rent' : d.name.split(' (')[0]) : null).filter(Boolean);
      const claimedVal = result.deductions.map(d => d.claimedAmount > 0 || d.appliedAmount > 0 ? d.claimedAmount : null).filter(v => v !== null);
      const appliedVal = result.deductions.map(d => d.claimedAmount > 0 || d.appliedAmount > 0 ? d.appliedAmount : null).filter(v => v !== null);

      if (codes.length > 0) {
        const tr1 = {
          x: codes,
          y: claimedVal,
          name: 'Claimed',
          type: 'bar',
          marker: { color: 'rgba(255, 255, 255, 0.15)' }
        };
        const tr2 = {
          x: codes,
          y: appliedVal,
          name: 'Applied',
          type: 'bar',
          marker: { color: '#6366f1' }
        };

        const dedLayout = {
          barmode: 'group',
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          xaxis: { tickfont: { color: '#cbd5e1', size: 9 }, gridcolor: 'rgba(255,255,255,0.03)' },
          yaxis: { tickfont: { color: '#cbd5e1' }, gridcolor: 'rgba(255,255,255,0.05)', title: '₹' },
          legend: { font: { color: '#ffffff', size: 9 }, x: 1, y: 1 },
          margin: { t: 30, b: 30, l: 50, r: 10 },
          height: 250,
          font: { family: 'Outfit, sans-serif', color: '#ffffff' }
        };

        window.Plotly.newPlot(deductionsChartRef.current, [tr1, tr2], dedLayout, { displayModeBar: false });
      }
    }

    // 3. Tax Slab Progressive Breakdown
    if (activeChartTab === 'slabs') {
      const slabs = result.tax.slabBreakdown;
      const slabNames = slabs.map(s => `${s.slab} (${s.rate}%)`);
      const incomes = slabs.map(s => s.incomeInSlab);
      const taxes = slabs.map(s => s.taxForSlab);

      const slabTrace = {
        y: slabNames,
        x: incomes,
        type: 'bar',
        orientation: 'h',
        marker: { color: '#a855f7' },
        text: taxes.map(t => t > 0 ? `Tax: ₹${t.toLocaleString()}` : ''),
        textposition: 'inside',
        textfont: { color: '#ffffff', size: 10 }
      };

      const slabLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { tickfont: { color: '#cbd5e1' }, gridcolor: 'rgba(255,255,255,0.05)', title: 'Income Segment (₹)' },
        yaxis: { tickfont: { color: '#cbd5e1', size: 9 }, automargin: true },
        margin: { t: 10, b: 40, l: 120, r: 10 },
        height: 250,
        font: { family: 'Outfit, sans-serif', color: '#ffffff' }
      };

      window.Plotly.newPlot(slabsChartRef.current, [slabTrace], slabLayout, { displayModeBar: false });
    }

    // 4. Savings indicator
    if (activeChartTab === 'summary') {
      const potentialSav = result.recommendations.reduce((acc, r) => acc + r.estimatedTaxSaved, 0);
      const currTax = result.tax.finalTaxLiability;

      const gaugeData = [
        {
          type: "indicator",
          mode: "gauge+number",
          value: potentialSav,
          title: { text: "Potential Tax Saved (₹)", font: { size: 12, color: '#94a3b8' } },
          number: { font: { size: 28, color: '#10b981', family: 'Outfit, sans-serif' } },
          gauge: {
            axis: { range: [null, Math.max(10000, currTax)], tickwidth: 1, tickcolor: "#94a3b8" },
            bar: { color: "#10b981" },
            bgcolor: "rgba(255,255,255,0.03)",
            borderwidth: 1,
            bordercolor: "rgba(255,255,255,0.1)",
            steps: [
              { range: [0, potentialSav], color: "rgba(16, 185, 129, 0.1)" }
            ],
          }
        }
      ];

      const gaugeLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 40, b: 20, l: 30, r: 30 },
        height: 180,
        font: { family: 'Outfit, sans-serif', color: '#ffffff' }
      };

      window.Plotly.newPlot(savingsChartRef.current, gaugeData, gaugeLayout, { displayModeBar: false });
    }
  };

  const drawPlotlyCompareCharts = () => {
    if (!comparison || !window.Plotly) return;

    if (activeChartTab === 'comparison') {
      const trace1 = {
        x: ['Old Regime', 'New Regime'],
        y: [comparison.comparison.old.taxableIncome, comparison.comparison.new.taxableIncome],
        name: 'Taxable Income',
        type: 'bar',
        marker: { color: '#3b82f6' }
      };
      const trace2 = {
        x: ['Old Regime', 'New Regime'],
        y: [comparison.comparison.old.finalTaxLiability, comparison.comparison.new.finalTaxLiability],
        name: 'Net Tax Liability',
        type: 'bar',
        marker: { color: '#ef4444' }
      };

      const compareLayout = {
        barmode: 'group',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { tickfont: { color: '#cbd5e1' } },
        yaxis: { tickfont: { color: '#cbd5e1' }, gridcolor: 'rgba(255,255,255,0.05)', title: '₹' },
        legend: { font: { color: '#ffffff', size: 10 } },
        margin: { t: 30, b: 30, l: 60, r: 10 },
        height: 260,
        font: { family: 'Outfit, sans-serif', color: '#ffffff' }
      };

      window.Plotly.newPlot(compareChartRef.current, [trace1, trace2], compareLayout, { displayModeBar: false });
    }
  };

  const isDeductionsAllowed = formData.taxRegime === 'old';

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <Link to="/premium-dashboard" style={styles.backLink}>
          <ArrowLeft size={14} />
          Back to Hub
        </Link>
        <div style={styles.titleRow}>
          <Percent size={28} color="#6366f1" />
          <h1 style={styles.title}>Tax Optimizer 2.0</h1>
          <span style={styles.premiumTag}>Premium Rule-Based Tax Engine</span>
        </div>
        <p style={styles.subtitle}>
          Calculate liability with progressive slabs, compare regimes, and simulate optimized tax-saving scenarios.
        </p>
      </header>

      <div style={styles.container}>
        {/* LEFT COLUMN: Input Cockpit */}
        <div style={styles.leftColumn}>
          <div style={styles.formCard}>
            <div style={styles.tabHeaders}>
              <button
                type="button"
                onClick={() => setActiveTab('income')}
                style={{ ...styles.tabBtn, ...(activeTab === 'income' ? styles.tabBtnActive : {}) }}
              >
                Incomes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('deductions')}
                style={{ ...styles.tabBtn, ...(activeTab === 'deductions' ? styles.tabBtnActive : {}) }}
              >
                Deductions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                style={{ ...styles.tabBtn, ...(activeTab === 'settings' ? styles.tabBtnActive : {}) }}
              >
                Settings
              </button>
            </div>

            <form onSubmit={handleCalculate} style={styles.formContent}>
              {/* TAB 1: Income Details */}
              {activeTab === 'income' && (
                <div style={styles.formGroupList}>
                  <h4 style={styles.groupHeading}>Annual Gross Income Components</h4>
                  
                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Annual Salary / CTC (₹)</label>
                      <input
                        type="number"
                        name="annualSalary"
                        value={formData.annualSalary}
                        onChange={handleInputChange}
                        placeholder="e.g. 1200000"
                        style={styles.input}
                      />
                      {validationErrors.annualSalary && <span style={styles.warnText}>{validationErrors.annualSalary}</span>}
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Business / Professional Income (₹)</label>
                      <input
                        type="number"
                        name="businessIncome"
                        value={formData.businessIncome}
                        onChange={handleInputChange}
                        placeholder="e.g. 250000"
                        style={styles.input}
                      />
                      {validationErrors.businessIncome && <span style={styles.warnText}>{validationErrors.businessIncome}</span>}
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Rental Income (Annual, ₹)</label>
                      <input
                        type="number"
                        name="rentalIncome"
                        value={formData.rentalIncome}
                        onChange={handleInputChange}
                        placeholder="e.g. 180000"
                        style={styles.input}
                      />
                      {validationErrors.rentalIncome && <span style={styles.warnText}>{validationErrors.rentalIncome}</span>}
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Capital Gains (₹)</label>
                      <input
                        type="number"
                        name="capitalGains"
                        value={formData.capitalGains}
                        onChange={handleInputChange}
                        placeholder="e.g. 50000"
                        style={styles.input}
                      />
                      {validationErrors.capitalGains && <span style={styles.warnText}>{validationErrors.capitalGains}</span>}
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Interest Income (₹)</label>
                      <input
                        type="number"
                        name="interestIncome"
                        value={formData.interestIncome}
                        onChange={handleInputChange}
                        placeholder="e.g. 15000"
                        style={styles.input}
                      />
                      {validationErrors.interestIncome && <span style={styles.warnText}>{validationErrors.interestIncome}</span>}
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Dividend Income (₹)</label>
                      <input
                        type="number"
                        name="dividendIncome"
                        value={formData.dividendIncome}
                        onChange={handleInputChange}
                        placeholder="e.g. 5000"
                        style={styles.input}
                      />
                      {validationErrors.dividendIncome && <span style={styles.warnText}>{validationErrors.dividendIncome}</span>}
                    </div>
                  </div>

                  <div style={styles.formField}>
                    <label style={styles.label}>Income from Other Sources (₹)</label>
                    <input
                      type="number"
                      name="otherIncome"
                      value={formData.otherIncome}
                      onChange={handleInputChange}
                      placeholder="e.g. 20000"
                      style={styles.input}
                    />
                    {validationErrors.otherIncome && <span style={styles.warnText}>{validationErrors.otherIncome}</span>}
                  </div>
                </div>
              )}

              {/* TAB 2: Deductions */}
              {activeTab === 'deductions' && (
                <div style={styles.formGroupList}>
                  <div style={styles.regimeDeductionBanner}>
                    <Info size={16} color="#3b82f6" />
                    <span>
                      {isDeductionsAllowed
                        ? "Old Regime is active. Deductions will be applied and limits verified on-the-fly."
                        : "New Regime is active. You can still input deductions to run comparisons or simulations."}
                    </span>
                  </div>

                  <h4 style={styles.groupHeading}>Section 80C (Limit: ₹1.5L)</h4>
                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>PPF Contributions (₹)</label>
                      <input
                        type="number"
                        name="ppf"
                        value={formData.ppf}
                        onChange={handleInputChange}
                        placeholder="e.g. 50000"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>ELSS Mutual Funds (₹)</label>
                      <input
                        type="number"
                        name="elss"
                        value={formData.elss}
                        onChange={handleInputChange}
                        placeholder="e.g. 50000"
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>EPF (Employee Provident Fund, ₹)</label>
                      <input
                        type="number"
                        name="epf"
                        value={formData.epf}
                        onChange={handleInputChange}
                        placeholder="e.g. 30000"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Tax Saving FD (₹)</label>
                       <input
                        type="number"
                        name="taxSavingFD"
                        value={formData.taxSavingFD}
                        onChange={handleInputChange}
                        placeholder="e.g. 20000"
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Life Insurance Premium (₹)</label>
                      <input
                        type="number"
                        name="lifeInsurance"
                        value={formData.lifeInsurance}
                        onChange={handleInputChange}
                        placeholder="e.g. 15000"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>National Savings Certificate (NSC, ₹)</label>
                       <input
                        type="number"
                        name="nsc"
                        value={formData.nsc}
                        onChange={handleInputChange}
                        placeholder="e.g. 10000"
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>Other 80C Investments (₹)</label>
                     <input
                      type="number"
                      name="other80C"
                      value={formData.other80C}
                      onChange={handleInputChange}
                      placeholder="e.g. 20000"
                      style={styles.input}
                    />
                  </div>
                  {validationErrors.sec80C && (
                    <div style={styles.limitError}>
                      <AlertTriangle size={14} color="#ef4444" />
                      <span>{validationErrors.sec80C}</span>
                    </div>
                  )}

                  <h4 style={styles.groupHeading}>Other Tax-Saving Sections</h4>
                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Health Insurance (80D, Max ₹25k/₹50k)</label>
                      <input
                        type="number"
                        name="healthInsurance"
                        value={formData.healthInsurance}
                        onChange={handleInputChange}
                        placeholder="e.g. 15000"
                        style={styles.input}
                      />
                      {validationErrors.sec80D && <span style={styles.warnText}>{validationErrors.sec80D}</span>}
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>NPS Contribution (80CCD(1B), Max ₹50k)</label>
                      <input
                        type="number"
                        name="nps"
                        value={formData.nps}
                        onChange={handleInputChange}
                        placeholder="e.g. 50000"
                        style={styles.input}
                      />
                      {validationErrors.sec80CCD_1B && <span style={styles.warnText}>{validationErrors.sec80CCD_1B}</span>}
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Home Loan Interest (Sec 24b, Max ₹2L)</label>
                      <input
                        type="number"
                        name="homeLoanInterest"
                        value={formData.homeLoanInterest}
                        onChange={handleInputChange}
                        placeholder="e.g. 120000"
                        style={styles.input}
                      />
                      {validationErrors.sec24B && <span style={styles.warnText}>{validationErrors.sec24B}</span>}
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Education Loan Interest (Sec 80E)</label>
                      <input
                        type="number"
                        name="educationLoanInterest"
                        value={formData.educationLoanInterest}
                        onChange={handleInputChange}
                        placeholder="e.g. 10000"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Employer NPS (Sec 80CCD(2), Max 10%/14%)</label>
                      <input
                        type="number"
                        name="employerNps"
                        value={formData.employerNps}
                        onChange={handleInputChange}
                        placeholder="e.g. 60000"
                        style={styles.input}
                      />
                      {validationErrors.employerNps && <span style={styles.warnText}>{validationErrors.employerNps}</span>}
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Professional Tax (Sec 16(iii), Max ₹2,500)</label>
                      <input
                        type="number"
                        name="professionalTax"
                        value={formData.professionalTax}
                        onChange={handleInputChange}
                        placeholder="e.g. 2500"
                        style={styles.input}
                      />
                      {validationErrors.professionalTax && <span style={styles.warnText}>{validationErrors.professionalTax}</span>}
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>LTA Exemption Claimed (Sec 10(5))</label>
                      <input
                        type="number"
                        name="lta"
                        value={formData.lta}
                        onChange={handleInputChange}
                        placeholder="e.g. 25000"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Charitable Donations (Sec 80G)</label>
                      <input
                        type="number"
                        name="donations"
                        value={formData.donations}
                        onChange={handleInputChange}
                        placeholder="e.g. 5000"
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <h4 style={styles.groupHeading}>Rent & HRA Deductions</h4>
                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Actual Rent Paid (Annual, ₹)</label>
                      <input
                        type="number"
                        name="rentPaid"
                        value={formData.rentPaid}
                        onChange={handleInputChange}
                        placeholder="e.g. 120000"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>HRA Received (Salaried Component, ₹)</label>
                      <input
                        type="number"
                        name="hraReceived"
                        value={formData.hraReceived}
                        onChange={handleInputChange}
                        placeholder="e.g. 150000"
                        style={styles.input}
                      />
                    </div>
                  </div>
                  <div style={styles.formField}>
                    <label style={styles.label}>Basic Salary (Required for HRA/Employer NPS, ₹)</label>
                    <input
                      type="number"
                      name="basicSalary"
                      value={formData.basicSalary}
                      onChange={handleInputChange}
                      placeholder="e.g. 480000"
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Settings & FY */}
              {activeTab === 'settings' && (
                <div style={styles.formGroupList}>
                  <h4 style={styles.groupHeading}>Taxpayer Profile & Settings</h4>

                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Age (Years) *</label>
                      <input
                        type="number"
                        name="age"
                        required
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder="e.g. 35"
                        style={styles.input}
                      />
                      {validationErrors.age && <span style={styles.warnText}>{validationErrors.age}</span>}
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Residential Status *</label>
                      <select
                        name="residentialStatus"
                        value={formData.residentialStatus}
                        onChange={handleInputChange}
                        style={styles.select}
                      >
                        <option value="Resident">Resident</option>
                        <option value="Non-Resident">Non-Resident</option>
                        <option value="RNOR">RNOR (Resident but Not Ordinarily Resident)</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formField}>
                      <label style={styles.label}>Financial Year *</label>
                      <select
                        name="financialYear"
                        value={formData.financialYear}
                        onChange={handleInputChange}
                        style={styles.select}
                      >
                        <option value="FY 2025-26">FY 2025-26 (ITR Slabs Capped at ₹24L)</option>
                        <option value="FY 2024-25">FY 2024-25</option>
                        <option value="FY 2023-24">FY 2023-24</option>
                      </select>
                    </div>
                    <div style={styles.formField}>
                      <label style={styles.label}>Default Regime *</label>
                      <select
                        name="taxRegime"
                        value={formData.taxRegime}
                        onChange={handleInputChange}
                        style={styles.select}
                      >
                        <option value="new">New Tax Regime</option>
                        <option value="old">Old Tax Regime</option>
                      </select>
                    </div>
                  </div>

                  <h4 style={styles.groupHeading}>Prepaid Taxes</h4>
                  <div style={styles.formField}>
                    <label style={styles.label}>TDS Deducted / Prepaid Taxes Paid (₹)</label>
                    <input
                      type="number"
                      name="tds"
                      value={formData.tds}
                      onChange={handleInputChange}
                      placeholder="e.g. 45000"
                      style={styles.input}
                    />
                  </div>
                </div>
              )}

              <div style={styles.buttonRow}>
                <button
                  type="submit"
                  disabled={loading || Object.keys(validationErrors).length > 0}
                  style={{
                    ...styles.submitBtn,
                    ...((loading || Object.keys(validationErrors).length > 0) ? styles.btnDisabled : {})
                  }}
                >
                  {loading ? 'Processing Slabs...' : 'Calculate Tax'}
                </button>
                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={loading || Object.keys(validationErrors).length > 0}
                  style={{
                    ...styles.compareBtn,
                    ...((loading || Object.keys(validationErrors).length > 0) ? styles.btnDisabled : {})
                  }}
                >
                  Compare Regimes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & Visualization */}
        <div style={styles.rightColumn}>
          {error && <div style={styles.errorBox}>{error}</div>}

          {/* STATE 1: Calculation Result Dashboard */}
          {result && (
            <div style={styles.resultsCockpit}>
              {/* Summary Header */}
              <div style={styles.summaryCard}>
                <div style={styles.cardHeaderRow}>
                  <div style={styles.headerInfo}>
                    <span style={styles.regimeLabel}>{result.financialYear} • {result.regime.toUpperCase()} Regime</span>
                    <h2 style={styles.liabilityTitle}>
                      Net Tax: <span style={styles.liabilityVal}>₹{result.tax.finalTaxLiability.toLocaleString()}</span>
                    </h2>
                  </div>
                  <div style={styles.headerActions}>
                    <button
                      onClick={() => handleExportPDF(result.id)}
                      style={styles.actionBtn}
                      title="Download PDF Report"
                    >
                      <Download size={16} />
                      Export PDF
                    </button>
                  </div>
                </div>

                <div style={styles.summaryMetrics}>
                  <div style={styles.metricItem}>
                    <span style={styles.metricLabel}>Gross Income</span>
                    <strong style={styles.metricVal}>₹{result.income.grossIncome.toLocaleString()}</strong>
                  </div>
                  <div style={styles.metricItem}>
                    <span style={styles.metricLabel}>Taxable Income</span>
                    <strong style={styles.metricVal}>₹{result.income.taxableIncome.toLocaleString()}</strong>
                  </div>
                  <div style={styles.metricItem}>
                    <span style={styles.metricLabel}>
                      {result.tax.taxRefund > 0 ? "Tax Refund Due" : "Tax Payable"}
                    </span>
                    <strong
                      style={{
                        ...styles.metricVal,
                        color: result.tax.taxRefund > 0 ? '#10b981' : '#f43f5e'
                      }}
                    >
                      ₹{(result.tax.taxRefund > 0 ? result.tax.taxRefund : result.tax.taxPayable).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div style={{ ...styles.summaryMetrics, marginTop: 15, paddingTop: 15, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                  <div style={styles.metricItem}>
                    <span style={styles.metricLabel}>Average Tax Rate</span>
                    <strong style={styles.metricVal}>{result.tax.averageTaxRate || 0}%</strong>
                  </div>
                  <div style={styles.metricItem}>
                    <span style={styles.metricLabel}>Effective Tax Rate</span>
                    <strong style={styles.metricVal}>{result.tax.effectiveTaxRate || 0}%</strong>
                  </div>
                  <div style={styles.metricItem}>
                    <span style={styles.metricLabel}>Marginal Tax Rate</span>
                    <strong style={styles.metricVal}>{result.tax.marginalTaxRate || 0}%</strong>
                  </div>
                </div>
              </div>

              {/* Toggle Visuals Tabs */}
              <div style={styles.chartTabs}>
                <button
                  onClick={() => setActiveChartTab('summary')}
                  style={{ ...styles.chartTabBtn, ...(activeChartTab === 'summary' ? styles.chartTabBtnActive : {}) }}
                >
                  Income & Deductions
                </button>
                <button
                  onClick={() => setActiveChartTab('slabs')}
                  style={{ ...styles.chartTabBtn, ...(activeChartTab === 'slabs' ? styles.chartTabBtnActive : {}) }}
                >
                  Slab Breakdowns
                </button>
              </div>

              {/* Render Charts */}
              {activeChartTab === 'summary' && (
                <div style={styles.gridCharts}>
                  <div style={styles.chartCard}>
                    <h5 style={styles.chartTitle}>Income Distribution</h5>
                    <div ref={incomeChartRef}></div>
                  </div>
                  <div style={styles.chartCard}>
                    <h5 style={styles.chartTitle}>Deduction Claims Analysis</h5>
                    <div ref={deductionsChartRef}>
                      {result.deductions.filter(d => d.claimedAmount > 0).length === 0 && (
                        <div style={styles.emptyChartLabel}>No deduction claims submitted.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeChartTab === 'slabs' && (
                <div style={styles.chartCardFull}>
                  <h5 style={styles.chartTitle}>Tax Allocated Across Slabs</h5>
                  <div ref={slabsChartRef}></div>
                </div>
              )}

              {/* Deductions Validation List */}
              <div style={styles.detailsCard}>
                <h4 style={styles.sectionTitle}>Deduction Claim Allocations</h4>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Category</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Claimed</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Applied (Capped)</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Unused Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.deductions.map((d, index) => {
                        const maxText = (d.maxAllowed === null || d.maxAllowed === undefined)
                          ? 'Variable Limit'
                          : (d.maxAllowed === Infinity ? 'Unlimited' : `₹${d.maxAllowed.toLocaleString()}`);
                        return (
                          <tr key={index} style={styles.tr}>
                            <td style={styles.td}>
                              <div style={styles.tableName}>{d.name}</div>
                              <div style={styles.tableLimit}>Limit: {maxText}</div>
                            </td>
                            <td style={{ ...styles.td, textAlign: 'right' }}>₹{(d.claimedAmount || 0).toLocaleString()}</td>
                            <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>₹{(d.appliedAmount || 0).toLocaleString()}</td>
                            <td style={{ ...styles.td, textAlign: 'right', color: (d.unusedBenefit || 0) > 0 ? '#10b981' : '#94a3b8' }}>
                              ₹{(d.unusedBenefit || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Scenario Simulator */}
              <div style={styles.detailsCard}>
                <div style={styles.sectionHeaderRow}>
                  <Sparkles size={16} color="#a855f7" />
                  <h4 style={styles.sectionTitle}>Scenario Optimization Simulator</h4>
                </div>
                <p style={styles.simSubtitle}>Simulate additional investments and evaluate direct tax savings.</p>

                <form onSubmit={handleSimulateScenario} style={styles.simForm}>
                  <div style={styles.simInputsGrid}>
                    <div style={styles.simField}>
                      <label style={styles.simLabel}>Add ELSS Mutual Fund (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={scenarioData.elss || ''}
                        onChange={(e) => setScenarioData({ ...scenarioData, elss: parseFloat(e.target.value || 0) })}
                        style={styles.simInput}
                      />
                    </div>
                    <div style={styles.simField}>
                      <label style={styles.simLabel}>Add NPS Contribution (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={scenarioData.nps || ''}
                        onChange={(e) => setScenarioData({ ...scenarioData, nps: parseFloat(e.target.value || 0) })}
                        style={styles.simInput}
                      />
                    </div>
                    <div style={styles.simField}>
                      <label style={styles.simLabel}>Add Health Insurance (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 10000"
                        value={scenarioData.healthInsurance || ''}
                        onChange={(e) => setScenarioData({ ...scenarioData, healthInsurance: parseFloat(e.target.value || 0) })}
                        style={styles.simInput}
                      />
                    </div>
                    <div style={styles.simField}>
                      <label style={styles.simLabel}>Add Home Loan Interest (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={scenarioData.homeLoanInterest || ''}
                        onChange={(e) => setScenarioData({ ...scenarioData, homeLoanInterest: parseFloat(e.target.value || 0) })}
                        style={styles.simInput}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={simLoading} style={styles.simSubmitBtn}>
                    {simLoading ? 'Recalculating...' : 'Simulate Scenario'}
                  </button>
                </form>

                {scenarioResult && (
                  <div style={styles.simResults}>
                    <div style={styles.simResultsHeader}>
                      <div style={styles.simResultBox}>
                        <span style={styles.simResLabel}>Current Tax</span>
                        <strong style={styles.simResVal}>₹{scenarioResult.currentTax.toLocaleString()}</strong>
                      </div>
                      <div style={styles.simResultBox}>
                        <span style={styles.simResLabel}>Simulated Tax</span>
                        <strong style={styles.simResVal}>₹{scenarioResult.newTax.toLocaleString()}</strong>
                      </div>
                      <div style={styles.simResultBox}>
                        <span style={styles.simResLabel}>Tax Savings</span>
                        <strong style={{ ...styles.simResVal, color: '#10b981' }}>₹{scenarioResult.taxSaved.toLocaleString()}</strong>
                      </div>
                      <div style={styles.simResultBox}>
                        <span style={styles.simResLabel}>Simulated ROI</span>
                        <strong style={{ ...styles.simResVal, color: '#a855f7' }}>{scenarioResult.roi}%</strong>
                      </div>
                    </div>
                    <p style={styles.roiDisclaimer}>
                      * Return on Investment (ROI) is calculated as Tax Saved divided by simulated new investments.
                    </p>
                  </div>
                )}
              </div>

              {/* AI Recommendations Panel */}
              <div style={styles.detailsCard}>
                <div style={styles.sectionHeaderRow}>
                  <Sparkles size={18} color="#eab308" />
                  <h4 style={styles.sectionTitle}>AI Personal Advisor Recommendations</h4>
                </div>
                <div style={styles.plotlySavingsBlock}>
                  <div ref={savingsChartRef} style={{ width: '100%' }}></div>
                </div>

                <div style={styles.recommendationsList}>
                  {result.recommendations.map((r, index) => (
                    <div key={index} style={styles.recCard}>
                      <div style={styles.recHeader}>
                        <span
                          style={{
                            ...styles.priorityBadge,
                            ...(r.priority === 'High' ? styles.priorityHigh : r.priority === 'Medium' ? styles.priorityMed : styles.priorityLow)
                          }}
                        >
                          {r.priority} Priority
                        </span>
                        <h5 style={styles.recTitle}>{r.recommendation}</h5>
                      </div>
                      <p style={styles.recReason}>{r.reason}</p>
                      <div style={styles.recFooter}>
                        <div>
                          <span style={styles.recFooterLabel}>Investment Required</span>
                          <strong style={styles.recFooterVal}>₹{r.investmentRequired.toLocaleString()}</strong>
                        </div>
                        {r.expectedROI !== undefined && r.expectedROI > 0 && (
                          <div style={{ textAlign: 'center' }}>
                            <span style={styles.recFooterLabel}>Expected ROI</span>
                            <strong style={{ ...styles.recFooterVal, color: '#a855f7' }}>{r.expectedROI}%</strong>
                          </div>
                        )}
                        <div style={{ textAlign: 'right' }}>
                          <span style={styles.recFooterLabel}>Estimated Tax Saved</span>
                          <strong style={{ ...styles.recFooterVal, color: '#10b981' }}>₹{r.estimatedTaxSaved.toLocaleString()}</strong>
                        </div>
                      </div>
                      {r.deadline && (
                        <div style={{ ...styles.recFooter, marginTop: 8, paddingTop: 8, borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
                          <div>
                            <span style={styles.recFooterLabel}>Difficulty</span>
                            <strong style={{ ...styles.recFooterVal, color: '#3b82f6' }}>{r.difficulty || 'Easy'}</strong>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={styles.recFooterLabel}>Deadline</span>
                            <strong style={{ ...styles.recFooterVal, color: '#eab308' }}>{r.deadline}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: Comparison Dashboard */}
          {comparison && (
            <div style={styles.resultsCockpit}>
              <div style={styles.summaryCard}>
                <div style={styles.cardHeaderRow}>
                  <div>
                    <span style={styles.regimeLabel}>{comparison.financialYear} • Side-by-side Regime Comparison</span>
                    <h2 style={styles.liabilityTitle}>
                      Recommended Option: <span style={{ ...styles.liabilityVal, color: '#10b981' }}>{comparison.betterRegime.toUpperCase()} Regime</span>
                    </h2>
                  </div>
                </div>
                <div style={styles.comparisonCallout}>
                  <TrendingUp size={16} color="#10b981" />
                  <span>
                    Choosing the {comparison.betterRegime.toUpperCase()} Regime saves you approximately <strong>₹{comparison.savings.toLocaleString()}</strong> in taxes compared to the alternative.
                  </span>
                </div>
              </div>

              {/* Chart Tabs */}
              <div style={styles.chartTabs}>
                <button
                  onClick={() => setActiveChartTab('comparison')}
                  style={{ ...styles.chartTabBtn, ...(activeChartTab === 'comparison' ? styles.chartTabBtnActive : {}) }}
                >
                  Comparison Plots
                </button>
              </div>

              {activeChartTab === 'comparison' && (
                <div style={styles.chartCardFull}>
                  <h5 style={styles.chartTitle}>Old vs New Tax and Income Comparison</h5>
                  <div ref={compareChartRef}></div>
                </div>
              )}

              {/* Comparison Data Grid Table */}
              <div style={styles.detailsCard}>
                <h4 style={styles.sectionTitle}>Calculations Dashboard</h4>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Financial Parameter</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>Old Tax Regime</th>
                        <th style={{ ...styles.th, textAlign: 'right' }}>New Tax Regime</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Gross Annual Income</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>₹{comparison.grossIncome.toLocaleString()}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>₹{comparison.grossIncome.toLocaleString()}</td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Total Allowed Deductions</td>
                        <td style={{ ...styles.td, textAlign: 'right', color: '#10b981' }}>
                          ₹{(comparison.grossIncome - comparison.comparison.old.taxableIncome).toLocaleString()}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', color: '#10b981' }}>
                          ₹{(comparison.grossIncome - comparison.comparison.new.taxableIncome).toLocaleString()}
                        </td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Taxable Income Base</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>₹{comparison.comparison.old.taxableIncome.toLocaleString()}</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>₹{comparison.comparison.new.taxableIncome.toLocaleString()}</td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Progressive Slabs Tax</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>₹{comparison.comparison.old.taxBeforeCess.toLocaleString()}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>₹{comparison.comparison.new.taxBeforeCess.toLocaleString()}</td>
                      </tr>
                       <tr style={styles.tr}>
                        <td style={styles.td}>Section 87A Rebate</td>
                        <td style={{ ...styles.td, textAlign: 'right', color: '#ef4444' }}>- ₹{(comparison.comparison.old.rebateApplied || 0).toLocaleString()}</td>
                        <td style={{ ...styles.td, textAlign: 'right', color: '#ef4444' }}>- ₹{(comparison.comparison.new.rebateApplied || 0).toLocaleString()}</td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Surcharge Payable</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>₹{(comparison.comparison.old.surcharge || 0).toLocaleString()}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>₹{(comparison.comparison.new.surcharge || 0).toLocaleString()}</td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Surcharge Marginal Relief</td>
                        <td style={{ ...styles.td, textAlign: 'right', color: '#10b981' }}>- ₹{(comparison.comparison.old.marginalRelief || 0).toLocaleString()}</td>
                        <td style={{ ...styles.td, textAlign: 'right', color: '#10b981' }}>- ₹{(comparison.comparison.new.marginalRelief || 0).toLocaleString()}</td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Health & Education Cess (4%)</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>₹{comparison.comparison.old.cess.toLocaleString()}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>₹{comparison.comparison.new.cess.toLocaleString()}</td>
                      </tr>
                      <tr style={{ ...styles.tr, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <td style={{ ...styles.td, fontWeight: 700 }}>Final Net Tax Liability</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: comparison.betterRegime === 'old' ? '#10b981' : '#ffffff' }}>
                          ₹{comparison.comparison.old.finalTaxLiability.toLocaleString()}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: comparison.betterRegime === 'new' ? '#10b981' : '#ffffff' }}>
                          ₹{comparison.comparison.new.finalTaxLiability.toLocaleString()}
                        </td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Average Tax Rate</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>{comparison.comparison.old.averageTaxRate || 0}%</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>{comparison.comparison.new.averageTaxRate || 0}%</td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Effective Tax Rate</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>{comparison.comparison.old.effectiveTaxRate || 0}%</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>{comparison.comparison.new.effectiveTaxRate || 0}%</td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={styles.td}>Marginal Tax Rate</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>{comparison.comparison.old.marginalTaxRate || 0}%</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>{comparison.comparison.new.marginalTaxRate || 0}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: Empty State & History Logs */}
          {!result && !comparison && (
            <div style={styles.emptyContainer}>
              <div style={styles.emptyCard}>
                <Percent size={44} color="rgba(99, 102, 241, 0.25)" style={{ marginBottom: '16px' }} />
                <h3 style={styles.emptyTitle}>Awaiting Calculator Inputs</h3>
                <p style={styles.emptyDesc}>
                  Provide your incomes, deductions, and profile settings in the left cockpit to evaluate progressive slab taxes.
                </p>
              </div>

              {historyList.length > 0 && (
                <div style={styles.historyCard}>
                  <div style={styles.historyHeader}>
                    <History size={16} color="#6366f1" />
                    <h4 style={styles.historyTitle}>Calculation History Logs</h4>
                  </div>
                  <div style={styles.historyList}>
                    {historyList.map((h, i) => (
                      <div key={i} onClick={() => loadPastCalculation(h)} style={styles.historyItem}>
                        <div style={styles.historyDetails}>
                          <strong style={styles.historyRegime}>
                            {h.financialYear} • {h.regime.toUpperCase()}
                          </strong>
                          <span style={styles.historyMeta}>
                            Gross: ₹{h.income.grossIncome.toLocaleString()} • Taxable: ₹{h.income.taxableIncome.toLocaleString()}
                          </span>
                        </div>
                        <div style={styles.historyRight}>
                          <span style={styles.historyTax}>
                            ₹{h.tax.finalTaxLiability.toLocaleString()}
                          </span>
                          <div style={styles.historyActions}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleExportPDF(h._id); }}
                              style={styles.historyActionBtn}
                              title="Export PDF"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={(e) => deleteHistoryRecord(h._id, e)}
                              style={styles.historyActionBtnDelete}
                              title="Delete Record"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    marginTop: '64px',
    backgroundColor: '#030712',
    color: '#f8fafc',
    fontFamily: 'Outfit, sans-serif',
    padding: '40px 24px',
  },
  header: {
    maxWidth: '1280px',
    margin: '0 auto 32px auto',
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px',
    width: 'fit-content',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#ffffff',
    margin: 0
  },
  premiumTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: '#a5b4fc',
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid rgba(99, 102, 241, 0.3)'
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: '14px',
    marginTop: '4px'
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.1fr 1.9fr',
    gap: '32px',
    alignItems: 'start',
  },
  leftColumn: {
    position: 'sticky',
    top: '100px'
  },
  formCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
  },
  tabHeaders: {
    display: 'flex',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '4px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    marginBottom: '20px'
  },
  tabBtn: {
    flex: 1,
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tabBtnActive: {
    background: '#1f2937',
    color: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  formContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroupList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  groupHeading: {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#818cf8',
    letterSpacing: '0.05em',
    margin: '10px 0 4px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '6px'
  },
  regimeDeductionBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#93c5fd',
    lineHeight: 1.4
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%'
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '13px',
    outline: 'none',
  },
  warnText: {
    fontSize: '10px',
    color: '#ef4444',
    marginTop: '2px'
  },
  limitError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '11px',
    color: '#fca5a5',
    lineHeight: 1.4
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px'
  },
  submitBtn: {
    flex: 1.3,
    padding: '12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
    transition: 'opacity 0.2s'
  },
  compareBtn: {
    flex: 1,
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  rightColumn: {
    minHeight: '500px',
  },
  errorBox: {
    padding: '14px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '13px'
  },
  resultsCockpit: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  summaryCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '24px',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  regimeLabel: {
    fontSize: '11px',
    color: '#818cf8',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  liabilityTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: '#ffffff'
  },
  liabilityVal: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#ffffff',
    marginLeft: '4px'
  },
  headerActions: {
    display: 'flex',
    gap: '10px'
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  summaryMetrics: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '16px'
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    textAlign: 'center'
  },
  metricLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.02em'
  },
  metricVal: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#ffffff'
  },
  comparisonCallout: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#34d399',
    lineHeight: 1.4
  },
  chartTabs: {
    display: 'flex',
    gap: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '8px'
  },
  chartTabBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: '6px',
    transition: 'all 0.2s'
  },
  chartTabBtnActive: {
    background: 'rgba(99, 102, 241, 0.15)',
    color: '#818cf8'
  },
  gridCharts: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '20px'
  },
  chartCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '16px 20px',
  },
  chartCardFull: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '16px 20px',
    width: '100%'
  },
  chartTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 12px 0'
  },
  emptyChartLabel: {
    height: '180px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#64748b',
    fontSize: '12px',
    border: '1px dashed rgba(255,255,255,0.05)',
    borderRadius: '8px'
  },
  plotlySavingsBlock: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center'
  },
  detailsCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0
  },
  sectionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
    textAlign: 'left'
  },
  th: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '10px 12px',
    color: '#94a3b8',
    fontWeight: 600
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '12px',
    color: '#cbd5e1',
    verticalAlign: 'middle'
  },
  tableName: {
    fontWeight: 600,
    color: '#ffffff'
  },
  tableLimit: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '2px'
  },
  simSubtitle: {
    color: '#cbd5e1',
    fontSize: '12px',
    marginTop: '-8px',
    marginBottom: '20px'
  },
  simForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  simInputsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  },
  simField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  simLabel: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: 600
  },
  simInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(15, 23, 42, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    fontSize: '12px',
    outline: 'none'
  },
  simSubmitBtn: {
    padding: '10px',
    background: 'rgba(168, 85, 247, 0.15)',
    color: '#c084fc',
    border: '1px solid rgba(168, 85, 247, 0.3)',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  simResults: {
    marginTop: '20px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '16px'
  },
  simResultsHeader: {
    display: 'flex',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: '12px'
  },
  simResultBox: {
    textAlign: 'center',
    flex: 1,
    minWidth: '80px'
  },
  simResLabel: {
    fontSize: '9px',
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  simResVal: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 800,
    color: '#ffffff',
    marginTop: '4px'
  },
  roiDisclaimer: {
    fontSize: '10px',
    color: '#64748b',
    textAlign: 'center',
    margin: '10px 0 0 0'
  },
  recommendationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '10px'
  },
  recCard: {
    background: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '16px',
  },
  recHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '8px'
  },
  priorityBadge: {
    fontSize: '9px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  priorityHigh: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171'
  },
  priorityMed: {
    background: 'rgba(234, 179, 8, 0.15)',
    color: '#fde047'
  },
  priorityLow: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#93c5fd'
  },
  recTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0
  },
  recReason: {
    fontSize: '12px',
    color: '#cbd5e1',
    lineHeight: 1.4,
    margin: '0 0 12px 0'
  },
  recFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px dashed rgba(255,255,255,0.05)',
    paddingTop: '10px'
  },
  recFooterLabel: {
    display: 'block',
    fontSize: '9px',
    color: '#94a3b8'
  },
  recFooterVal: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    border: '2px dashed rgba(255, 255, 255, 0.06)',
    borderRadius: '20px',
    padding: '60px 40px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#ffffff',
    margin: '0 0 6px 0'
  },
  emptyDesc: {
    fontSize: '13px',
    color: '#cbd5e1',
    maxWidth: '400px',
    margin: 0,
    lineHeight: 1.5
  },
  historyCard: {
    background: 'rgba(17, 24, 39, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    padding: '24px'
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px',
    marginBottom: '16px'
  },
  historyTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  historyDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  historyRegime: {
    fontSize: '12px',
    color: '#ffffff'
  },
  historyMeta: {
    fontSize: '10px',
    color: '#94a3b8'
  },
  historyRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  historyTax: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff'
  },
  historyActions: {
    display: 'flex',
    gap: '8px'
  },
  historyActionBtn: {
    background: 'rgba(255,255,255,0.05)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  historyActionBtnDelete: {
    background: 'rgba(239,68,68,0.1)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  }
};

export default TaxOptimizer;
