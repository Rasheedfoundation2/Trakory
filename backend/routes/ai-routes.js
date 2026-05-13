// routes/ai-routes.js
// AI Assistant powered by Google Gemini (free tier)
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth-middleware');

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are Trakory AI Assistant, an intelligent HR and employee management helper. 
You help employees with:
- Understanding company policies and HR procedures
- Time tracking and attendance questions
- Leave request guidance
- Project management tips
- General workplace questions

Keep your responses concise, professional, and helpful. 
If you don't know something specific about the company, suggest the employee contact their HR department or manager.
Always be encouraging and supportive.`;

// POST /api/ai/chat - Chat with AI assistant
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                error: 'AI service not configured',
                reply: 'AI assistant is not configured yet. Please contact your administrator to set up the Gemini API key.'
            });
        }

        // Build conversation context
        const contents = [];

        // Add conversation history
        for (const msg of history.slice(-10)) { // Keep last 10 messages for context
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction: {
                        parts: [{ text: SYSTEM_PROMPT }]
                    },
                    tools: [
                        { googleSearch: {} }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                        thinkingConfig: {
                            thinkingLevel: "HIGH"
                        }
                    },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    ]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', errorData);
            return res.status(500).json({ 
                error: 'AI service error',
                reply: 'Sorry, I encountered an error. Please try again later.'
            });
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

        res.json({ 
            success: true, 
            reply 
        });

    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            reply: 'Sorry, something went wrong. Please try again.'
        });
    }
});

// GET /api/ai/health - Check if AI is configured
router.get('/health', (req, res) => {
    const isConfigured = !!process.env.GEMINI_API_KEY;
    res.json({ 
        success: true, 
        aiEnabled: isConfigured,
        model: 'gemini-3-flash-preview'
    });
});

module.exports = router;
