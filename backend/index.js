require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// POST /api/classify
app.post('/api/classify', async (req, res) => {
  const { label } = req.body;
  if (!label) {
    return res.status(400).json({ error: 'Missing label in request body' });
  }

  try {
    // Gemini API call
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiApiKey;
    const prompt = `Classify the following object for eco-sorting: "${label}". Is it recyclable, reusable, sellable, compostable, hazardous, or donation-worthy? Reply with a short classification and a brief reason.`;

    const geminiRes = await axios.post(geminiUrl, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const geminiText = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unknown';
    res.json({ classification: geminiText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to classify with Gemini' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
}); 