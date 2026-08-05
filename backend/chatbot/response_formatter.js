const getSuggestionsByIntent = (intent) => {
  const suggestionsMap = {
    'Investment': [
      'Show my investment opportunities',
      'What is my optimal stock allocation?',
      'Check my investment risk profile'
    ],
    'Stock Recommendation': [
      'Show latest market trends',
      'Recommend blue-chip equities',
      'Review my portfolio allocations'
    ],
    'Insurance': [
      'Audit my insurance cover',
      'Calculate health insurance needs',
      'Compare term insurance vs life cover'
    ],
    'Loans': [
      'Calculate my safe EMI threshold',
      'Check home loan eligibility',
      'Assess my borrowing risk profile'
    ],
    'Tax': [
      'Optimize my Section 80C deductions',
      'Calculate my HRA rent exemption',
      'Optimize my taxable income'
    ],
    'Budget': [
      'Analyze my spending limits',
      'How do I improve my savings ratio?',
      'Create a monthly budget constraint'
    ],
    'Expense Analysis': [
      'Where did I spend the most?',
      'Show expense category breakdown',
      'Upload a new statement for analysis'
    ],
    'Financial Health': [
      'Improve my financial health score',
      'Analyze savings & debt ratios',
      'Recalculate my safety score'
    ],
    'Goal Planning': [
      'Create a new savings goal',
      'Track my active vacation targets',
      'Adjust my retirement age buffer'
    ],
    'Reports': [
      'Generate PDF financial report',
      'Download CSV expense log',
      'Export financial twin scenario telemetry'
    ],
    'Settings': [
      'Link a new bank ledger',
      'Review account consent status',
      'Verify active credentials'
    ],
    'Premium Features': [
      'Talk to my Financial Twin',
      'Unlock Premium Advisor',
      "What is included in Gold Ledger?"
    ],
    'General Platform Help': [
      'Show my financial health score',
      'Analyze my spending',
      'Improve my financial health'
    ]
  };

  return suggestionsMap[intent] || [
    'Show my financial health score',
    'Analyze my spending',
    'Improve my financial health'
  ];
};

const formatResponse = (rawReply, intent) => {
  let formatted = rawReply.trim();
  
  // Enforce word count limit
  const words = formatted.split(/\s+/);
  if (words.length > 300) {
    formatted = words.slice(0, 300).join(' ') + '...';
  }

  // Get 3 follow-up suggestions
  const suggestions = getSuggestionsByIntent(intent);

  return {
    content: formatted,
    suggestions
  };
};

module.exports = {
  formatResponse,
  getSuggestionsByIntent
};
