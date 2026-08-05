const TaxCalculation = require('../models/TaxCalculation');
const TaxAnalysis = require('../models/TaxAnalysis');
const PremiumRecommendations = require('../models/PremiumRecommendations');
const taxCalculator = require('../utils/taxCalculator');
const PDFDocument = require('pdfkit');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

// Helper to extract Gemini reply
const extractGeminiReply = (data) => {
  if (data?.output_text) return data.output_text;
  const modelOutput = data?.steps?.find((step) => step.type === 'model_output');
  const textPart = modelOutput?.content?.find((part) => part.type === 'text');
  return textPart?.text || null;
};

// Strict checks for invalid numbers
function isInvalid(val) {
  if (val === undefined || val === null) return false;
  const num = Number(val);
  return isNaN(num) || !isFinite(num);
}

// Input validation logic
function validateTaxInputs(body) {
  // Check for NaN and Infinity in all possible numeric inputs
  const checkFields = [
    'annualSalary', 'businessIncome', 'rentalIncome', 'capitalGains', 'otherIncome',
    'interestIncome', 'dividendIncome', 'age', 'rentPaid', 'hraReceived', 'basicSalary', 'tds'
  ];

  for (const f of checkFields) {
    if (isInvalid(body[f])) {
      throw new Error(`Field '${f}' contains an invalid number (NaN or Infinity)`);
    }
  }

  if (body.deductions) {
    for (const d in body.deductions) {
      if (isInvalid(body.deductions[d])) {
        throw new Error(`Deduction field '${d}' contains an invalid number (NaN or Infinity)`);
      }
    }
  }

  // Mandatory fields
  if (body.age === undefined || body.age === null || body.age === '') {
    throw new Error('Age is a required field');
  }
  if (!body.residentialStatus) throw new Error('Residential Status is a required field');
  if (!body.financialYear) throw new Error('Financial Year is a required field');
  if (!body.taxRegime) throw new Error('Tax Regime is a required field');

  const age = Number(body.age);
  if (age <= 0 || age > 120) {
    throw new Error('Age must be a valid number between 1 and 120');
  }

  const annualSalary = Number(body.annualSalary || 0);
  const businessIncome = Number(body.businessIncome || 0);
  const rentalIncome = Number(body.rentalIncome || 0);
  const capitalGains = Number(body.capitalGains || 0);
  const otherIncome = Number(body.otherIncome || 0);
  const interestIncome = Number(body.interestIncome || 0);
  const dividendIncome = Number(body.dividendIncome || 0);

  // Negative Income check
  if (annualSalary < 0 || businessIncome < 0 || rentalIncome < 0 || capitalGains < 0 || otherIncome < 0 || interestIncome < 0 || dividendIncome < 0) {
    throw new Error('Income values cannot be negative');
  }

  const decs = body.deductions || {};
  const ppf = Number(decs.ppf || 0);
  const elss = Number(decs.elss || 0);
  const epf = Number(decs.epf || 0);
  const lifeInsurance = Number(decs.lifeInsurance || 0);
  const taxSavingFD = Number(decs.taxSavingFD || 0);
  const nsc = Number(decs.nsc || 0);
  const other80C = Number(decs.other80C || 0);
  const healthInsurance = Number(decs.healthInsurance || 0);
  const other80D = Number(decs.other80D || 0);
  const nps = Number(decs.nps || 0);
  const employerNps = Number(decs.employerNps || 0);
  const homeLoanInterest = Number(decs.homeLoanInterest || 0);
  const educationLoanInterest = Number(decs.educationLoanInterest || 0);
  const donations = Number(decs.donations || 0);
  const professionalTax = Number(decs.professionalTax || 0);
  const lta = Number(decs.lta || 0);
  const rentPaid = Number(body.rentPaid || decs.rentPaid || 0);
  const hraReceived = Number(body.hraReceived || decs.hraReceived || 0);
  const basicSalary = Number(body.basicSalary || decs.basicSalary || 0);
  const tds = Number(body.tds || decs.tds || 0);

  // Negative Deductions check
  if (
    ppf < 0 || elss < 0 || epf < 0 || lifeInsurance < 0 || taxSavingFD < 0 || nsc < 0 || other80C < 0 ||
    healthInsurance < 0 || other80D < 0 || nps < 0 || employerNps < 0 || homeLoanInterest < 0 ||
    educationLoanInterest < 0 || donations < 0 || professionalTax < 0 || lta < 0 ||
    rentPaid < 0 || hraReceived < 0 || basicSalary < 0 || tds < 0
  ) {
    throw new Error('Deduction values and taxes paid cannot be negative');
  }

  // Legal Limits validations - Throw 400 if user claims exceeds the legal thresholds
  const total80C = ppf + elss + epf + lifeInsurance + taxSavingFD + nsc + other80C;
  if (total80C > 150000) {
    throw new Error('Total claimed Section 80C deductions exceed the legal limit of ₹1,50,000');
  }

  const limit80D = age >= 60 ? 50000 : 25000;
  const total80D = healthInsurance + other80D;
  if (total80D > limit80D) {
    throw new Error(`Total claimed Section 80D deductions exceed the legal limit of ₹${limit80D.toLocaleString()} for your age`);
  }

  if (nps > 50000) {
    throw new Error('Total claimed Section 80CCD(1B) (NPS) deductions exceed the legal limit of ₹50,000');
  }

  if (homeLoanInterest > 200000) {
    throw new Error('Total claimed Section 24(b) (Home Loan Interest) deductions exceed the legal limit of ₹2,00,000');
  }

  if (professionalTax > 2500) {
    throw new Error('Total claimed Professional Tax deduction exceeds the legal limit of ₹2,500');
  }

  // Financial Year verification
  const cleanFy = String(body.financialYear).replace(/\s+/g, '');
  if (cleanFy !== 'FY2023-24' && cleanFy !== 'FY2024-25' && cleanFy !== 'FY2025-26') {
    throw new Error('Invalid Financial Year selected');
  }

  // Regime verification
  if (body.taxRegime !== 'old' && body.taxRegime !== 'new') {
    throw new Error('Invalid Tax Regime selected');
  }
}

// Internal tax calculation runner
function performCalculation(body) {
  const annualSalary = Number(body.annualSalary || 0);
  const businessIncome = Number(body.businessIncome || 0);
  const rentalIncome = Number(body.rentalIncome || 0);
  const capitalGains = Number(body.capitalGains || 0);
  const otherIncome = Number(body.otherIncome || 0);
  const interestIncome = Number(body.interestIncome || 0);
  const dividendIncome = Number(body.dividendIncome || 0);
  const age = Number(body.age || 30);
  const residentialStatus = body.residentialStatus || 'Resident';
  const financialYear = body.financialYear || 'FY 2024-25';
  const taxRegime = body.taxRegime || 'new';

  const decs = body.deductions || {};
  const ppf = Number(decs.ppf || 0);
  const elss = Number(decs.elss || 0);
  const epf = Number(decs.epf || 0);
  const lifeInsurance = Number(decs.lifeInsurance || 0);
  const taxSavingFD = Number(decs.taxSavingFD || 0);
  const nsc = Number(decs.nsc || 0);
  const other80C = Number(decs.other80C || 0);
  const healthInsurance = Number(decs.healthInsurance || 0);
  const other80D = Number(decs.other80D || 0);
  const nps = Number(decs.nps || 0);
  const employerNps = Number(decs.employerNps || 0);
  const homeLoanInterest = Number(decs.homeLoanInterest || 0);
  const educationLoanInterest = Number(decs.educationLoanInterest || 0);
  const donations = Number(decs.donations || 0);
  const professionalTax = Number(decs.professionalTax || 0);
  const lta = Number(decs.lta || 0);
  const rentPaid = Number(body.rentPaid || decs.rentPaid || 0);
  const hraReceived = Number(body.hraReceived || decs.hraReceived || 0);
  const basicSalary = Number(body.basicSalary || decs.basicSalary || 0);
  const tds = Number(body.tds || decs.tds || 0);

  // Gross Income
  const grossIncome = taxCalculator.calculateGrossIncome({
    annualSalary, businessIncome, rentalIncome, capitalGains, otherIncome, interestIncome, dividendIncome
  });

  // Deductions calculation
  const deductionsBreakdown = taxCalculator.calculateDeductions({
    annualSalary,
    basicSalary,
    rentPaid,
    hraReceived,
    deductions: {
      ppf, elss, epf, lifeInsurance, taxSavingFD, nsc, other80C,
      healthInsurance, other80D, nps, employerNps, homeLoanInterest,
      educationLoanInterest, donations, professionalTax, lta,
      businessIncome, rentalIncome, capitalGains, otherIncome, interestIncome, dividendIncome
    },
    regime: taxRegime,
    fy: financialYear,
    age
  });

  // Taxable Income
  const taxableIncome = taxCalculator.calculateTaxableIncome(grossIncome, deductionsBreakdown);

  // Slab tax calculation
  const slabTaxResult = taxCalculator.calculateBaseSlabTax(taxableIncome, taxRegime, financialYear, age);
  const totalTax = slabTaxResult.totalTax;

  // Rebate calculation (with 87A Marginal Relief)
  const rebateApplied = taxCalculator.calculateRebate(taxableIncome, totalTax, taxRegime, financialYear);
  const taxAfterRebate = Math.max(0, totalTax - rebateApplied);

  // Surcharge calculation (with Surcharge Marginal Relief)
  const surchargeResult = taxCalculator.calculateSurcharge(taxAfterRebate, taxableIncome, taxRegime, financialYear);
  const surcharge = surchargeResult.surcharge;
  const taxAfterSurcharge = taxAfterRebate + surcharge;

  // Cess calculation (4%)
  const cess = taxCalculator.calculateCess(taxAfterSurcharge, financialYear);
  
  // Net Tax
  const finalTaxLiability = taxCalculator.calculateNetTax(taxAfterSurcharge, cess);

  // Tax rates
  const rates = taxCalculator.calculateRates(grossIncome, taxableIncome, finalTaxLiability, slabTaxResult.breakdown);

  // Refund vs Payable
  const taxPayable = Math.max(0, finalTaxLiability - tds);
  const taxRefund = Math.max(0, tds - finalTaxLiability);

  // Deductions List Format (Audit Trail for Claimed, Max, Applied, Rejected, Unused, Reason)
  const cleanFy = String(financialYear).replace(/\s+/g, '');
  const empNpsRate = (taxRegime === 'new' && (cleanFy === 'FY2024-25' || cleanFy === 'FY2025-26')) ? 0.14 : 0.10;
  const limit80D = age >= 60 ? 50000 : 25000;

  const deductionsList = [
    {
      code: 'standardDeduction',
      name: 'Standard Deduction (Salaried)',
      claimedAmount: deductionsBreakdown.standardDeduction?.claimed || 0,
      maxAllowed: deductionsBreakdown.standardDeduction?.claimed || 0,
      appliedAmount: deductionsBreakdown.standardDeduction?.allowed || 0,
      unusedBenefit: deductionsBreakdown.standardDeduction?.unused || 0,
      reason: 'Standard flat deduction allowed for salaried employees.'
    },
    {
      code: 'sec80C',
      name: 'Section 80C (PPF, ELSS, EPF, FD, NSC, LIC)',
      claimedAmount: deductionsBreakdown.sec80C?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : 150000,
      appliedAmount: deductionsBreakdown.sec80C?.allowed || 0,
      unusedBenefit: deductionsBreakdown.sec80C?.unused || 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : 'Investment under Section 80C capped at ₹1.5L.'
    },
    {
      code: 'sec80D',
      name: 'Section 80D (Health Insurance)',
      claimedAmount: deductionsBreakdown.sec80D?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : limit80D,
      appliedAmount: deductionsBreakdown.sec80D?.allowed || 0,
      unusedBenefit: deductionsBreakdown.sec80D?.unused || 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : `Capped at ₹${limit80D.toLocaleString()} for health premium.`
    },
    {
      code: 'sec80CCD_1B',
      name: 'Section 80CCD(1B) (NPS Individual)',
      claimedAmount: deductionsBreakdown.sec80CCD_1B?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : 50000,
      appliedAmount: deductionsBreakdown.sec80CCD_1B?.allowed || 0,
      unusedBenefit: deductionsBreakdown.sec80CCD_1B?.unused || 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : 'Additional NPS contribution capped at ₹50,000.'
    },
    {
      code: 'sec80CCD_2',
      name: 'Section 80CCD(2) (Employer NPS)',
      claimedAmount: deductionsBreakdown.sec80CCD_2?.claimed || 0,
      maxAllowed: Math.round(basicSalary * empNpsRate),
      appliedAmount: deductionsBreakdown.sec80CCD_2?.allowed || 0,
      unusedBenefit: deductionsBreakdown.sec80CCD_2?.unused || 0,
      reason: `Employer NPS contribution capped at ${empNpsRate * 100}% of Basic Salary. Available in both regimes.`
    },
    {
      code: 'sec24B',
      name: 'Section 24(b) (Home Loan Interest)',
      claimedAmount: deductionsBreakdown.sec24B?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : 200000,
      appliedAmount: deductionsBreakdown.sec24B?.allowed || 0,
      unusedBenefit: deductionsBreakdown.sec24B?.unused || 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : 'Interest on housing loan capped at ₹2,00,000.'
    },
    {
      code: 'sec80E',
      name: 'Section 80E (Education Loan Interest)',
      claimedAmount: deductionsBreakdown.sec80E?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : null,
      appliedAmount: deductionsBreakdown.sec80E?.allowed || 0,
      unusedBenefit: 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : 'Deduction for higher education loan interest. Unlimited limit.'
    },
    {
      code: 'sec80G',
      name: 'Section 80G (Charitable Donations)',
      claimedAmount: deductionsBreakdown.sec80G?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : null,
      appliedAmount: deductionsBreakdown.sec80G?.allowed || 0,
      unusedBenefit: 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : 'Charitable donations deduction. Unlimited limit.'
    },
    {
      code: 'professionalTax',
      name: 'Section 16(iii) (Professional Tax)',
      claimedAmount: deductionsBreakdown.professionalTax?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : 2500,
      appliedAmount: deductionsBreakdown.professionalTax?.allowed || 0,
      unusedBenefit: deductionsBreakdown.professionalTax?.unused || 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : 'Professional tax paid, capped at ₹2,500.'
    },
    {
      code: 'lta',
      name: 'Section 10(5) (LTA Exemption)',
      claimedAmount: deductionsBreakdown.lta?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : null,
      appliedAmount: deductionsBreakdown.lta?.allowed || 0,
      unusedBenefit: 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : 'Leave Travel Allowance exemption.'
    },
    {
      code: 'rentDeduction',
      name: 'House Rent (HRA Exemption / 80GG)',
      claimedAmount: deductionsBreakdown.rentDeduction?.claimed || 0,
      maxAllowed: taxRegime === 'new' ? 0 : (hraReceived > 0 ? hraReceived : 60000),
      appliedAmount: deductionsBreakdown.rentDeduction?.allowed || 0,
      unusedBenefit: deductionsBreakdown.rentDeduction?.unused || 0,
      reason: taxRegime === 'new' ? 'Not allowed under the New Regime.' : (hraReceived > 0 ? 'HRA exemption calculated under Section 10(13A).' : 'Rent deduction under Section 80GG.')
    }
  ];

  return {
    grossIncome,
    taxableIncome,
    totalTax,
    rebateApplied,
    surcharge,
    marginalRelief: surchargeResult.marginalRelief,
    cess,
    finalTaxLiability,
    taxRefund,
    taxPayable,
    slabBreakdown: slabTaxResult.breakdown,
    deductionsList,
    deductionsBreakdown,
    rates
  };
}

// Local simulation logic for recommendations
function generateLocalRecommendations(body, baseTaxCalc) {
  const recommendations = [];
  const age = Number(body.age || 30);
  const financialYear = body.financialYear || 'FY 2024-25';

  const decs = body.deductions || {};
  const ppf = Number(decs.ppf || 0);
  const elss = Number(decs.elss || 0);
  const epf = Number(decs.epf || 0);
  const lifeInsurance = Number(decs.lifeInsurance || 0);
  const taxSavingFD = Number(decs.taxSavingFD || 0);
  const nsc = Number(decs.nsc || 0);
  const other80C = Number(decs.other80C || 0);
  const healthInsurance = Number(decs.healthInsurance || 0);
  const other80D = Number(decs.other80D || 0);
  const nps = Number(decs.nps || 0);

  const claimed80C = ppf + elss + epf + lifeInsurance + taxSavingFD + nsc + other80C;
  const claimed80D = healthInsurance + other80D;
  const limit80D = age >= 60 ? 50000 : 25000;

  const year = financialYear.endsWith('24') ? '2024' : (financialYear.endsWith('25') ? '2025' : '2026');
  const deadline = `March 31, ${year}`;

  const runSimOldRegime = (customDeductions) => {
    const simBody = {
      ...body,
      taxRegime: 'old',
      deductions: {
        ...decs,
        ...customDeductions
      }
    };
    const res = performCalculation(simBody);
    return res.finalTaxLiability;
  };

  const baseOldTax = body.taxRegime === 'old' ? baseTaxCalc.finalTaxLiability : runSimOldRegime({});

  // 1. ELSS / PPF under Section 80C
  if (claimed80C < 150000) {
    const required = 150000 - claimed80C;
    const simTax = runSimOldRegime({ ppf: ppf + required });
    const saved = Math.max(0, baseOldTax - simTax);
    if (saved > 0) {
      recommendations.push({
        recommendation: 'Maximize Section 80C using ELSS or PPF',
        estimatedTaxSaved: saved,
        investmentRequired: required,
        priority: saved > 10000 ? 'High' : (saved > 2000 ? 'Medium' : 'Low'),
        reason: `Maximize your Section 80C limit (currently claimed: ₹${claimed80C.toLocaleString()} out of ₹1,50,000). Investing ₹${required.toLocaleString()} in ELSS or PPF will lower your taxable income under Old Regime.`,
        expectedROI: Number(((saved / required) * 100).toFixed(2)),
        difficulty: 'Easy',
        deadline
      });
    }
  }

  // 2. NPS under Section 80CCD(1B)
  if (nps < 50000) {
    const required = 50000 - nps;
    const simTax = runSimOldRegime({ nps: nps + required });
    const saved = Math.max(0, baseOldTax - simTax);
    if (saved > 0) {
      recommendations.push({
        recommendation: 'Contribute to NPS under Section 80CCD(1B)',
        estimatedTaxSaved: saved,
        investmentRequired: required,
        priority: saved > 10000 ? 'High' : (saved > 2000 ? 'Medium' : 'Low'),
        reason: `Claim an additional tax benefit of up to ₹50,000 under Section 80CCD(1B) by investing in the National Pension System (NPS).`,
        expectedROI: Number(((saved / required) * 100).toFixed(2)),
        difficulty: 'Easy',
        deadline
      });
    }
  }

  // 3. Health Insurance under Section 80D
  if (claimed80D < limit80D) {
    const required = limit80D - claimed80D;
    const simTax = runSimOldRegime({ healthInsurance: healthInsurance + required });
    const saved = Math.max(0, baseOldTax - simTax);
    if (saved > 0) {
      recommendations.push({
        recommendation: 'Purchase Health Insurance under Section 80D',
        estimatedTaxSaved: saved,
        investmentRequired: required,
        priority: saved > 10000 ? 'High' : (saved > 2000 ? 'Medium' : 'Low'),
        reason: `Fully utilize Section 80D (currently claimed: ₹${claimed80D.toLocaleString()} out of ₹${limit80D.toLocaleString()}). Purchasing health insurance for self or family saves tax while providing medical security.`,
        expectedROI: Number(((saved / required) * 100).toFixed(2)),
        difficulty: 'Easy',
        deadline
      });
    }
  }

  // 4. Regime Switch Recommendation
  const runSimNew = () => {
    const simBody = { ...body, taxRegime: 'new' };
    return performCalculation(simBody).finalTaxLiability;
  };
  const baseNewTax = body.taxRegime === 'new' ? baseTaxCalc.finalTaxLiability : runSimNew();

  if (baseOldTax > baseNewTax) {
    const saved = baseOldTax - baseNewTax;
    recommendations.unshift({
      recommendation: 'Switch to the New Tax Regime',
      estimatedTaxSaved: saved,
      investmentRequired: 0,
      priority: saved > 10000 ? 'High' : 'Medium',
      reason: `Calculations indicate that the New Tax Regime is cheaper for your income profile, saving you ₹${saved.toLocaleString()} without requiring any tax investments.`,
      expectedROI: 100,
      difficulty: 'Easy',
      deadline: 'Before filing ITR'
    });
  } else if (baseNewTax > baseOldTax) {
    const saved = baseNewTax - baseOldTax;
    recommendations.unshift({
      recommendation: 'Opt for the Old Tax Regime',
      estimatedTaxSaved: saved,
      investmentRequired: 0,
      priority: saved > 10000 ? 'High' : 'Medium',
      reason: `By utilizing deductions, the Old Tax Regime reduces your tax liability by ₹${saved.toLocaleString()} compared to the New Tax Regime. Make sure to declare opting out of the New Regime.`,
      expectedROI: 100,
      difficulty: 'Easy',
      deadline: 'Before filing ITR'
    });
  }

  // General fallback recommendation if limits are met
  if (recommendations.length === 0) {
    recommendations.push({
      recommendation: 'Maintain current tax-saving portfolio',
      estimatedTaxSaved: 0,
      investmentRequired: 0,
      priority: 'Low',
      reason: 'Excellent work! You have maximized the core tax deductions (Section 80C, 80D, and NPS) available under the Old Tax Regime.',
      expectedROI: 0,
      difficulty: 'Easy',
      deadline
    });
  }

  return recommendations;
}

// AI recommendations generator
async function generateRecommendationsAI(body, baseTaxCalc) {
  const localRecs = generateLocalRecommendations(body, baseTaxCalc);

  if (!process.env.GEMINI_API_KEY) {
    return localRecs;
  }

  try {
    const prompt = `You are a professional Indian Tax Optimization Advisor.
We have calculated the tax using a rule-based engine. Here is the context:
Financial Year: ${body.financialYear}
Age: ${body.age}
Status: ${body.residentialStatus}
Gross Income: ₹${baseTaxCalc.grossIncome}
Taxable Income (Current Regime - ${body.taxRegime}): ₹${baseTaxCalc.taxableIncome}
Current Net Tax: ₹${baseTaxCalc.finalTaxLiability}

Pre-Calculated Mathematical Recommendation Options:
${JSON.stringify(localRecs, null, 2)}

Please rephrase, expand, and format these recommendations into a professional advice format.
You MUST output a valid JSON array of objects representing these recommendations. Do NOT change the mathematical numbers ("estimatedTaxSaved", "investmentRequired", and "expectedROI"). Only update the "recommendation", "priority", "reason", "difficulty", and "deadline" text to make them sound highly professional, personalized, and clear. Do not include markdown code block syntax (like \`\`\`json) or any explanation. Output only the raw JSON.

Output format:
[
  {
    "recommendation": "...",
    "estimatedTaxSaved": 15000,
    "investmentRequired": 50000,
    "priority": "High",
    "reason": "...",
    "expectedROI": 30.0,
    "difficulty": "Easy",
    "deadline": "March 31, 2025"
  }
]`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: prompt,
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const text = extractGeminiReply(data);
      if (text) {
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("AI recommendation request failed; using rule-based local simulation. Error:", err.message);
  }

  return localRecs;
}

// 1. POST /tax/calculate
exports.calculateTax = async (req, res) => {
  try {
    validateTaxInputs(req.body);

    const calcResult = performCalculation(req.body);
    const recommendations = await generateRecommendationsAI(req.body, calcResult);

    // Save to Database in TaxCalculations collection
    const taxCalc = new TaxCalculation({
      userId: req.user,
      income: {
        annualSalary: Number(req.body.annualSalary || 0),
        businessIncome: Number(req.body.businessIncome || 0),
        rentalIncome: Number(req.body.rentalIncome || 0),
        capitalGains: Number(req.body.capitalGains || 0),
        otherIncome: Number(req.body.otherIncome || 0),
        interestIncome: Number(req.body.interestIncome || 0),
        dividendIncome: Number(req.body.dividendIncome || 0),
        grossIncome: calcResult.grossIncome,
        taxableIncome: calcResult.taxableIncome
      },
      regime: req.body.taxRegime,
      age: Number(req.body.age),
      residentialStatus: req.body.residentialStatus,
      financialYear: req.body.financialYear,
      tax: {
        totalTax: calcResult.totalTax,
        rebateApplied: calcResult.rebateApplied,
        surcharge: calcResult.surcharge,
        marginalRelief: calcResult.marginalRelief,
        cess: calcResult.cess,
        finalTaxLiability: calcResult.finalTaxLiability,
        taxRefund: calcResult.taxRefund,
        taxPayable: calcResult.taxPayable,
        averageTaxRate: calcResult.rates.averageTaxRate,
        effectiveTaxRate: calcResult.rates.effectiveTaxRate,
        marginalTaxRate: calcResult.rates.marginalTaxRate,
        slabBreakdown: calcResult.slabBreakdown
      },
      deductions: calcResult.deductionsList,
      recommendations: recommendations
    });
    await taxCalc.save();

    // Sync with old TaxAnalysis model for backward compatibility
    const oldDeductions = calcResult.deductionsBreakdown;
    await TaxAnalysis.findOneAndUpdate(
      { userId: req.user },
      {
        annualIncome: calcResult.grossIncome,
        salaryStructure: {
          basic: Number(req.body.basicSalary || 0),
          hra: Number(req.body.hraReceived || 0),
          specialAllowance: 0,
          other: 0
        },
        deductions80C: oldDeductions.sec80C?.claimed || 0,
        deductions80D: oldDeductions.sec80D?.claimed || 0,
        homeLoanInterest: oldDeductions.sec24B?.claimed || 0,
        educationLoanInterest: oldDeductions.sec80E?.claimed || 0,
        rentPaid: Number(req.body.rentPaid || 0),
        hraExemption: oldDeductions.rentDeduction?.allowed || 0,
        taxableIncome: calcResult.taxableIncome,
        currentTax: calcResult.finalTaxLiability,
        potentialSavings: recommendations.reduce((acc, r) => acc + r.estimatedTaxSaved, 0),
        recommendedInvestments: recommendations.map(r => `${r.recommendation}: ₹${r.investmentRequired.toLocaleString()}`),
        createdAt: Date.now()
      },
      { upsert: true, new: true }
    );

    // Sync Centralized Recommendations
    const totalPotentialSavings = recommendations.reduce((acc, r) => acc + r.estimatedTaxSaved, 0);
    const textAdvice = `Potential tax savings: ₹${totalPotentialSavings.toLocaleString()}. Recommendations: ${recommendations.map(r => r.recommendation).join(', ')}`;
    await PremiumRecommendations.findOneAndUpdate(
      { userId: req.user },
      {
        taxAdvice: textAdvice,
        updatedAt: Date.now()
      },
      { upsert: true, new: true }
    );

    res.json({
      status: 'success',
      data: {
        id: taxCalc._id,
        income: taxCalc.income,
        regime: taxCalc.regime,
        age: taxCalc.age,
        residentialStatus: taxCalc.residentialStatus,
        financialYear: taxCalc.financialYear,
        tax: taxCalc.tax,
        deductions: taxCalc.deductions,
        recommendations: taxCalc.recommendations,
        timestamp: taxCalc.timestamp
      }
    });
  } catch (err) {
    console.error('Error in calculateTax:', err);
    res.status(
      err.message.includes('exceed') || err.message.includes('required') || err.message.includes('negative') || err.message.includes('invalid') || err.message.includes('Invalid') ? 400 : 500
    ).json({
      status: 'error',
      message: err.message || 'Server error during tax calculation'
    });
  }
};

// 2. POST /tax/compare
exports.compareRegimes = async (req, res) => {
  try {
    validateTaxInputs(req.body);

    const oldRegimeBody = { ...req.body, taxRegime: 'old' };
    const newRegimeBody = { ...req.body, taxRegime: 'new' };

    const oldCalc = performCalculation(oldRegimeBody);
    const newCalc = performCalculation(newRegimeBody);

    const diff = Math.abs(oldCalc.finalTaxLiability - newCalc.finalTaxLiability);
    const betterRegime = oldCalc.finalTaxLiability < newCalc.finalTaxLiability ? 'old' : 'new';

    res.json({
      status: 'success',
      data: {
        grossIncome: oldCalc.grossIncome,
        financialYear: req.body.financialYear,
        comparison: {
          old: {
            taxableIncome: oldCalc.taxableIncome,
            taxBeforeCess: oldCalc.totalTax,
            rebateApplied: oldCalc.rebateApplied,
            surcharge: oldCalc.surcharge,
            marginalRelief: oldCalc.marginalRelief,
            cess: oldCalc.cess,
            finalTaxLiability: oldCalc.finalTaxLiability,
            averageTaxRate: oldCalc.rates.averageTaxRate,
            effectiveTaxRate: oldCalc.rates.effectiveTaxRate,
            marginalTaxRate: oldCalc.rates.marginalTaxRate,
            slabBreakdown: oldCalc.slabBreakdown
          },
          new: {
            taxableIncome: newCalc.taxableIncome,
            taxBeforeCess: newCalc.totalTax,
            rebateApplied: newCalc.rebateApplied,
            surcharge: newCalc.surcharge,
            marginalRelief: newCalc.marginalRelief,
            cess: newCalc.cess,
            finalTaxLiability: newCalc.finalTaxLiability,
            averageTaxRate: newCalc.rates.averageTaxRate,
            effectiveTaxRate: newCalc.rates.effectiveTaxRate,
            marginalTaxRate: newCalc.rates.marginalTaxRate,
            slabBreakdown: newCalc.slabBreakdown
          }
        },
        savings: diff,
        betterRegime
      }
    });
  } catch (err) {
    console.error('Error in compareRegimes:', err);
    res.status(
      err.message.includes('exceed') || err.message.includes('required') || err.message.includes('negative') || err.message.includes('invalid') || err.message.includes('Invalid') ? 400 : 500
    ).json({
      status: 'error',
      message: err.message || 'Server error during regime comparison'
    });
  }
};

// 3. POST /tax/recommend
exports.getRecommendations = async (req, res) => {
  try {
    validateTaxInputs(req.body);
    const calcResult = performCalculation(req.body);
    const recommendations = await generateRecommendationsAI(req.body, calcResult);

    res.json({
      status: 'success',
      data: {
        recommendations,
        baseTaxLiability: calcResult.finalTaxLiability
      }
    });
  } catch (err) {
    console.error('Error in getRecommendations:', err);
    res.status(
      err.message.includes('exceed') || err.message.includes('required') || err.message.includes('negative') || err.message.includes('invalid') || err.message.includes('Invalid') ? 400 : 500
    ).json({
      status: 'error',
      message: err.message || 'Server error generating recommendations'
    });
  }
};

// 4. POST /tax/scenario
exports.simulateScenario = async (req, res) => {
  try {
    validateTaxInputs(req.body);

    const baseCalc = performCalculation(req.body);

    // Extract scenario investments
    const sc = req.body.scenario || {};
    const addELSS = Number(sc.elss || 0);
    const addNPS = Number(sc.nps || 0);
    const addHealth = Number(sc.healthInsurance || 0);
    const addHomeLoan = Number(sc.homeLoanInterest || 0);

    const baseDecs = req.body.deductions || {};

    // Validate scenario values are non-negative
    if (addELSS < 0 || addNPS < 0 || addHealth < 0 || addHomeLoan < 0) {
      return res.status(400).json({ status: 'error', message: 'Scenario investments cannot be negative' });
    }

    // Build simulated deductions
    const simDeductions = {
      ...baseDecs,
      elss: Number(baseDecs.elss || 0) + addELSS,
      nps: Number(baseDecs.nps || 0) + addNPS,
      healthInsurance: Number(baseDecs.healthInsurance || 0) + addHealth,
      homeLoanInterest: Number(baseDecs.homeLoanInterest || 0) + addHomeLoan
    };

    const simBody = {
      ...req.body,
      deductions: simDeductions
    };

    // Validate limits on simulated deductions as well
    try {
      validateTaxInputs(simBody);
    } catch (valErr) {
      return res.status(400).json({
        status: 'error',
        message: `Simulated scenario is invalid: ${valErr.message}`
      });
    }

    const simCalc = performCalculation(simBody);

    const taxSaved = Math.max(0, baseCalc.finalTaxLiability - simCalc.finalTaxLiability);
    const totalInvestment = addELSS + addNPS + addHealth + addHomeLoan;
    const roi = totalInvestment > 0 ? (taxSaved / totalInvestment) * 100 : 0;

    res.json({
      status: 'success',
      data: {
        currentTax: baseCalc.finalTaxLiability,
        newTax: simCalc.finalTaxLiability,
        taxSaved,
        roi: roundToTwo(roi),
        difference: {
          taxableIncomeDiff: baseCalc.taxableIncome - simCalc.taxableIncome,
          taxLiabilityDiff: baseCalc.finalTaxLiability - simCalc.finalTaxLiability,
          deductionsDiff: simCalc.deductionsBreakdown.totalApplied - baseCalc.deductionsBreakdown.totalApplied
        }
      }
    });
  } catch (err) {
    console.error('Error in simulateScenario:', err);
    res.status(
      err.message.includes('exceed') || err.message.includes('required') || err.message.includes('negative') || err.message.includes('invalid') || err.message.includes('Invalid') ? 400 : 500
    ).json({
      status: 'error',
      message: err.message || 'Server error simulating scenario'
    });
  }
};

// 5. GET /tax/history
exports.getHistory = async (req, res) => {
  try {
    const history = await TaxCalculation.find({ userId: req.user })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      status: 'success',
      data: history
    });
  } catch (err) {
    console.error('Error in getHistory:', err);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving tax calculation history'
    });
  }
};

// 6. GET /tax/export/:id (PDF Report generator)
exports.exportPDFReport = async (req, res) => {
  try {
    const record = await TaxCalculation.findOne({ _id: req.params.id, userId: req.user });
    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Calculation record not found' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Finmate_TaxReport_${record._id}.pdf`);

    doc.pipe(res);

    // Color Palette
    const primaryColor = '#1e1b4b'; // Deep Indigo
    const secondaryColor = '#4f46e5'; // Indigo
    const textColor = '#1f2937'; // Dark Gray
    const lightBg = '#f9fafb'; // Light Gray

    // Top Indigo Banner
    doc.rect(0, 0, 612, 100).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('Finmate AI - Tax Optimizer 3.0', 50, 30);
    doc.fontSize(10).font('Helvetica').text('Official Indian Tax Rules Compliant Report', 50, 60);

    // Report Details
    doc.fillColor(textColor).fontSize(12).font('Helvetica-Bold').text('Tax Assessment Details', 50, 130);
    doc.fontSize(9).font('Helvetica')
       .text(`Financial Year: ${record.financialYear}`, 50, 150)
       .text(`Age: ${record.age}`, 50, 165)
       .text(`Residential Status: ${record.residentialStatus}`, 50, 180)
       .text(`Tax Regime: ${record.regime.toUpperCase()} Regime`, 300, 150)
       .text(`Calculation ID: ${record._id}`, 300, 165)
       .text(`Date Generated: ${new Date(record.timestamp).toLocaleString()}`, 300, 180);

    // Horizontal Rule
    doc.moveTo(50, 205).lineTo(562, 205).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Income Summary Block
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Income & Taxable Base Summary', 50, 220);
    doc.fontSize(9).font('Helvetica')
       .text(`• Annual Salary CTC:`, 50, 240)
       .text(`₹${(record.income.annualSalary || 0).toLocaleString()}`, 250, 240, { align: 'right', width: 80 })
       .text(`• Business Income:`, 50, 252)
       .text(`₹${(record.income.businessIncome || 0).toLocaleString()}`, 250, 252, { align: 'right', width: 80 })
       .text(`• Rental Income:`, 50, 264)
       .text(`₹${(record.income.rentalIncome || 0).toLocaleString()}`, 250, 264, { align: 'right', width: 80 })
       .text(`• Capital Gains:`, 50, 276)
       .text(`₹${(record.income.capitalGains || 0).toLocaleString()}`, 250, 276, { align: 'right', width: 80 })
       .text(`• Interest Income:`, 50, 288)
       .text(`₹${(record.income.interestIncome || 0).toLocaleString()}`, 250, 288, { align: 'right', width: 80 })
       .text(`• Dividend Income:`, 50, 300)
       .text(`₹${(record.income.dividendIncome || 0).toLocaleString()}`, 250, 300, { align: 'right', width: 80 })
       .text(`• Other Sources Income:`, 50, 312)
       .text(`₹${(record.income.otherIncome || 0).toLocaleString()}`, 250, 312, { align: 'right', width: 80 });

    doc.rect(380, 235, 182, 90).fill(lightBg);
    doc.fillColor(textColor).font('Helvetica-Bold')
       .text('GROSS INCOME', 390, 245)
       .fontSize(12).text(`₹${record.income.grossIncome.toLocaleString()}`, 390, 260)
       .fontSize(9).text('TAXABLE INCOME', 390, 285)
       .fontSize(12).fillColor(secondaryColor).text(`₹${record.income.taxableIncome.toLocaleString()}`, 390, 300);

    // Horizontal Rule
    doc.moveTo(50, 340).lineTo(562, 340).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Deductions Section
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Deductions Engine Claims Verification', 50, 355);
    
    // Draw Deductions Table
    let tableY = 375;
    doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold')
       .text('Deduction Category', 50, tableY)
       .text('Claimed (₹)', 240, tableY, { width: 70, align: 'right' })
       .text('Max Limit (₹)', 320, tableY, { width: 70, align: 'right' })
       .text('Applied (₹)', 400, tableY, { width: 70, align: 'right' })
       .text('Unused (₹)', 480, tableY, { width: 80, align: 'right' });

    doc.moveTo(50, tableY + 12).lineTo(562, tableY + 12).strokeColor('#94a3b8').lineWidth(0.5).stroke();
    
    tableY += 18;
    doc.font('Helvetica').fontSize(8);
    record.deductions.forEach((d) => {
      const maxText = d.maxAllowed === null || d.maxAllowed === Infinity || d.maxAllowed > 10000000 ? 'Unlimited' : `₹${d.maxAllowed.toLocaleString()}`;
      doc.text(d.name, 50, tableY, { width: 180 })
         .text(`₹${(d.claimedAmount || 0).toLocaleString()}`, 240, tableY, { width: 70, align: 'right' })
         .text(maxText, 320, tableY, { width: 70, align: 'right' })
         .text(`₹${(d.appliedAmount || 0).toLocaleString()}`, 400, tableY, { width: 70, align: 'right' })
         .text(`₹${(d.unusedBenefit || 0).toLocaleString()}`, 480, tableY, { width: 80, align: 'right' });
      tableY += 15;
    });

    // Horizontal Rule
    doc.moveTo(50, tableY + 5).lineTo(562, tableY + 5).strokeColor('#e5e7eb').lineWidth(1).stroke();
    tableY += 20;

    // Check if space remains on page, else add page
    if (tableY > 580) {
      doc.addPage();
      tableY = 50;
    }

    // Progressive Slab Details & Tax Liability
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Progressive Tax Slab Calculation Breakdown', 50, tableY);
    tableY += 20;

    doc.fillColor(textColor).fontSize(8).font('Helvetica-Bold')
       .text('Tax Slab Bracket', 50, tableY)
       .text('Slab Rate (%)', 250, tableY, { width: 80, align: 'right' })
       .text('Income in Slab (₹)', 340, tableY, { width: 100, align: 'right' })
       .text('Tax Charged (₹)', 450, tableY, { width: 110, align: 'right' });

    doc.moveTo(50, tableY + 12).lineTo(562, tableY + 12).strokeColor('#94a3b8').lineWidth(0.5).stroke();
    tableY += 18;

    doc.font('Helvetica').fontSize(8);
    record.tax.slabBreakdown.forEach((s) => {
      doc.text(s.slab, 50, tableY, { width: 190 })
         .text(`${s.rate}%`, 250, tableY, { width: 80, align: 'right' })
         .text(`₹${s.incomeInSlab.toLocaleString()}`, 340, tableY, { width: 100, align: 'right' })
         .text(`₹${s.taxForSlab.toLocaleString()}`, 450, tableY, { width: 110, align: 'right' });
      tableY += 15;
    });

    doc.moveTo(50, tableY + 5).lineTo(562, tableY + 5).strokeColor('#e5e7eb').lineWidth(1).stroke();
    tableY += 20;

    // Final Calculations Summary Block
    doc.fontSize(9).font('Helvetica-Bold').text('Final Tax Liability Summary', 50, tableY);
    tableY += 15;
    doc.fontSize(8).font('Helvetica')
       .text(`Base Tax Charged on Slabs:`, 50, tableY).font('Helvetica-Bold').text(`₹${record.tax.totalTax.toLocaleString()}`, 180, tableY, { align: 'right', width: 80 }).font('Helvetica')
       .text(`Less: Section 87A Rebate:`, 50, tableY + 12).font('Helvetica-Bold').text(`- ₹${(record.tax.rebateApplied || 0).toLocaleString()}`, 180, tableY + 12, { align: 'right', width: 80 }).font('Helvetica')
       .text(`Add: Surcharge Payable:`, 50, tableY + 24).font('Helvetica-Bold').text(`₹${(record.tax.surcharge || 0).toLocaleString()}`, 180, tableY + 24, { align: 'right', width: 80 }).font('Helvetica')
       .text(`(Marginal Relief: ₹${(record.tax.marginalRelief || 0).toLocaleString()})`, 50, tableY + 36)
       .text(`Health & Education Cess (4%):`, 50, tableY + 48).font('Helvetica-Bold').text(`₹${record.tax.cess.toLocaleString()}`, 180, tableY + 48, { align: 'right', width: 80 }).font('Helvetica')
       .text(`Final Net Tax Liability:`, 50, tableY + 60).font('Helvetica-Bold').fillColor(secondaryColor).text(`₹${record.tax.finalTaxLiability.toLocaleString()}`, 180, tableY + 60, { align: 'right', width: 80 }).fillColor(textColor)
       
       .text(`TDS / Prepaid Taxes Paid:`, 300, tableY).font('Helvetica-Bold').text(`₹${(record.tax.taxPayable + record.tax.taxRefund - record.tax.finalTaxLiability > 0 ? 0 : (record.tax.finalTaxLiability + record.tax.taxRefund - record.tax.taxPayable)).toLocaleString()}`, 480, tableY, { align: 'right', width: 80 }).font('Helvetica')
       .text(`Average Tax Rate:`, 300, tableY + 12).font('Helvetica-Bold').text(`${record.tax.averageTaxRate || 0}%`, 480, tableY + 12, { align: 'right', width: 80 }).font('Helvetica')
       .text(`Effective Tax Rate:`, 300, tableY + 24).font('Helvetica-Bold').text(`${record.tax.effectiveTaxRate || 0}%`, 480, tableY + 24, { align: 'right', width: 80 }).font('Helvetica')
       .text(`Marginal Tax Rate:`, 300, tableY + 36).font('Helvetica-Bold').text(`${record.tax.marginalTaxRate || 0}%`, 480, tableY + 36, { align: 'right', width: 80 }).font('Helvetica');

    if (record.tax.taxRefund > 0) {
      doc.text(`Tax Refund Due:`, 300, tableY + 48).font('Helvetica-Bold').fillColor('#10b981').text(`₹${record.tax.taxRefund.toLocaleString()}`, 480, tableY + 48, { align: 'right', width: 80 }).fillColor(textColor);
    } else {
      doc.text(`Final Tax Payable:`, 300, tableY + 48).font('Helvetica-Bold').fillColor('#ef4444').text(`₹${record.tax.taxPayable.toLocaleString()}`, 480, tableY + 48, { align: 'right', width: 80 }).fillColor(textColor);
    }

    tableY += 85;

    // Check if space remains on page, else add page
    if (tableY > 580) {
      doc.addPage();
      tableY = 50;
    }

    // AI Generated Advisory Recommendations
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('AI Generated Advisory Recommendations', 50, tableY);
    tableY += 20;

    record.recommendations.forEach((r, index) => {
      const roiText = r.expectedROI > 0 ? ` | Expected ROI: ${r.expectedROI}%` : '';
      const dlText = r.deadline ? ` | Deadline: ${r.deadline}` : '';
      doc.fontSize(9).font('Helvetica-Bold').fillColor(secondaryColor).text(`${index + 1}. ${r.recommendation} (Priority: ${r.priority}${roiText}${dlText})`, 50, tableY);
      tableY += 12;
      doc.font('Helvetica').fontSize(8.5).fillColor(textColor).text(r.reason, 60, tableY, { width: 500 });
      tableY += doc.heightOfString(r.reason, { width: 500 }) + 10;
    });

    // Page Footer
    doc.moveTo(50, 720).lineTo(562, 720).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#64748b')
       .text('Disclaimer: This report is generated based on information provided by the user. Finmate AI provides general estimates and is not a registered tax adviser. Please consult a qualified CA for official tax filings.', 50, 735, { align: 'center', width: 512 });

    doc.end();
  } catch (err) {
    console.error('Error exporting PDF:', err);
    res.status(500).json({ status: 'error', message: 'Server error generating PDF report' });
  }
};

// DELETE /tax/history/:id
exports.deleteHistory = async (req, res) => {
  try {
    const record = await TaxCalculation.findOneAndDelete({ _id: req.params.id, userId: req.user });
    if (!record) {
      return res.status(404).json({ status: 'error', message: 'Calculation record not found' });
    }
    res.json({
      status: 'success',
      message: 'Calculation history record deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteHistory:', err);
    res.status(500).json({ status: 'error', message: 'Server error deleting history record' });
  }
};

// Simple round helper
function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
