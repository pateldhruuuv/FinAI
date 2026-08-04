import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
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
      await axios.delete(`/tax/history/${id}`);
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
      link.setAttribute('download', `Finmate_TaxReport_${calcId}.pdf`);
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
          colors: ['#ff6b35', '#918cff', '#3b82f6', '#10b981', '#f97316']
        },
        textinfo: 'percent+label',
        textfont: { color: '#ffffff', size: 9 }
      }];

      const incomeLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        showlegend: false,
        margin: { t: 10, b: 10, l: 10, r: 10 },
        height: 200,
        font: { family: 'Inter, sans-serif', color: '#ffffff' }
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
          marker: { color: '#ff6b35' }
        };

        const dedLayout = {
          barmode: 'group',
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          xaxis: { tickfont: { color: '#e3e2e2', size: 8 }, gridcolor: 'rgba(255,255,255,0.03)' },
          yaxis: { tickfont: { color: '#e3e2e2', size: 9 }, gridcolor: 'rgba(255,255,255,0.05)' },
          legend: { font: { color: '#ffffff', size: 8 }, x: 1, y: 1 },
          margin: { t: 20, b: 20, l: 40, r: 10 },
          height: 200,
          font: { family: 'Inter, sans-serif', color: '#ffffff' }
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
        marker: { color: '#918cff' },
        text: taxes.map(t => t > 0 ? `₹${t.toLocaleString()}` : ''),
        textposition: 'inside',
        textfont: { color: '#ffffff', size: 9 }
      };

      const slabLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { tickfont: { color: '#e3e2e2', size: 9 }, gridcolor: 'rgba(255,255,255,0.05)', title: 'Income Segment (₹)' },
        yaxis: { tickfont: { color: '#e3e2e2', size: 8 }, automargin: true },
        margin: { t: 10, b: 30, l: 110, r: 10 },
        height: 200,
        font: { family: 'Inter, sans-serif', color: '#ffffff' }
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
          title: { text: "Potential Tax Saved (₹)", font: { size: 11, color: '#e3e2e2' } },
          number: { font: { size: 24, color: '#10b981', family: 'Fraunces, serif' } },
          gauge: {
            axis: { range: [null, Math.max(10000, currTax)], tickwidth: 1, tickcolor: "#e3e2e2" },
            bar: { color: "#10b981" },
            bgcolor: "rgba(255,255,255,0.03)",
            borderwidth: 1,
            bordercolor: "rgba(255,255,255,0.1)",
            steps: [
              { range: [0, potentialSav], color: "rgba(16, 185, 129, 0.05)" }
            ],
          }
        }
      ];

      const gaugeLayout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 30, b: 10, l: 20, r: 20 },
        height: 150,
        font: { family: 'Inter, sans-serif', color: '#ffffff' }
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
        xaxis: { tickfont: { color: '#cbd5e1', size: 10 } },
        yaxis: { tickfont: { color: '#cbd5e1', size: 10 }, gridcolor: 'rgba(255,255,255,0.05)', title: '₹' },
        legend: { font: { color: '#ffffff', size: 9 } },
        margin: { t: 20, b: 20, l: 50, r: 10 },
        height: 220,
        font: { family: 'Inter, sans-serif', color: '#ffffff' }
      };

      window.Plotly.newPlot(compareChartRef.current, [trace1, trace2], compareLayout, { displayModeBar: false });
    }
  };

  const isDeductionsAllowed = formData.taxRegime === 'old';

  return (
    <div className="md:pl-20 mt-16 px-6 md:px-8 pt-10 md:pt-14 pb-6 md:pb-8 min-h-screen bg-background text-on-background font-sans max-w-[1600px] mx-auto animate-fade-in">

      {/* Header */}
      <header className="mb-8 border-b border-outline-variant pb-6">
        <Link to="/premium-dashboard" className="inline-flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface font-semibold mb-4 transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Hub
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="material-symbols-outlined text-3xl text-primary-container font-bold m-2">percent</span>
          <h1 className="font-display-hero text-3xl font-bold tracking-tight text-on-surface">Tax Optimizer 2.0</h1>
          <span className="bg-primary/10 border border-primary/20 text-primary-container text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Premium Rule-Based Tax Engine</span>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 m-2">
          Calculate liability with progressive slabs, compare regimes, and simulate optimized tax-saving scenarios.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* LEFT COLUMN: Input Cockpit */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm">
            <div className="flex bg-surface-container/60 border border-outline-variant/50 p-1 rounded-xl mb-6">
              {['income', 'deductions', 'settings'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${activeTab === tab
                    ? 'bg-surface-container-high text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <form onSubmit={handleCalculate} className="space-y-6">

              {/* TAB 1: Income Details */}
              {activeTab === 'income' && (
                <div className="space-y-4 font-sans">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-outline-variant/20 pb-2 mb-2">Annual Gross Income Components</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Salary / CTC (₹)</label>
                      <input
                        type="number"
                        name="annualSalary"
                        value={formData.annualSalary}
                        onChange={handleInputChange}
                        placeholder="e.g. 1200000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.annualSalary && <span className="text-[9px] text-error block mt-1">{validationErrors.annualSalary}</span>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Business Profits (₹)</label>
                      <input
                        type="number"
                        name="businessIncome"
                        value={formData.businessIncome}
                        onChange={handleInputChange}
                        placeholder="e.g. 250000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.businessIncome && <span className="text-[9px] text-error block mt-1">{validationErrors.businessIncome}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Rental Income (₹)</label>
                      <input
                        type="number"
                        name="rentalIncome"
                        value={formData.rentalIncome}
                        onChange={handleInputChange}
                        placeholder="e.g. 180000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.rentalIncome && <span className="text-[9px] text-error block mt-1">{validationErrors.rentalIncome}</span>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Capital Gains (₹)</label>
                      <input
                        type="number"
                        name="capitalGains"
                        value={formData.capitalGains}
                        onChange={handleInputChange}
                        placeholder="e.g. 50000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.capitalGains && <span className="text-[9px] text-error block mt-1">{validationErrors.capitalGains}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">FD Interest (₹)</label>
                      <input
                        type="number"
                        name="interestIncome"
                        value={formData.interestIncome}
                        onChange={handleInputChange}
                        placeholder="e.g. 15000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.interestIncome && <span className="text-[9px] text-error block mt-1">{validationErrors.interestIncome}</span>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Dividend Yield (₹)</label>
                      <input
                        type="number"
                        name="dividendIncome"
                        value={formData.dividendIncome}
                        onChange={handleInputChange}
                        placeholder="e.g. 5000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.dividendIncome && <span className="text-[9px] text-error block mt-1">{validationErrors.dividendIncome}</span>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Income from Other Sources (₹)</label>
                    <input
                      type="number"
                      name="otherIncome"
                      value={formData.otherIncome}
                      onChange={handleInputChange}
                      placeholder="e.g. 20000"
                      className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                    />
                    {validationErrors.otherIncome && <span className="text-[9px] text-error block mt-1">{validationErrors.otherIncome}</span>}
                  </div>
                </div>
              )}

              {/* TAB 2: Deductions */}
              {activeTab === 'deductions' && (
                <div className="space-y-4 font-sans">
                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-[11px] text-primary-container leading-relaxed flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                    <span>
                      {isDeductionsAllowed
                        ? "Old Regime is active. Deductions will be applied and limits verified on-the-fly."
                        : "New Regime is active. You can still input deductions to run comparisons or simulations."}
                    </span>
                  </div>

                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-outline-variant/20 pb-2 mb-2">Section 80C (Limit: ₹1.5L)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">PPF Contributions (₹)</label>
                      <input
                        type="number"
                        name="ppf"
                        value={formData.ppf}
                        onChange={handleInputChange}
                        placeholder="e.g. 50000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">ELSS Funds (₹)</label>
                      <input
                        type="number"
                        name="elss"
                        value={formData.elss}
                        onChange={handleInputChange}
                        placeholder="e.g. 50000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">EPF Claims (₹)</label>
                      <input
                        type="number"
                        name="epf"
                        value={formData.epf}
                        onChange={handleInputChange}
                        placeholder="e.g. 30000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Tax Saving FD (₹)</label>
                      <input
                        type="number"
                        name="taxSavingFD"
                        value={formData.taxSavingFD}
                        onChange={handleInputChange}
                        placeholder="e.g. 20000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Life Insurance (₹)</label>
                      <input
                        type="number"
                        name="lifeInsurance"
                        value={formData.lifeInsurance}
                        onChange={handleInputChange}
                        placeholder="e.g. 15000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">NSC Certificates (₹)</label>
                      <input
                        type="number"
                        name="nsc"
                        value={formData.nsc}
                        onChange={handleInputChange}
                        placeholder="e.g. 10000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Other 80C Claims (₹)</label>
                    <input
                      type="number"
                      name="other80C"
                      value={formData.other80C}
                      onChange={handleInputChange}
                      placeholder="e.g. 20000"
                      className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                    />
                  </div>
                  {validationErrors.sec80C && (
                    <div className="bg-error-container/20 border border-error/30 p-3 rounded-xl text-[10px] text-error flex items-start gap-1.5 leading-relaxed">
                      <span className="material-symbols-outlined text-xs mt-0.5">report_problem</span>
                      <span>{validationErrors.sec80C}</span>
                    </div>
                  )}

                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-outline-variant/20 pb-2 mb-2">Other Key Sections</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Health Insurance (80D)</label>
                      <input
                        type="number"
                        name="healthInsurance"
                        value={formData.healthInsurance}
                        onChange={handleInputChange}
                        placeholder="e.g. 15000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.sec80D && <span className="text-[9px] text-error block mt-1">{validationErrors.sec80D}</span>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">NPS (80CCD(1B))</label>
                      <input
                        type="number"
                        name="nps"
                        value={formData.nps}
                        onChange={handleInputChange}
                        placeholder="e.g. 50000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.sec80CCD_1B && <span className="text-[9px] text-error block mt-1">{validationErrors.sec80CCD_1B}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Home Loan Int (Sec 24b)</label>
                      <input
                        type="number"
                        name="homeLoanInterest"
                        value={formData.homeLoanInterest}
                        onChange={handleInputChange}
                        placeholder="e.g. 120000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.sec24B && <span className="text-[9px] text-error block mt-1">{validationErrors.sec24B}</span>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Education Loan (Sec 80E)</label>
                      <input
                        type="number"
                        name="educationLoanInterest"
                        value={formData.educationLoanInterest}
                        onChange={handleInputChange}
                        placeholder="e.g. 10000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Employer NPS (80CCD2)</label>
                      <input
                        type="number"
                        name="employerNps"
                        value={formData.employerNps}
                        onChange={handleInputChange}
                        placeholder="e.g. 60000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.employerNps && <span className="text-[9px] text-error block mt-1">{validationErrors.employerNps}</span>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Professional Tax (Sec16)</label>
                      <input
                        type="number"
                        name="professionalTax"
                        value={formData.professionalTax}
                        onChange={handleInputChange}
                        placeholder="e.g. 2500"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.professionalTax && <span className="text-[9px] text-error block mt-1">{validationErrors.professionalTax}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">LTA Exemption Claim</label>
                      <input
                        type="number"
                        name="lta"
                        value={formData.lta}
                        onChange={handleInputChange}
                        placeholder="e.g. 25000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Charitable Donations (80G)</label>
                      <input
                        type="number"
                        name="donations"
                        value={formData.donations}
                        onChange={handleInputChange}
                        placeholder="e.g. 5000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>

                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-outline-variant/20 pb-2 mb-2">Rent & HRA Calculations</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Annual Rent Paid (₹)</label>
                      <input
                        type="number"
                        name="rentPaid"
                        value={formData.rentPaid}
                        onChange={handleInputChange}
                        placeholder="e.g. 120000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">HRA Received (₹)</label>
                      <input
                        type="number"
                        name="hraReceived"
                        value={formData.hraReceived}
                        onChange={handleInputChange}
                        placeholder="e.g. 150000"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Basic Salary (Required for HRA, ₹)</label>
                    <input
                      type="number"
                      name="basicSalary"
                      value={formData.basicSalary}
                      onChange={handleInputChange}
                      placeholder="e.g. 480000"
                      className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: Settings & FY */}
              {activeTab === 'settings' && (
                <div className="space-y-4 font-sans">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest border-b border-outline-variant/20 pb-2 mb-2">Taxpayer Settings</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Current Age (Years) *</label>
                      <input
                        type="number"
                        name="age"
                        required
                        value={formData.age}
                        onChange={handleInputChange}
                        placeholder="e.g. 35"
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                      />
                      {validationErrors.age && <span className="text-[9px] text-error block mt-1">{validationErrors.age}</span>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Residential Status *</label>
                      <div className="relative">
                        <select
                          name="residentialStatus"
                          value={formData.residentialStatus}
                          onChange={handleInputChange}
                          className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface appearance-none focus:outline-none focus:border-primary-container"
                        >
                          <option value="Resident">Resident</option>
                          <option value="Non-Resident">Non-Resident</option>
                          <option value="RNOR">RNOR</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-2 text-on-surface-variant text-base pointer-events-none">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Financial Year *</label>
                      <div className="relative">
                        <select
                          name="financialYear"
                          value={formData.financialYear}
                          onChange={handleInputChange}
                          className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface appearance-none focus:outline-none focus:border-primary-container"
                        >
                          <option value="FY 2025-26">FY 2025-26</option>
                          <option value="FY 2024-25">FY 2024-25</option>
                          <option value="FY 2023-24">FY 2023-24</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-2 text-on-surface-variant text-base pointer-events-none">expand_more</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Default Regime *</label>
                      <div className="relative">
                        <select
                          name="taxRegime"
                          value={formData.taxRegime}
                          onChange={handleInputChange}
                          className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface appearance-none focus:outline-none focus:border-primary-container"
                        >
                          <option value="new">New Regime</option>
                          <option value="old">Old Regime</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-2 text-on-surface-variant text-base pointer-events-none">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-on-surface-variant block ml-1">Prepaid TDS / Advance Taxes (₹)</label>
                    <input
                      type="number"
                      name="tds"
                      value={formData.tds}
                      onChange={handleInputChange}
                      placeholder="e.g. 45000"
                      className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-outline-variant/30 mt-6 font-sans">
                <button
                  type="submit"
                  disabled={loading || Object.keys(validationErrors).length > 0}
                  className="flex-1 bg-primary hover:bg-primary/90 text-on-primary py-2.5 rounded-full text-xs font-bold transition-all disabled:opacity-40 cursor-pointer text-center"
                >
                  {loading ? 'Processing Slabs...' : 'Calculate Tax'}
                </button>
                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={loading || Object.keys(validationErrors).length > 0}
                  className="flex-1 border border-outline-variant hover:bg-surface-container/50 text-on-surface py-2.5 rounded-full text-xs font-bold transition-all disabled:opacity-40 cursor-pointer text-center"
                >
                  Compare Regimes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Results & Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-error-container/20 border-l-4 border-error text-error p-4 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">report_problem</span>
              <span>{error}</span>
            </div>
          )}

          {/* Calculation Result Dashboard */}
          {result && (
            <div className="space-y-6">
              {/* Summary Header */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-6 font-serif">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-4 flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] text-primary uppercase tracking-wider font-bold font-sans">{result.financialYear} • {result.regime.toUpperCase()} Regime Summary</span>
                    <h2 className="text-xl font-bold text-on-surface mt-1">
                      Net Tax Liability: <span className="text-2xl font-bold text-emerald-400 font-serif">₹{result.tax.finalTaxLiability.toLocaleString()}</span>
                    </h2>
                  </div>
                  <button
                    onClick={() => handleExportPDF(result.id)}
                    className="px-4 py-2 bg-surface-container border border-outline-variant rounded-full text-xs font-sans font-bold text-on-surface hover:bg-surface-container-high flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">download</span> Export PDF
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-surface-container/20 border border-outline-variant/20 p-4 rounded-xl">
                  <div className="text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Gross Income</span>
                    <strong className="text-sm font-bold text-on-surface">₹{result.income.grossIncome.toLocaleString()}</strong>
                  </div>
                  <div className="text-center border-x border-outline-variant/20">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">Taxable Income</span>
                    <strong className="text-sm font-bold text-on-surface">₹{result.income.taxableIncome.toLocaleString()}</strong>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-sans block mb-1">
                      {result.tax.taxRefund > 0 ? "Tax Refund Due" : "Tax Payable"}
                    </span>
                    <strong className={`text-sm font-bold ${result.tax.taxRefund > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ₹{(result.tax.taxRefund > 0 ? result.tax.taxRefund : result.tax.taxPayable).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dashed border-outline-variant/20 font-sans text-xs text-on-surface-variant">
                  <div className="text-center">
                    <span className="block text-[9px] uppercase font-semibold">Average Tax Rate</span>
                    <strong className="text-on-surface text-sm font-serif block mt-1">{result.tax.averageTaxRate || 0}%</strong>
                  </div>
                  <div className="text-center border-x border-outline-variant/20">
                    <span className="block text-[9px] uppercase font-semibold">Effective Tax Rate</span>
                    <strong className="text-on-surface text-sm font-serif block mt-1">{result.tax.effectiveTaxRate || 0}%</strong>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] uppercase font-semibold">Marginal Slab Rate</span>
                    <strong className="text-on-surface text-sm font-serif block mt-1">{result.tax.marginalTaxRate || 0}%</strong>
                  </div>
                </div>
              </div>

              {/* Toggle Visuals Tabs */}
              <div className="flex gap-2 border-b border-outline-variant/40 pb-2">
                <button
                  onClick={() => setActiveChartTab('summary')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeChartTab === 'summary'
                    ? 'bg-primary-container/10 border border-primary-container/20 text-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  Allocation & Claims
                </button>
                <button
                  onClick={() => setActiveChartTab('slabs')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeChartTab === 'slabs'
                    ? 'bg-primary-container/10 border border-primary-container/20 text-primary-container'
                    : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                >
                  Slab progressive breakdown
                </button>
              </div>

              {/* Render Charts */}
              {activeChartTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card rounded-2xl p-4 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
                    <h5 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-2">Income Distribution</h5>
                    <div ref={incomeChartRef} className="w-full"></div>
                  </div>
                  <div className="glass-card rounded-2xl p-4 border border-outline-variant/40 shadow-sm flex flex-col justify-between">
                    <h5 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-2">Claimed vs Applied Deductions</h5>
                    <div ref={deductionsChartRef} className="w-full min-h-[200px]">
                      {result.deductions.filter(d => d.claimedAmount > 0).length === 0 && (
                        <div className="h-44 border border-dashed border-outline-variant/20 rounded-xl flex items-center justify-center text-xs text-on-surface-variant/50">
                          No deduction claims submitted.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeChartTab === 'slabs' && (
                <div className="glass-card rounded-2xl p-4 border border-outline-variant/40 shadow-sm">
                  <h5 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-2">Progressive Slab Allocations</h5>
                  <div ref={slabsChartRef} className="w-full"></div>
                </div>
              )}

              {/* Deductions Validation List */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider font-serif">Deduction Claim Ledger Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                        <th className="py-2.5 px-3">Deduction Category</th>
                        <th className="py-2.5 px-3 text-right">Claimed</th>
                        <th className="py-2.5 px-3 text-right">Applied (Capped)</th>
                        <th className="py-2.5 px-3 text-right">Unused Benefit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {result.deductions.map((d, index) => {
                        const maxText = (d.maxAllowed === null || d.maxAllowed === undefined)
                          ? 'Variable'
                          : (d.maxAllowed === Infinity ? 'Unlimited' : `₹${d.maxAllowed.toLocaleString()}`);
                        return (
                          <tr key={index} className="hover:bg-surface-container/20 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-on-surface">{d.name}</div>
                              <div className="text-[9px] text-on-surface-variant/50 mt-0.5">Limit Cap: {maxText}</div>
                            </td>
                            <td className="py-3 px-3 text-right text-on-surface font-serif">₹{(d.claimedAmount || 0).toLocaleString()}</td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-400 font-serif">₹{(d.appliedAmount || 0).toLocaleString()}</td>
                            <td className={`py-3 px-3 text-right font-serif ${(d.unusedBenefit || 0) > 0 ? 'text-primary' : 'text-on-surface-variant/40'}`}>
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
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider font-serif">Scenario Optimization Simulator</h4>
                </div>
                <p className="text-xs text-on-surface-variant font-serif -mt-2">Simulate additional investments and evaluate direct tax savings.</p>

                <form onSubmit={handleSimulateScenario} className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block">Add ELSS Mutual Fund (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={scenarioData.elss || ''}
                        onChange={(e) => setScenarioData({ ...scenarioData, elss: parseFloat(e.target.value || 0) })}
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block">Add NPS Contribution (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={scenarioData.nps || ''}
                        onChange={(e) => setScenarioData({ ...scenarioData, nps: parseFloat(e.target.value || 0) })}
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block">Add Health Insurance (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 10000"
                        value={scenarioData.healthInsurance || ''}
                        onChange={(e) => setScenarioData({ ...scenarioData, healthInsurance: parseFloat(e.target.value || 0) })}
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-on-surface-variant block">Add Home Loan Interest (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={scenarioData.homeLoanInterest || ''}
                        onChange={(e) => setScenarioData({ ...scenarioData, homeLoanInterest: parseFloat(e.target.value || 0) })}
                        className="w-full bg-surface-container/60 border border-outline-variant rounded-xl px-3 py-2 text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={simLoading}
                    className="w-full py-2.5 bg-primary/10 border border-primary/20 text-primary-container font-bold rounded-xl transition-all hover:bg-primary hover:text-on-primary cursor-pointer text-center"
                  >
                    {simLoading ? 'Recalculating...' : 'Simulate Scenario'}
                  </button>
                </form>

                {scenarioResult && (
                  <div className="bg-surface-container/30 border border-outline-variant/30 rounded-xl p-4 space-y-3 font-serif">
                    <div className="grid grid-cols-4 gap-2 text-center divide-x divide-outline-variant/20">
                      <div>
                        <span className="text-[8px] text-on-surface-variant uppercase tracking-wider block font-sans">Current Tax</span>
                        <strong className="text-sm font-bold text-on-surface mt-1 block">₹{scenarioResult.currentTax.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[8px] text-on-surface-variant uppercase tracking-wider block font-sans">Simulated Tax</span>
                        <strong className="text-sm font-bold text-on-surface mt-1 block">₹{scenarioResult.newTax.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[8px] text-on-surface-variant uppercase tracking-wider block font-sans">Tax Saved</span>
                        <strong className="text-sm font-bold text-emerald-400 mt-1 block">₹{scenarioResult.taxSaved.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[8px] text-on-surface-variant uppercase tracking-wider block font-sans">Simulated ROI</span>
                        <strong className="text-sm font-bold text-primary mt-1 block">{scenarioResult.roi}%</strong>
                      </div>
                    </div>
                    <p className="text-[9px] text-on-surface-variant/40 text-center font-sans mt-2">
                      * Simulated ROI represents tax savings divided by additional simulated investment outflows.
                    </p>
                  </div>
                )}
              </div>

              {/* AI Recommendations Panel */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider font-serif">AI Optimization Recommendations</h4>
                </div>

                <div className="flex justify-center bg-surface-container/20 border border-outline-variant/20 rounded-xl p-4">
                  <div ref={savingsChartRef} className="w-full"></div>
                </div>

                <div className="space-y-3 font-serif">
                  {result.recommendations.map((r, index) => (
                    <div key={index} className="bg-surface-container/20 border border-outline-variant/20 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${r.priority === 'High' ? 'bg-error-container/20 text-error' : r.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-primary/10 text-primary-container'
                          }`}>
                          {r.priority} Priority
                        </span>
                        <h5 className="text-[12px] font-bold text-on-surface">{r.recommendation}</h5>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">{r.reason}</p>

                      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-dashed border-outline-variant/20 text-[10px]">
                        <div>
                          <span className="text-[8px] text-on-surface-variant font-sans block">Required Capital</span>
                          <strong className="text-on-surface">₹{r.investmentRequired.toLocaleString()}</strong>
                        </div>
                        <div className="text-center border-x border-outline-variant/20">
                          <span className="text-[8px] text-on-surface-variant font-sans block">Tax Saved</span>
                          <strong className="text-emerald-400">₹{r.estimatedTaxSaved.toLocaleString()}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-on-surface-variant font-sans block">Deadline</span>
                          <strong className="text-primary">{r.deadline || '31-Mar'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Dashboard */}
          {comparison && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4 font-serif">
                <div>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider font-sans">{comparison.financialYear} • Side-by-side Regime Comparison</span>
                  <h2 className="text-xl font-bold text-on-surface mt-1">
                    Recommended: <span className="text-emerald-400 uppercase font-serif">{comparison.betterRegime} Regime</span>
                  </h2>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-400 flex items-start gap-2 leading-relaxed">
                  <span className="material-symbols-outlined text-sm mt-0.5">trending_up</span>
                  <span>
                    Choosing the {comparison.betterRegime.toUpperCase()} Regime saves you approximately <strong>₹{comparison.savings.toLocaleString()}</strong> in taxes compared to the alternative.
                  </span>
                </div>
              </div>

              {/* Chart Tabs */}
              <div className="flex gap-2 border-b border-outline-variant/40 pb-2">
                <button
                  onClick={() => setActiveChartTab('comparison')}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary-container/10 border border-primary-container/20 text-primary-container"
                >
                  Comparison Plots
                </button>
              </div>

              {activeChartTab === 'comparison' && (
                <div className="glass-card rounded-2xl p-4 border border-outline-variant/40 shadow-sm">
                  <h5 className="text-[11px] font-bold text-on-surface uppercase tracking-wider mb-2">Old vs New Tax comparison</h5>
                  <div ref={compareChartRef} className="w-full"></div>
                </div>
              )}

              {/* Comparison Data Grid Table */}
              <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider font-serif">Detailed Parameters Slabs comparison</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/40 text-on-surface-variant">
                        <th className="py-2 px-3">Financial Parameter</th>
                        <th className="py-2 px-3 text-right">Old Regime</th>
                        <th className="py-2 px-3 text-right">New Regime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 font-serif">
                      <tr className="hover:bg-surface-container/20">
                        <td className="py-2.5 px-3">Gross Annual Income</td>
                        <td className="py-2.5 px-3 text-right">₹{comparison.grossIncome.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">₹{comparison.grossIncome.toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-surface-container/20">
                        <td className="py-2.5 px-3">Allowed Deductions</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">₹{(comparison.grossIncome - comparison.comparison.old.taxableIncome).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">₹{(comparison.grossIncome - comparison.comparison.new.taxableIncome).toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-surface-container/20 font-semibold">
                        <td className="py-2.5 px-3">Taxable Income Base</td>
                        <td className="py-2.5 px-3 text-right">₹{comparison.comparison.old.taxableIncome.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">₹{comparison.comparison.new.taxableIncome.toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-surface-container/20">
                        <td className="py-2.5 px-3">Standard Cess (4%)</td>
                        <td className="py-2.5 px-3 text-right">₹{comparison.comparison.old.cess.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right">₹{comparison.comparison.new.cess.toLocaleString()}</td>
                      </tr>
                      <tr className="hover:bg-surface-container/20 font-bold bg-surface-container/10">
                        <td className="py-3 px-3">Net Tax Liability</td>
                        <td className={`py-3 px-3 text-right ${comparison.betterRegime === 'old' ? 'text-emerald-400' : 'text-on-surface'}`}>
                          ₹{comparison.comparison.old.finalTaxLiability.toLocaleString()}
                        </td>
                        <td className={`py-3 px-3 text-right ${comparison.betterRegime === 'new' ? 'text-emerald-400' : 'text-on-surface'}`}>
                          ₹{comparison.comparison.new.finalTaxLiability.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Empty State & History Logs */}
          {!result && !comparison && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-12 border border-outline-variant/40 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px] border-dashed">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4 animate-pulse">percent</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface font-serif">Awaiting Parameter Computations</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mt-2 font-serif leading-relaxed">
                  Provide your incomes, deductions, and profile settings in the left cockpit to evaluate progressive slab taxes.
                </p>
              </div>

              {historyList.length > 0 && (
                <div className="glass-card rounded-2xl p-6 border border-outline-variant/40 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3 mb-3">
                    <span className="material-symbols-outlined text-primary text-lg">history</span>
                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider font-serif">Historical Run Audits</h4>
                  </div>
                  <div className="space-y-2.5">
                    {historyList.slice(0, 10).map((h, i) => (
                      <div
                        key={i}
                        onClick={() => loadPastCalculation(h)}
                        className="flex justify-between items-center p-3.5 bg-surface-container/20 border border-outline-variant/20 hover:border-primary/20 hover:bg-surface-container/40 rounded-xl transition-all cursor-pointer"
                      >
                        <div className="space-y-1 font-serif text-left">
                          <strong className="text-xs text-on-surface block font-bold leading-normal">
                            {h.financialYear} • {h.regime.toUpperCase()} Regime
                          </strong>
                          <span className="text-[10px] text-on-surface-variant/60 block font-sans leading-normal">
                            Gross: ₹{h.income.grossIncome.toLocaleString()} • Taxable: ₹{h.income.taxableIncome.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <strong className="text-sm text-emerald-400 font-serif">₹{h.tax.finalTaxLiability.toLocaleString()}</strong>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleExportPDF(h._id); }}
                              className="w-8 h-8 rounded-lg border border-outline-variant/60 hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant/80 hover:text-on-surface transition-colors cursor-pointer"
                              title="Export PDF"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">download</span>
                            </button>
                            <button
                              onClick={(e) => deleteHistoryRecord(h._id, e)}
                              className="w-8 h-8 rounded-lg border border-outline-variant/60 hover:bg-error-container/10 hover:text-error flex items-center justify-center text-on-surface-variant/80 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">delete</span>
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

export default TaxOptimizer;
