const detectIntent = (message) => {
  const query = (message || '').toLowerCase().trim();
  
  const rules = [
    {
      intent: 'Stock Recommendation',
      keywords: ['stock', 'share', 'equity', 'nifty', 'market trends', 'sebi', 'ticker', 'shares']
    },
    {
      intent: 'Investment',
      keywords: ['invest', 'portfolio', 'mutual fund', 'fixed deposit', 'fd', 'bond', 'allocation', 'assets', 'investment']
    },
    {
      intent: 'Insurance',
      keywords: ['insure', 'insurance', 'term plan', 'accidental cover', 'health cover', 'lic', 'claim', 'coverage']
    },
    {
      intent: 'Loans',
      keywords: ['loan', 'borrow', 'emi', 'debt', 'cibil', 'credit score', 'home loan', 'car loan', 'mortgage', 'interest rate']
    },
    {
      intent: 'Tax',
      keywords: ['tax', 'deduction', '80c', '80d', 'hra', 'rent', 'taxable income', 'itr', 'financial year', 'tax saving']
    },
    {
      intent: 'Budget',
      keywords: ['budget', 'cash flow', 'savings ratio', 'income vs expense', 'spending limit', 'save money']
    },
    {
      intent: 'Expense Analysis',
      keywords: ['expense', 'spend', 'category', 'particulars', 'ledger', 'merchant', 'shopping', 'analytics', 'categories']
    },
    {
      intent: 'Financial Health',
      keywords: ['health score', 'health status', 'financial score', 'score', 'telemetry', 'cockpit']
    },
    {
      intent: 'Goal Planning',
      keywords: ['goal', 'save for', 'vacation goal', 'target amount', 'retirement plan', 'goals']
    },
    {
      intent: 'Reports',
      keywords: ['pdf', 'csv', 'report', 'download data', 'export data', 'telemetry summary', 'download report']
    },
    {
      intent: 'Settings',
      keywords: ['link account', 'bank feed', 'credentials', 'consent', 'unlink', 'settings', 'profile picture', 'reset', 'password']
    },
    {
      intent: 'Premium Features',
      keywords: ['premium', 'upgrade', 'financial twin', 'twin scenario', 'pro membership', 'membership']
    },
    {
      intent: 'General Platform Help',
      keywords: ['help', 'menu', 'features', 'support', 'what can you do', 'chatbot list', 'hi', 'hello', 'hey', 'greetings']
    }
  ];

  let bestIntent = 'General Platform Help';
  let maxScore = 0.0;

  for (const rule of rules) {
    let matches = 0;
    for (const keyword of rule.keywords) {
      if (query.includes(keyword)) {
        matches++;
      }
    }
    
    if (matches > 0) {
      // Calculate a confidence score based on matches
      const score = Math.min(0.5 + (matches * 0.15), 1.0);
      if (score > maxScore) {
        maxScore = score;
        bestIntent = rule.intent;
      }
    }
  }

  // Fallback check: if there are no matches and the query asks standard general knowledge, flag low confidence
  if (maxScore === 0.0) {
    // Check if query is standard personal finance but phrased differently
    const financeTerms = ['money', 'bank', 'rupee', 'rs', 'cost', 'afford', 'buy', 'price', 'wallet', 'card', 'salary', 'income', 'savings'];
    const isFinanceRelated = financeTerms.some(term => query.includes(term));
    if (isFinanceRelated) {
      bestIntent = 'Budget';
      maxScore = 0.4;
    } else {
      bestIntent = 'General Platform Help';
      maxScore = 0.2; // Very low confidence -> likely out of scope
    }
  }

  return {
    intent: bestIntent,
    confidenceScore: maxScore
  };
};

module.exports = {
  detectIntent
};
