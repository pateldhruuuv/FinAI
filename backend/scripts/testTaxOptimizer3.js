const taxCalculator = require('../utils/taxCalculator');
const assert = require('assert');

console.log('=== STARTING UNIT TESTS FOR TAX OPTIMIZER 3.0 ENGINE ===\n');

// Helper to format currency
const f = v => `₹${Number(v || 0).toLocaleString('en-IN')}`;

// Case 1: Low Income (Salaried, FY 2024-25, New Regime, ₹3,00,000 salary)
console.log('Test Case 1: Low Income (Salaried ₹3L, FY 24-25, New Regime)');
const dec1 = taxCalculator.calculateDeductions({
  annualSalary: 300000,
  regime: 'new',
  fy: 'FY 2024-25'
});
const taxable1 = taxCalculator.calculateTaxableIncome(300000, dec1);
const slabTax1 = taxCalculator.calculateBaseSlabTax(taxable1, 'new', 'FY 2024-25');
const rebate1 = taxCalculator.calculateRebate(taxable1, slabTax1.totalTax, 'new', 'FY 2024-25');
const taxAfterRebate1 = slabTax1.totalTax - rebate1;
const cess1 = taxCalculator.calculateCess(taxAfterRebate1, 'FY 2024-25');
const net1 = taxCalculator.calculateNetTax(taxAfterRebate1, cess1);

console.log(`   - Standard Deduction Allowed: ${f(dec1.standardDeduction.allowed)}`);
console.log(`   - Taxable Income: ${f(taxable1)}`);
console.log(`   - Slab Tax: ${f(slabTax1.totalTax)}`);
console.log(`   - Section 87A Rebate: ${f(rebate1)}`);
console.log(`   - Final Net Tax: ${f(net1)}`);
assert.strictEqual(net1, 0, 'Low income should have 0 tax liability');
console.log('✅ Passed.\n');

// Case 2: Middle Income (Salaried ₹7.8L, FY 2024-25, New Regime - checking 87A Marginal Relief)
console.log('Test Case 2: 87A Marginal Relief (Salaried ₹7.8L, FY 24-25, New Regime)');
const salary2 = 780000;
const dec2 = taxCalculator.calculateDeductions({
  annualSalary: salary2,
  regime: 'new',
  fy: 'FY 2024-25'
});
const taxable2 = taxCalculator.calculateTaxableIncome(salary2, dec2); // 7,80,000 - 75,000 = 7,05,000
const slabTax2 = taxCalculator.calculateBaseSlabTax(taxable2, 'new', 'FY 2024-25'); // Tax on 7,05,000 is 20,500
const rebate2 = taxCalculator.calculateRebate(taxable2, slabTax2.totalTax, 'new', 'FY 2024-25'); // Marginal relief applies!
const taxAfterRebate2 = slabTax2.totalTax - rebate2; // Should be capped at excess (7,05,000 - 7,00,000 = 5,000)
const cess2 = taxCalculator.calculateCess(taxAfterRebate2, 'FY 2024-25'); // 4% of 5,000 = 200
const net2 = taxCalculator.calculateNetTax(taxAfterRebate2, cess2); // 5,200

console.log(`   - Taxable Income: ${f(taxable2)}`);
console.log(`   - Tax Before Rebate: ${f(slabTax2.totalTax)}`);
console.log(`   - Rebate (Marginal Relief): ${f(rebate2)}`);
console.log(`   - Tax After Rebate: ${f(taxAfterRebate2)} (Capped at excess income above ₹7L)`);
console.log(`   - Cess: ${f(cess2)}`);
console.log(`   - Final Net Tax: ${f(net2)}`);
assert.strictEqual(taxAfterRebate2, 5000, 'Tax after rebate must be capped at 5000 due to marginal relief');
assert.strictEqual(net2, 5200, 'Net tax must be 5200');
console.log('✅ Passed.\n');

// Case 3: Middle Income under FY 2025-26 (Salaried ₹12.8L, New Regime - checking new slabs and 87A rebate up to 12L)
console.log('Test Case 3: FY 2025-26 Rebate (Salaried ₹12.8L, New Regime)');
const salary3 = 1280000;
const dec3 = taxCalculator.calculateDeductions({
  annualSalary: salary3,
  regime: 'new',
  fy: 'FY 2025-26'
});
const taxable3 = taxCalculator.calculateTaxableIncome(salary3, dec3); // 12,80,000 - 75,000 = 12,05,000
const slabTax3 = taxCalculator.calculateBaseSlabTax(taxable3, 'new', 'FY 2025-26'); // tax on 12,05,000. Slabs: 0-4L Nil, 4-8L 5% (20k), 8-12L 10% (40k), 12-16L 15% (5k @ 15% = 750). Total 60,750
const rebate3 = taxCalculator.calculateRebate(taxable3, slabTax3.totalTax, 'new', 'FY 2025-26'); // Excess over 12L is 5,000. Rebate should be 60,750 - 5,000 = 55,750
const taxAfterRebate3 = slabTax3.totalTax - rebate3; // Should be capped at 5,000
const cess3 = taxCalculator.calculateCess(taxAfterRebate3, 'FY 2025-26');
const net3 = taxCalculator.calculateNetTax(taxAfterRebate3, cess3);

console.log(`   - Taxable Income: ${f(taxable3)}`);
console.log(`   - Slab Tax: ${f(slabTax3.totalTax)}`);
console.log(`   - Rebate (Marginal Relief): ${f(rebate3)}`);
console.log(`   - Tax after Rebate: ${f(taxAfterRebate3)} (Expected: ₹5,000)`);
console.log(`   - Final Net Tax: ${f(net3)} (Expected: ₹5,200)`);
assert.strictEqual(taxAfterRebate3, 5000, 'Tax after rebate must be capped at 5000 due to 12L marginal relief');
assert.strictEqual(net3, 5200, 'Net tax must be 5200');
console.log('✅ Passed.\n');

// Case 4: High Income with Surcharge & Surcharge Marginal Relief (Salaried ₹1.01 Crore, FY 2024-25, New Regime)
console.log('Test Case 4: Surcharge Marginal Relief (Salaried ₹1.01 Cr, FY 24-25, New Regime)');
const salary4 = 10100000;
const dec4 = taxCalculator.calculateDeductions({
  annualSalary: salary4,
  regime: 'new',
  fy: 'FY 2024-25'
});
const taxable4 = taxCalculator.calculateTaxableIncome(salary4, dec4); // 1,01,00,000 - 75,000 = 1,00,25,000
const slabTax4 = taxCalculator.calculateBaseSlabTax(taxable4, 'new', 'FY 2024-25'); // Tax on 1,00,25,000
const rebate4 = taxCalculator.calculateRebate(taxable4, slabTax4.totalTax, 'new', 'FY 2024-25');
const taxAfterRebate4 = slabTax4.totalTax - rebate4;
const surcharge4 = taxCalculator.calculateSurcharge(taxAfterRebate4, taxable4, 'new', 'FY 2024-25'); // Surcharge with marginal relief

console.log(`   - Taxable Income: ${f(taxable4)}`);
console.log(`   - Surcharge Rate applied: ${surcharge4.rate}%`);
console.log(`   - Raw Surcharge (no relief): ${f(taxAfterRebate4 * 0.15)}`);
console.log(`   - Applied Surcharge (with relief): ${f(surcharge4.surcharge)}`);
console.log(`   - Surcharge Marginal Relief: ${f(surcharge4.marginalRelief)}`);
console.log(`   - Surcharge rate is 15% because income exceeds 1 Crore.`);
assert.ok(surcharge4.marginalRelief > 0, 'Marginal relief must be calculated for income slightly above 1 Crore');
console.log('✅ Passed.\n');

// Case 5: Extremely High Income (₹6 Crore, FY 2024-25, Old Regime - checking 37% surcharge)
console.log('Test Case 5: Surcharge of 37% (Salaried ₹6 Cr, FY 24-25, Old Regime)');
const salary5 = 60000000;
const dec5 = taxCalculator.calculateDeductions({
  annualSalary: salary5,
  regime: 'old',
  fy: 'FY 2024-25'
});
const taxable5 = taxCalculator.calculateTaxableIncome(salary5, dec5);
const slabTax5 = taxCalculator.calculateBaseSlabTax(taxable5, 'old', 'FY 2024-25');
const surcharge5 = taxCalculator.calculateSurcharge(slabTax5.totalTax, taxable5, 'old', 'FY 2024-25');

console.log(`   - Taxable Income: ${f(taxable5)}`);
console.log(`   - Slab Tax: ${f(slabTax5.totalTax)}`);
console.log(`   - Surcharge Rate applied: ${surcharge5.rate}%`);
console.log(`   - Surcharge Amount: ${f(surcharge5.surcharge)}`);
assert.strictEqual(surcharge5.rate, 37, 'Surcharge rate must be 37% for Old Regime exceeding 5 Crore');
console.log('✅ Passed.\n');

console.log('=== ALL ENGINE UNIT TESTS PASSED SUCCESSFULLY! ===');
