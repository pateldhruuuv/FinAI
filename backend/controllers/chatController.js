const Conversation = require('../models/Conversation');
const ChatHistory = require('../models/ChatHistory');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const { detectIntent } = require('../chatbot/intent_detector');
const { checkPermission } = require('../chatbot/permission_engine');
const { getFeatureByIntent } = require('../chatbot/knowledge_base');
const { buildContext } = require('../chatbot/context_builder');
const { buildSystemPrompt } = require('../chatbot/prompt_builder');
const { formatResponse } = require('../chatbot/response_formatter');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

// Helpers duplicated from aiController.js for identical behavior
const extractGeminiReply = (data) => {
  if (data?.output_text) return data.output_text;

  const modelOutput = data?.steps?.find((step) => step.type === 'model_output');
  const textPart = modelOutput?.content?.find((part) => part.type === 'text');
  return textPart?.text || 'Sorry, I could not generate a response right now.';
};

// Subroutine to generate response via Gemini or Local Advisor fallback
const generateAIResponse = async ({ userId, message, history }) => {
  const startTime = Date.now();
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // 1. Detect Intent
  const { intent, confidenceScore } = detectIntent(message);

  // 2. Fallback if Out of Scope
  if (intent === 'General Platform Help' && confidenceScore === 0.2) {
    return {
      reply: "I can assist only with financial planning and the features available within FinPilot AI.",
      suggestions: ['Show my financial health score', 'Analyze my spending', 'Improve my financial health'],
      modelUsed: 'Fallback',
      responseTime: Date.now() - startTime
    };
  }

  // 3. Check Permissions
  const feature = getFeatureByIntent(intent);
  const perm = checkPermission(user, feature);

  // 4. Build User Financial Context
  const context = await buildContext(userId);

  let advisorContext = "";
  // Only call advisory calculations if permission is allowed
  if (perm.allowed) {
    try {
      if (intent === 'Investment' || intent === 'Stock Recommendation') {
        const response = await fetch(`${AI_SERVICE_URL}/recommend-investment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            age: context.age || 30,
            income: context.income || 50000,
            savings: context.savings || 10000,
            risk_profile: context.riskProfile || 'Moderate',
          }),
        });
        if (response.ok) {
          const resVal = await response.json();
          advisorContext = `[Advisory Calculation - Investment]: Recommended allocations: Cash/FD: ${resVal.recommended_allocations?.["Cash/FD"] || "30%"}, Bonds/Debt: ${resVal.recommended_allocations?.["Bonds/Debt"] || "30%"}, Equity: ${resVal.recommended_allocations?.["Equity"] || "40%"}. Short-term advice: ${resVal.short_term}. Long-term advice: ${resVal.long_term}.`;
        }
      } else if (intent === 'Insurance') {
        const response = await fetch(`${AI_SERVICE_URL}/recommend-insurance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            age: context.age || 30,
            income: context.income || 50000,
            dependents: context.dependents || 1,
            marital_status: 'Single',
          }),
        });
        if (response.ok) {
          const resVal = await response.json();
          advisorContext = `[Advisory Calculation - Insurance]: Suggested Term Insurance: ${resVal.term_insurance_recommended}, Health Insurance level: ${resVal.health_insurance_level}, Suggested Coverage: ₹${resVal.suggested_coverage_amount}. Recommendations: ${resVal.recommendations_summary?.join(', ')}`;
        }
      } else if (intent === 'Loans') {
        const response = await fetch(`${AI_SERVICE_URL}/loan-advisor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            income: context.income || 50000,
            age: context.age || 30,
            credit_score: 750,
            current_emi: context.debt || 0,
            existing_loans: context.debt || 0,
          }),
        });
        if (response.ok) {
          const resVal = await response.json();
          advisorContext = `[Advisory Calculation - Loan Eligibility]: Maximum EMI user can pay: ₹${resVal.maximumEmi}, Safe EMI: ₹${resVal.safeEmi}, Loan Risk Assessment: ${resVal.loanRisk}, Max Eligible Loan amount: ₹${resVal.eligibleAmount}. Breakdown: Home Loan: ₹${resVal.breakdown?.homeLoan}, Car Loan: ₹${resVal.breakdown?.carLoan}.`;
        }
      } else if (intent === 'Tax') {
        const response = await fetch(`${AI_SERVICE_URL}/tax-optimizer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            annual_income: (context.income || 50000) * 12,
            salary_basic: (context.income || 50000) * 12 * 0.4,
            salary_hra: (context.income || 50000) * 12 * 0.15,
            salary_special: 0,
            salary_other: 0,
            deductions_80c: 150000,
            deductions_80d: 25000,
            home_loan: 0,
            education_loan: 0,
            rent_paid: 120000,
          }),
        });
        if (response.ok) {
          const resVal = await response.json();
          advisorContext = `[Advisory Calculation - Tax Optimization]: Taxable Income: ₹${resVal.taxableIncome}, Current calculated Tax: ₹${resVal.currentTax}, Potential savings through optimization: ₹${resVal.potentialSavings}. Recommended actions: ${resVal.recommendedInvestments?.join(', ')}.`;
        }
      }
    } catch (err) {
      console.warn("Under-the-hood calculations failed in chat controller:", err.message);
    }
  }

  // 5. Generate System Prompt
  const systemPrompt = buildSystemPrompt(context);

  // If permission is denied, tell Gemini to focus only on encouraging upgrade & describing the feature benefits
  let prompt = "";
  if (!perm.allowed) {
    prompt = `${systemPrompt}
    
CRITICAL UPDATE:
The user has requested details on the premium feature "${feature.name}". 
However, their current subscription is Free Tier. 
Do NOT show any active advisor calculations or calculate any results. 
Instead, write a premium marketing and advisory response:
- Enthusiastically outline the core benefits of the ${feature.name}.
- Describe 2-3 practical personal finance use cases for it.
- Warmly invite them to upgrade to Premium in their settings page to unlock this advisor.

User message: ${message}`;
  } else {
    prompt = `${systemPrompt}

${advisorContext ? `Advisory Calculations:\n${advisorContext}\n` : ''}

Recent conversation history:
${history.map(h => `${h.role === 'user' ? 'User' : 'FinPilot'}: ${h.content}`).join('\n') || 'No previous history.'}

User message: ${message}`;
  }

  // 6. Request Gemini API
  let reply = "";
  if (!process.env.GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY configured, falling back to local advisor.");
    if (!perm.allowed) {
      reply = `Our ${feature.name} is a Premium benefit. Upgrading to Premium gives you access to full analytics, custom recommendations, and detailed advisor audits. Please upgrade to Premium in your Account Settings to unlock this feature!`;
    } else if (advisorContext) {
      reply = advisorContext.replace(/\[Advisory Calculation - [^\]]+\]:\s*/g, '');
    } else {
      reply = `Based on your profile, your income is ₹${(context.income || 0).toLocaleString()} and your savings are ₹${(context.savings || 0).toLocaleString()}. Please ask specifically about investments, insurance, tax, or loan calculators to get detailed recommendations.`;
    }
  } else {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
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
        const result = await response.json();
        reply = extractGeminiReply(result);
      } else {
        throw new Error(`Gemini API error status: ${response.status}`);
      }
    } catch (geminiErr) {
      clearTimeout(timeoutId);
      console.warn("Gemini chatbot connection failed; falling back to local advisor.", geminiErr.message);
      if (!perm.allowed) {
        reply = `Our ${feature.name} is a Premium benefit. Upgrading to Premium gives you access to full analytics, custom recommendations, and detailed advisor audits. Please upgrade to Premium in your Account Settings to unlock this feature!`;
      } else if (advisorContext) {
        reply = advisorContext.replace(/\[Advisory Calculation - [^\]]+\]:\s*/g, '');
      } else {
        reply = `Based on your profile, your income is ₹${(context.income || 0).toLocaleString()} and your savings are ₹${(context.savings || 0).toLocaleString()}. Please ask specifically about investments, insurance, tax, or loan calculators to get detailed recommendations.`;
      }
    }
  }

  // 7. Format Response
  const formatted = formatResponse(reply, intent);

  return {
    reply: formatted.content,
    suggestions: formatted.suggestions,
    responseTime: Date.now() - startTime,
    modelUsed: GEMINI_MODEL
  };
};

// GET /api/chat/history
exports.getChatHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';

    let matchQuery = { userId: req.user };

    if (searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      
      // Find matching messages to pull their conversations
      const matchingMessages = await ChatHistory.find({
        userId: req.user,
        $or: [
          { message: searchRegex },
          { content: searchRegex }
        ]
      }).distinct('conversationId');

      matchQuery = {
        userId: req.user,
        $or: [
          { title: searchRegex },
          { _id: { $in: matchingMessages } }
        ]
      };
    }

    const conversations = await Conversation.find(matchQuery)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const count = await Conversation.countDocuments(matchQuery);

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await ChatHistory.findOne({ conversationId: conv._id })
          .sort({ timestamp: -1 })
          .lean();
        return {
          id: conv._id,
          title: conv.title,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          lastMessagePreview: lastMsg ? lastMsg.content || lastMsg.message : '',
          lastMessageTime: lastMsg ? lastMsg.timestamp : conv.updatedAt
        };
      })
    );

    res.json({
      status: 'success',
      data: conversationsWithDetails,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error retrieving chat history' });
  }
};

// GET /api/chat/:chatId
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const conversation = await Conversation.findOne({ _id: chatId, userId: req.user }).lean();
    
    if (!conversation) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found or unauthorized' });
    }

    const messages = await ChatHistory.find({ conversationId: chatId })
      .sort({ timestamp: 1 })
      .lean();

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      chatId: msg.conversationId,
      userId: msg.userId,
      role: msg.role || (msg.sender === 'ai' ? 'assistant' : 'user'),
      content: msg.content || msg.message,
      timestamp: msg.timestamp,
      metadata: msg.metadata || {}
    }));

    res.json({
      status: 'success',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      messages: formattedMessages
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error retrieving conversation' });
  }
};

// POST /api/chat
exports.createChat = async (req, res) => {
  try {
    const { title, message } = req.body;
    
    const initialTitle = title?.trim() || (message?.trim() ? message.trim().substring(0, 40) + (message.trim().length > 40 ? '...' : '') : 'New Chat');
    const conversation = new Conversation({
      userId: req.user,
      title: initialTitle,
    });
    await conversation.save();

    let userMsg = null;
    let aiMsg = null;

    if (message?.trim()) {
      const { reply, suggestions, responseTime, modelUsed } = await generateAIResponse({
        userId: req.user,
        message: message.trim(),
        history: []
      });

      userMsg = new ChatHistory({
        userId: req.user,
        conversationId: conversation._id,
        sender: 'user',
        role: 'user',
        message: message.trim(),
        content: message.trim(),
        timestamp: new Date()
      });
      await userMsg.save();

      aiMsg = new ChatHistory({
        userId: req.user,
        conversationId: conversation._id,
        sender: 'ai',
        role: 'assistant',
        message: reply,
        content: reply,
        timestamp: new Date(),
        metadata: {
          modelUsed,
          responseTime,
          suggestions
        }
      });
      await aiMsg.save();

      conversation.updatedAt = new Date();
      await conversation.save();
    }

    res.json({
      status: 'success',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      userMessage: userMsg ? {
        id: userMsg._id,
        chatId: conversation._id,
        role: 'user',
        content: userMsg.content,
        timestamp: userMsg.timestamp
      } : null,
      aiMessage: aiMsg ? {
        id: aiMsg._id,
        chatId: conversation._id,
        role: 'assistant',
        content: aiMsg.content,
        timestamp: aiMsg.timestamp,
        metadata: aiMsg.metadata
      } : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error starting conversation' });
  }
};

// POST /api/chat/:chatId/message
exports.postMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Message is required' });
    }

    const conversation = await Conversation.findOne({ _id: chatId, userId: req.user });
    if (!conversation) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found or unauthorized' });
    }

    const history = await ChatHistory.find({ conversationId: chatId })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    const { reply, suggestions, responseTime, modelUsed } = await generateAIResponse({
      userId: req.user,
      message: message.trim(),
      history: history.reverse()
    });

    const userMsg = new ChatHistory({
      userId: req.user,
      conversationId: chatId,
      sender: 'user',
      role: 'user',
      message: message.trim(),
      content: message.trim(),
      timestamp: new Date()
    });
    await userMsg.save();

    const aiMsg = new ChatHistory({
      userId: req.user,
      conversationId: chatId,
      sender: 'ai',
      role: 'assistant',
      message: reply,
      content: reply,
      timestamp: new Date(),
      metadata: {
        modelUsed,
        responseTime,
        suggestions
      }
    });
    await aiMsg.save();

    if (conversation.title === 'New Chat' || conversation.title === 'Imported Chat') {
      const messagesCount = await ChatHistory.countDocuments({ conversationId: chatId });
      if (messagesCount <= 2) {
        conversation.title = message.trim().substring(0, 40) + (message.trim().length > 40 ? '...' : '');
      }
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      status: 'success',
      reply: {
        id: aiMsg._id,
        chatId: conversation._id,
        role: 'assistant',
        content: aiMsg.content,
        timestamp: aiMsg.timestamp,
        metadata: aiMsg.metadata
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error processing message' });
  }
};

// PUT /api/chat/:chatId
exports.renameChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Title is required' });
    }

    const conversation = await Conversation.findOne({ _id: chatId, userId: req.user });
    if (!conversation) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found or unauthorized' });
    }

    conversation.title = title.trim();
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      status: 'success',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error renaming conversation' });
  }
};

// DELETE /api/chat/:chatId
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const conversation = await Conversation.findOneAndDelete({ _id: chatId, userId: req.user });
    
    if (!conversation) {
      return res.status(404).json({ status: 'error', message: 'Conversation not found or unauthorized' });
    }

    await ChatHistory.deleteMany({ conversationId: chatId });

    res.json({
      status: 'success',
      message: 'Conversation and history deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error deleting conversation' });
  }
};

// DELETE /api/chat/history
exports.deleteChatHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user }).select('_id');
    const conversationIds = conversations.map(c => c._id);

    await Conversation.deleteMany({ userId: req.user });
    await ChatHistory.deleteMany({ conversationId: { $in: conversationIds } });
    
    // Fallback delete of all loose history
    await ChatHistory.deleteMany({ userId: req.user });

    res.json({
      status: 'success',
      message: 'All conversations and history deleted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error deleting all conversations' });
  }
};
