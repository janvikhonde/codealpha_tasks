const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/ai/breakdown
// Body: { title: "Build login page", context: "optional extra context" }
router.post('/breakdown', async (req, res) => {
  try {
    const { title, context } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title required' });

    const prompt = `You are a senior software project manager. Break down this task into exactly 5 clear, actionable subtasks.

Task: "${title}"
${context ? `Context: ${context}` : ''}

Respond ONLY with a JSON array of 5 strings. No explanation. No markdown. Example:
["Subtask 1", "Subtask 2", "Subtask 3", "Subtask 4", "Subtask 5"]`;

    const response = await groq.chat.completions.create({
       model: 'llama-3.3-70b-versatile',// fast and free on Groq
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.choices[0].message.content.trim();
    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const subtasks = JSON.parse(clean);

    if (!Array.isArray(subtasks)) throw new Error('Invalid AI response');

    res.json({ subtasks: subtasks.map((title) => ({ title, done: false })) });
  } catch (err) {
    console.error('AI breakdown error:', err.message);
    res.status(500).json({ message: 'AI breakdown failed', error: err.message });
  }
});

module.exports = router;