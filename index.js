const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

console.log('Loaded OpenAI Key:', process.env.OPENAI_API_KEY);
console.log('Loaded SerpAPI Key:', process.env.SERPAPI_KEY);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

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
    console.log("📡 Search Query:", searchQuery);
    console.log("📡 Search Snippets:\n", snippets);

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
    res.json({ reply });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: 'Search or OpenAI request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
