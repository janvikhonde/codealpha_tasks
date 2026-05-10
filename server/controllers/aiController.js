// 📁 server/controllers/aiController.js
const axios = require('axios');

// ─────────────────────────────────────────────
// POST /api/ai/breakdown
// Body: { title, context }
// ─────────────────────────────────────────────
const breakdown = async (req, res) => {
  try {
    const { title, context } = req.body;
    if (!title?.trim())
      return res.status(400).json({ message: 'Task title is required' });

    const prompt = `You are a senior software project manager. Break down this development task into exactly 5 clear, specific, and actionable subtasks.

Task: "${title}"
${context ? `Additional context: ${context}` : ''}

Rules:
- Each subtask must be concrete and completable in 1–4 hours
- Use action verbs (Create, Write, Implement, Test, Configure)
- Be specific, not vague

Respond ONLY with a valid JSON array of exactly 5 strings. No explanation. No markdown. No extra text.
Example format: ["Subtask one", "Subtask two", "Subtask three", "Subtask four", "Subtask five"]`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const raw = response.data.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed))
      throw new Error('AI did not return an array');

    const subtasks = parsed.slice(0, 5).map((t) => ({
      title: typeof t === 'string' ? t : t.title || String(t),
      done: false,
    }));

    res.json({ subtasks, raw: clean });
  } catch (err) {
    console.error('AI breakdown error:', err.message);

    if (err.response?.status === 401)
      return res.status(500).json({ message: 'Invalid Anthropic API key' });

    if (err.message?.includes('JSON'))
      return res.status(500).json({ message: 'AI returned invalid format. Try again.' });

    res.status(500).json({ message: 'AI breakdown failed. Please try again.', error: err.message });
  }
};

module.exports = { breakdown };