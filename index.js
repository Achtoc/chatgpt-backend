const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  console.log("Received prompt:", prompt);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log("Raw OpenAI response:", response.data);
    const reply = response.data.choices[0].message.content;
    console.log("AI Reply:", reply);

    res.json({ reply });
  } catch (err) {
    console.error("Error talking to OpenAI:", err);
    res.status(500).json({ error: 'Error contacting OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
