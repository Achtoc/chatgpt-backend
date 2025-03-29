const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

const ResponseSchema = new mongoose.Schema({
  prompt: String,
  reply: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Response = mongoose.model('Response', ResponseSchema);

app.get('/', (req, res) => {
  res.send('Backend is live 🚀');
});

app.post('/api/chat', async (req, res) => {
  const { prompt, tone, style, structure, region } = req.body;

  try {
    const searchQuery = `${prompt}${region ? ` site:${region}` : ''}`;

    const serpResponse = await axios.get('https://serpapi.com/search', {
      params: {
        q: searchQuery,
        api_key: process.env.SERPAPI_KEY,
        engine: 'google',
        hl: 'en',
        gl: 'us',
      },
    });

    const results = serpResponse.data.organic_results || [];
    const snippets = results.map(r => `- ${r.title}: ${r.snippet}`).join('\n');

    const isShortPrompt = prompt.trim().split(' ').length < 10;

    const messages = isShortPrompt
      ? [
          {
            role: 'system',
            content: `You are an assistant that answers questions using the real-time search results provided. Be accurate, up-to-date, and avoid guessing.`
          },
          {
            role: 'user',
            content: `Question: ${prompt}\n\nSearch Results:\n${snippets}`
          }
        ]
      : [
          {
            role: 'system',
            content: `
You are a world-class journalist AI. Write a long-form article of at least 1000 words based on the user's query and the search results below.

Your writing should:
- Begin with a clear title and a compelling introduction
- Have 3-5 structured sections with subheadings
- Include real-time references from the search results
- Maintain a ${tone || 'neutral'} tone and a ${style || 'professional'} writing style
- Be structured using ${structure || 'an introduction, detailed body sections, and a conclusion'}

Be as detailed and insightful as possible. If useful, include numbers, quotes, data, or dates from the search snippets. Do not fabricate information.
            `.trim()
          },
          {
            role: 'user',
            content: `${prompt}\n\nSearch Results:\n${snippets}`
          }
        ];

    const chatResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        max_tokens: 4000,
        temperature: 0.7,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const reply = chatResponse.data.choices[0].message.content;

    await Response.create({ prompt, reply });

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Search or OpenAI request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
