const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function saveChat(canvasId, userPrompt, agentReply, suggestedBlocks) {
  const chatPath = path.join(__dirname, "chats", `${canvasId}.json`);
  const entry = {
    timestamp: new Date().toISOString(),
    userPrompt,
    agentReply,
    suggestedBlocks
  };

  let existing = [];
  if (fs.existsSync(chatPath)) {
    existing = JSON.parse(fs.readFileSync(chatPath, "utf-8"));
  }

  existing.push(entry);
  fs.writeFileSync(chatPath, JSON.stringify(existing, null, 2));
}

async function summarizeChat(canvasId) {
  const chatPath = path.join(__dirname, "chats", `${canvasId}.json`);
  const summaryPath = path.join(__dirname, "summaries", `${canvasId}_summary.json`);
  if (!fs.existsSync(chatPath)) return;

  const chatHistory = JSON.parse(fs.readFileSync(chatPath, "utf-8"));

  try {
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Summarize the user's intent and AI responses into one sentence that describes the purpose or theme of this canvas." },
        { role: "user", content: JSON.stringify(chatHistory) }
      ]
    });

    const summary = summaryResponse.choices[0].message.content;
    fs.writeFileSync(summaryPath, JSON.stringify({ summary }, null, 2));
    console.log(`Summary saved to summaries/${canvasId}_summary.json`);
  } catch (err) {
    console.error("Failed to summarize chat:", err.message);
  }
}

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

    let raw = completion.choices[0].message.content.trim();

    if (raw.startsWith("```json")) {
      raw = raw.replace(/^```json/, "").replace(/```$/, "").trim();
    }

    raw = raw.replace(/\/\/.*$/gm, ""); 

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse assistant response:", err.message);
      return res.json({ agentReply: raw, suggestedBlocks: [] });
    }

    saveChat(canvasId, prompt, parsed.agentReply, parsed.suggestedBlocks);
    await summarizeChat(canvasId);

    res.json(parsed);
  } catch (error) {
    console.error("Error from OpenAI:", error.message);
    res.status(500).json({ error: "Agent failed to respond. Please try again later." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
