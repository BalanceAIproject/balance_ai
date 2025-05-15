const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/agent-message", async (req, res) => {
  const { prompt, canvasId, blocks } = req.body;

  const context = blocks?.map(b => `${b.type}: ${b.content}`).join("\n") || "";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant inside a visual workspace called a canvas. 
Your goal is to break down the user's prompt into helpful UI blocks like:

- checklists
- equipment/resource cards
- fillable forms

Return your answer in the following JSON structure:

{
  "agentReply": "Friendly explanation of what's happening.",
  "suggestedBlocks": [
    {
      "type": "CHECKLIST",
      "title": "Block Title",
      "items": ["Item 1", "Item 2"]
    },
    {
      "type": "RESOURCE_CARD",
      "title": "Block Title",
      "items": [
        { "name": "Name", "purpose": "Why it's used", "recommended": "Suggestions" }
      ]
    },
    {
      "type": "FORM",
      "title": "Block Title",
      "fields": [
        { "label": "Field label", "placeholder": "Type here..." }
      ]
    }
  ]
}
        `.trim()
        },
        {
          role: "user",
          content: `Here’s what I’ve added so far:\n${context}\nNow I want to explore: ${prompt}`
        }
      ],
      temperature: 0.7
    });

    const responseText = completion.choices[0].message.content;

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (err) {
      console.error("Failed to parse assistant JSON:", err);
      return res.json({
        agentReply: responseText,
        suggestedBlocks: []
      });
    }

    return res.json(responseData);

  } catch (error) {
    console.error("Error from OpenAI:", error.message);
    res.status(500).json({
      error: "Agent failed to respond. Please try again later.",
    });
  }
});


app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});