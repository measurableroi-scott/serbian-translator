const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Creates a short-lived OpenAI client secret and returns it to the browser.
// The API key never leaves the server.
app.post('/session', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured on server' });
  }

  try {
    const response = await fetch(
      'https://api.openai.com/v1/realtime/translations/client_secrets',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: {
            model: 'gpt-realtime-translate',
            audio: {
              input: {
                transcription: { model: 'gpt-realtime-whisper' },
                noise_reduction: { type: 'near_field' },
              },
              output: { language: 'en' },
            },
          },
        }),
      }
    );

    const data = await response.json();

    // Log the full response so we can debug unexpected shapes
    console.log('OpenAI response status:', response.status);
    console.log('OpenAI response body:', JSON.stringify(data));

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error creating translation session:', error);
    res.status(500).json({ error: 'Failed to create translation session' });
  }
});

app.listen(PORT, () => {
  console.log(`Serbian → English Translator running on port ${PORT}`);
});
