const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

exports.recommendStocks = async (req, res) => {
  try {
    const { riskProfile, investmentAmount, investmentHorizon } = req.body;

    if (!riskProfile) {
      return res.status(400).json({ status: 'error', message: 'Risk profile is required' });
    }

    const validProfiles = ['Conservative', 'Moderate', 'Aggressive'];
    if (!validProfiles.includes(riskProfile)) {
      return res.status(400).json({ status: 'error', message: 'Invalid risk profile. Must be Conservative, Moderate, or Aggressive.' });
    }

    // Call Python FastAPI Recommender with Gemini API Key
    const response = await fetch(`${AI_SERVICE_URL}/recommend-stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': process.env.GEMINI_API_KEY || '',
      },
      body: JSON.stringify({
        risk_profile: riskProfile,
        investment_amount: investmentAmount ? parseFloat(investmentAmount) : null,
        investment_horizon: investmentHorizon || null,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ status: 'error', message: `AI Service Error: ${errText}` });
    }

    const result = await response.json();
    res.json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error during stock recommendation' });
  }
};
