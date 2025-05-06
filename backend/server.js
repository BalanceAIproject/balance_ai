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
          content: `You are a helpful and creative assistant working inside a canvas called ${canvasId}.`,
        },
        {
          role: "user",
          content: `Here’s what I’ve added so far:\n${context}\nNow I want to explore: ${prompt}`,
        },
      ],
    });

    const agentReply = completion.choices[0].message.content;
    res.json({ agentReply }); 
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