require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { twiml: { VoiceResponse } } = require('twilio');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/voice', async (req, res) => {
  const userSpeech = req.body.SpeechResult;
  const response = new VoiceResponse();

  console.log("👂 User said:", userSpeech);

  if (!userSpeech) {
    const gather = response.gather({
      input: 'speech',
      action: '/voice',
      method: 'POST'
    });
    gather.say("Hi! Ask me anything. I'm listening...");
    return res.type('text/xml').send(response.toString());
  }

  try {
    const aiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4.1',
        messages: [{ role: 'user', content: userSpeech }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = aiResponse.data.choices[0].message.content;
    console.log("🤖 AI replied:", reply);

    response.say(reply);
  } catch (err) {
    console.error("🔥 OpenAI Error:", err.response?.data || err.message);
    response.say("Sorry, something went wrong while answering your question. Please try again later.");
  }

  res.type('text/xml').send(response.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
