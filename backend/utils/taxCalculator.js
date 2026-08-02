const fs = require('fs');
const path = require('path');

// Load tax rules config
let taxRules = {};
try {
  const configPath = path.join(__dirname, '../config/taxRules.json');
  taxRules = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error('Failed to load tax rules configuration, using hardcoded fallback', err);
}

/**
 * Normalizes the financial year key (removes spaces) and returns matching rules
 */
function getRules(fy) {
  const key = String(fy || 'FY2024-25').replace(/\s+/g, '');
  return taxRules[key] || taxRules['FY2024-25'];
}

/**
 * Calculates Gross Income
 */
function calculateGrossIncome({
  annualSalary = 0,
  businessIncome = 0,
  rentalIncome = 0,
  capitalGains = 0,
  otherIncome = 0,
  interestIncome = 0,
  dividendIncome = 0
}) {
  return (
    Number(annualSalary || 0) +
    Number(businessIncome || 0) +
    Number(rentalIncome || 0) +
    Number(capitalGains || 0) +
    Number(otherIncome || 0) +
    Number(interestIncome || 0) +
    Number(dividendIncome || 0)
  );
}

/**
 * Calculates HRA Exemption under Section 10(13A)
 */
function calculateHRAExemption(hraReceived, rentPaid, basicSalary) {
  hraReceived = Number(hraReceived || 0);
  rentPaid = Number(rentPaid || 0);
  basicSalary = Number(basicSalary || 0);

  if (hraReceived <= 0 || rentPaid <= 0 || basicSalary <= 0) {
    return 0;
  }

  const opt1 = hraReceived;
  const opt2 = Math.max(rentPaid - 0.10 * basicSalary, 0);
  const opt3 = 0.50 * basicSalary; // Metro rate fallback (50%)

  return Math.min(opt1, opt2, opt3);
}

/**
 * Calculates Section 80GG Rent Deduction
 */
function calculateSection80GG(rentPaid, adjustedIncome) {
  rentPaid = Number(rentPaid || 0);
  adjustedIncome = Number(adjustedIncome || 0);

  if (rentPaid <= 0 || adjustedIncome <= 0) {
    return 0;
  }

  const opt1 = 5000 * 12; // ₹60,000 per year limit
  const opt2 = 0.25 * adjustedIncome;
  const opt3 = Math.max(rentPaid - 0.10 * adjustedIncome, 0);

  return Math.min(opt1, opt2, opt3);
}

/**
 * Core deductions engine validating limits
 */
function calculateDeductions({
  annualSalary = 0,
  basicSalary = 0,
  rentPaid = 0,
  hraReceived = 0,
  deductions = {},
  regime = 'new',
  fy = 'FY 2024-25',
  age = 30
}) {
  const rules = getRules(fy);
  const results = {
    standardDeduction: { claimed: 0, allowed: 0, unused: 0 },
    sec80C: { claimed: 0, allowed: 0, unused: 0 },
    sec80D: { claimed: 0, allowed: 0, unused: 0 },
    sec80CCD_1B: { claimed: 0, allowed: 0, unused: 0 },
    sec80CCD_2: { claimed: 0, allowed: 0, unused: 0 }, // Employer NPS
    sec24B: { claimed: 0, allowed: 0, unused: 0 },
    sec80E: { claimed: 0, allowed: 0, unused: 0 },
    sec80G: { claimed: 0, allowed: 0, unused: 0 },
    professionalTax: { claimed: 0, allowed: 0, unused: 0 },
    lta: { claimed: 0, allowed: 0, unused: 0 },
    rentDeduction: { claimed: 0, allowed: 0, unused: 0 },
    totalApplied: 0
  };

  // 1. Standard Deduction (salaried)
  if (annualSalary > 0 && rules.standard_deduction?.salaried) {
    const stdLimit = rules.standard_deduction.salaried[regime] || 0;
    results.standardDeduction.claimed = stdLimit;
    results.standardDeduction.allowed = Math.min(annualSalary, stdLimit);
    results.standardDeduction.unused = Math.max(0, stdLimit - results.standardDeduction.allowed);
  }

  // 2. Section 80CCD(2) - Employer NPS (Allowed under BOTH regimes)
  const employerNps = Number(deductions.employerNps || 0);
  if (employerNps > 0 && basicSalary > 0) {
    const cleanFy = String(fy).replace(/\s+/g, '');
    let empNpsRate = 0.10; // Old regime default
    if (regime === 'new' && (cleanFy === 'FY2024-25' || cleanFy === 'FY2025-26')) {
      empNpsRate = 0.14; // New regime has 14% cap starting FY 24-25
    }
    const maxEmpNps = basicSalary * empNpsRate;
    results.sec80CCD_2.claimed = employerNps;
    results.sec80CCD_2.allowed = Math.min(employerNps, maxEmpNps);
    results.sec80CCD_2.unused = Math.max(0, maxEmpNps - employerNps);
  }

  // --- OLD REGIME DEDUCTIONS ---

  // 3. Section 80C (PPF, ELSS, EPF, Life Insurance, FD, NSC, other 80C)
  const ppf = Number(deductions.ppf || 0);
  const elss = Number(deductions.elss || 0);
  const epf = Number(deductions.epf || 0);
  const lifeInsurance = Number(deductions.lifeInsurance || 0);
  const taxSavingFD = Number(deductions.taxSavingFD || 0);
  const nsc = Number(deductions.nsc || 0);
  const other80C = Number(deductions.other80C || 0);
  const claimed80C = ppf + elss + epf + lifeInsurance + taxSavingFD + nsc + other80C;
  const limit80C = rules.deductions?.sec_80C?.max_limit || 150000;

  results.sec80C.claimed = claimed80C;
  results.sec80C.allowed = Math.min(claimed80C, limit80C);
  results.sec80C.unused = Math.max(0, limit80C - claimed80C);

  // 4. Section 80D (Health Insurance)
  const healthInsurance = Number(deductions.healthInsurance || 0);
  const other80D = Number(deductions.other80D || 0);
  const claimed80D = healthInsurance + other80D;
  const limit80D = age >= 60 ? (rules.deductions?.sec_80D?.senior || 50000) : (rules.deductions?.sec_80D?.default || 25000);

  results.sec80D.claimed = claimed80D;
  results.sec80D.allowed = Math.min(claimed80D, limit80D);
  results.sec80D.unused = Math.max(0, limit80D - claimed80D);

  // 5. Section 80CCD(1B) (Individual NPS)
  const nps = Number(deductions.nps || 0);
  const limitNps = rules.deductions?.sec_80CCD_1B?.max_limit || 50000;

  results.sec80CCD_1B.claimed = nps;
  results.sec80CCD_1B.allowed = Math.min(nps, limitNps);
  results.sec80CCD_1B.unused = Math.max(0, limitNps - nps);

  // 6. Section 24(b) (Home Loan Interest)
  const homeLoanInterest = Number(deductions.homeLoanInterest || 0);
  const limit24B = rules.deductions?.sec_24B?.max_limit || 200000;

  results.sec24B.claimed = homeLoanInterest;
  results.sec24B.allowed = Math.min(homeLoanInterest, limit24B);
  results.sec24B.unused = Math.max(0, limit24B - homeLoanInterest);

  // 7. Section 80E (Education Loan Interest)
  const educationLoanInterest = Number(deductions.educationLoanInterest || 0);
  results.sec80E.claimed = educationLoanInterest;
  results.sec80E.allowed = educationLoanInterest;
  results.sec80E.unused = 0;

  // 8. Section 80G (Donations)
  const donations = Number(deductions.donations || 0);
  results.sec80G.claimed = donations;
  results.sec80G.allowed = donations;
  results.sec80G.unused = 0;

  // 9. Professional Tax (Section 16(iii))
  const professionalTax = Number(deductions.professionalTax || 0);
  const limitPT = 2500;
  results.professionalTax.claimed = professionalTax;
  results.professionalTax.allowed = Math.min(professionalTax, limitPT);
  results.professionalTax.unused = Math.max(0, limitPT - professionalTax);

  // 10. LTA (Section 10(5))
  const lta = Number(deductions.lta || 0);
  results.lta.claimed = lta;
  results.lta.allowed = lta;
  results.lta.unused = 0;

  // 11. HRA or Section 80GG rent deductions
  const grossIncome = calculateGrossIncome({
    annualSalary,
    businessIncome: deductions.businessIncome || 0,
    rentalIncome: deductions.rentalIncome || 0,
    capitalGains: deductions.capitalGains || 0,
    otherIncome: deductions.otherIncome || 0,
    interestIncome: deductions.interestIncome || 0,
    dividendIncome: deductions.dividendIncome || 0
  });

  if (hraReceived > 0 && basicSalary > 0) {
    const allowedHRA = calculateHRAExemption(hraReceived, rentPaid, basicSalary);
    results.rentDeduction.claimed = hraReceived;
    results.rentDeduction.allowed = allowedHRA;
    results.rentDeduction.unused = Math.max(0, hraReceived - allowedHRA);
  } else if (rentPaid > 0) {
    // Adjusted total income is gross minus (80C + 80D + 80CCD + Home Loan + Education Loan + Professional Tax + LTA + Employer NPS)
    const totalDeductionsSoFar =
      results.sec80C.allowed +
      results.sec80D.allowed +
      results.sec80CCD_1B.allowed +
      results.sec80CCD_2.allowed +
      results.sec24B.allowed +
      results.sec80E.allowed +
      results.sec80G.allowed +
      results.professionalTax.allowed +
      results.lta.allowed;
    const adjustedIncome = Math.max(grossIncome - totalDeductionsSoFar, 0);
    const allowed80GG = calculateSection80GG(rentPaid, adjustedIncome);
    results.rentDeduction.claimed = rentPaid;
    results.rentDeduction.allowed = allowed80GG;
    results.rentDeduction.unused = 0;
  }

  // Sum total applied deductions
  results.totalApplied =
    results.standardDeduction.allowed +
    results.sec80C.allowed +
    results.sec80D.allowed +
    results.sec80CCD_1B.allowed +
    results.sec80CCD_2.allowed +
    results.sec24B.allowed +
    results.sec80E.allowed +
    results.sec80G.allowed +
    results.professionalTax.allowed +
    results.lta.allowed +
    results.rentDeduction.allowed;

  if (regime === 'new') {
    const blockedKeys = [
      'sec80C', 'sec80D', 'sec80CCD_1B', 'sec24B',
      'sec80E', 'sec80G', 'professionalTax', 'lta', 'rentDeduction'
    ];
    for (const key of blockedKeys) {
      results[key].allowed = 0;
      results[key].unused = 0;
    }
    results.totalApplied = results.standardDeduction.allowed + results.sec80CCD_2.allowed;
  }

  return results;
}

/**
 * Calculates Taxable Income
 */
function calculateTaxableIncome(grossIncome, deductionsBreakdown) {
  const taxable = grossIncome - (deductionsBreakdown?.totalApplied || 0);
  return Math.max(0, taxable);
}

/**
 * Reusable progressive slab builder
 */
function calculateBaseSlabTax(taxableIncome, regime, fy, age = 30) {
  const rules = getRules(fy);
  let slabs = [];

  if (regime === 'old') {
    let ageGroup = 'general';
    if (age >= 80) ageGroup = 'super_senior';
    else if (age >= 60) ageGroup = 'senior';
    slabs = rules.slabs?.old[ageGroup] || rules.slabs?.old['general'];
  } else {
    slabs = rules.slabs?.new['general'];
  }

  let totalTax = 0;
  const breakdown = [];

  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];
    const slabMin = slab.min;
    const slabMax = slab.max === -1 ? Infinity : slab.max;
    const rate = slab.rate;

    if (taxableIncome <= slabMin) {
      breakdown.push({
        slab: `${slabMin.toLocaleString()} - ${slab.max === -1 ? 'Above' : slab.max.toLocaleString()}`,
        rate: rate * 100,
        incomeInSlab: 0,
        taxForSlab: 0
      });
      continue;
    }

    const incomeInSlab = Math.min(taxableIncome, slabMax) - slabMin;
    const taxForSlab = incomeInSlab * rate;
    totalTax += taxForSlab;

    breakdown.push({
      slab: `${slabMin.toLocaleString()} - ${slab.max === -1 ? 'Above' : slab.max.toLocaleString()}`,
      rate: rate * 100,
      incomeInSlab,
      taxForSlab
    });
  }

  return { totalTax, breakdown };
}

/**
 * Calculates Rebate under Section 87A supporting Marginal Relief for New Regime
 */
function calculateRebate(taxableIncome, taxBeforeRebate, regime, fy) {
  const rules = getRules(fy);
  const rebateRule = rules.rebate_87A?.[regime];
  if (!rebateRule) return 0;

  if (taxableIncome <= rebateRule.income_limit) {
    return Math.min(taxBeforeRebate, rebateRule.max_rebate);
  }

  // Section 87A Marginal Relief applies only in New Regime (thresholds: 7L in FY23-24/24-25, 12L in FY25-26)
  if (regime === 'new') {
    const excessIncome = taxableIncome - rebateRule.income_limit;
    if (taxBeforeRebate > excessIncome) {
      const taxWithRelief = excessIncome;
      return Math.max(0, taxBeforeRebate - taxWithRelief);
    }
  }

  return 0;
}

/**
 * Calculates high income surcharges and surcharge marginal relief
 */
function calculateSurcharge(taxAfterRebate, taxableIncome, regime, fy) {
  const rules = getRules(fy);
  const surchargeRules = rules.surcharge?.[regime] || [];

  let rate = 0;
  let threshold = 0;

  // Find highest applicable surcharge bracket
  for (let i = surchargeRules.length - 1; i >= 0; i--) {
    if (taxableIncome > surchargeRules[i].limit) {
      rate = surchargeRules[i].rate;
      threshold = surchargeRules[i].limit;
      break;
    }
  }

  if (rate === 0) {
    return { surcharge: 0, marginalRelief: 0, rate: 0 };
  }

  const rawSurcharge = taxAfterRebate * rate;
  const rawTaxWithSurcharge = taxAfterRebate + rawSurcharge;

  // Marginal Relief calculations
  let prevSurchargeRate = 0;
  for (let i = surchargeRules.length - 1; i >= 0; i--) {
    if (surchargeRules[i].limit < threshold) {
      prevSurchargeRate = surchargeRules[i].rate;
      break;
    }
  }

  // Compute tax on threshold limit
  const baseSlabOnThreshold = calculateBaseSlabTax(threshold, regime, fy);
  const rebateOnThreshold = calculateRebate(threshold, baseSlabOnThreshold.totalTax, regime, fy);
  const taxAfterRebateOnThreshold = Math.max(0, baseSlabOnThreshold.totalTax - rebateOnThreshold);
  const surchargeOnThreshold = taxAfterRebateOnThreshold * prevSurchargeRate;
  
  const taxOnThresholdWithSurcharge = taxAfterRebateOnThreshold + surchargeOnThreshold;
  const maxTaxWithSurcharge = taxOnThresholdWithSurcharge + (taxableIncome - threshold);

  let finalTaxWithSurcharge = rawTaxWithSurcharge;
  let marginalRelief = 0;

  if (rawTaxWithSurcharge > maxTaxWithSurcharge) {
    finalTaxWithSurcharge = maxTaxWithSurcharge;
    marginalRelief = rawTaxWithSurcharge - maxTaxWithSurcharge;
  }

  const finalSurcharge = finalTaxWithSurcharge - taxAfterRebate;

  return {
    surcharge: Math.max(0, finalSurcharge),
    marginalRelief: Math.max(0, marginalRelief),
    rate: rate * 100
  };
}

/**
 * Calculates Cess
 */
function calculateCess(taxAfterRebateAndSurcharge, fy = 'FY 2024-25') {
  const rules = getRules(fy);
  const rate = rules.cess_rate || 0.04;
  return taxAfterRebateAndSurcharge * rate;
}

/**
 * Calculates Net Tax
 */
function calculateNetTax(taxAfterRebateAndSurcharge, cess) {
  return taxAfterRebateAndSurcharge + cess;
}

/**
 * Calculates Tax Rates (Average, Effective, Marginal)
 */
function calculateRates(grossIncome, taxableIncome, finalTaxLiability, slabsBreakdown) {
  const averageTaxRate = taxableIncome > 0 ? (finalTaxLiability / taxableIncome) * 100 : 0;
  const effectiveTaxRate = grossIncome > 0 ? (finalTaxLiability / grossIncome) * 100 : 0;

  // Find marginal rate (rate of highest slab where income > 0)
  let marginalTaxRate = 0;
  if (slabsBreakdown && slabsBreakdown.length > 0) {
    for (let i = slabsBreakdown.length - 1; i >= 0; i--) {
      if (slabsBreakdown[i].incomeInSlab > 0) {
        marginalTaxRate = slabsBreakdown[i].rate;
        break;
      }
    }
  }

  return {
    averageTaxRate: Number(averageTaxRate.toFixed(2)),
    effectiveTaxRate: Number(effectiveTaxRate.toFixed(2)),
    marginalTaxRate: Number(marginalTaxRate.toFixed(2))
  };
}

module.exports = {
  getRules,
  calculateGrossIncome,
  calculateHRAExemption,
  calculateSection80GG,
  calculateDeductions,
  calculateTaxableIncome,
  calculateBaseSlabTax,
  calculateRebate,
  calculateSurcharge,
  calculateCess,
  calculateNetTax,
  calculateRates,
  taxRules
};
