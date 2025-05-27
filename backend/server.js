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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function saveChat(canvasId, userPrompt, agentReply, suggestedBlocks) {
  const chatPath = path.join(__dirname, "chats", `${canvasId}.json`);
  const entry = { timestamp: new Date().toISOString(), userPrompt, agentReply, suggestedBlocks };
  let existing = [];
  if (fs.existsSync(chatPath)) existing = JSON.parse(fs.readFileSync(chatPath, "utf-8"));
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
        { role: "system", content: "Summarize the user's intent and AI responses into one sentence." },
        { role: "user", content: JSON.stringify(chatHistory) }
      ]
    });
    const summary = summaryResponse.choices[0].message.content;
    fs.writeFileSync(summaryPath, JSON.stringify({ summary }, null, 2));
  } catch (err) {
    console.error("Failed to summarize chat:", err.message);
  }
}

app.post("/agent-message", async (req, res) => {
  const { prompt, canvasId, blocks } = req.body;
  const context = blocks?.map(b => `${b.type}: ${b.content}`).join("\n") || "";
  const chatPath = path.join(__dirname, "chats", `${canvasId}.json`);
  let history = [];

  if (fs.existsSync(chatPath)) {
    const past = JSON.parse(fs.readFileSync(chatPath, 'utf-8'));
    history = past.flatMap(entry => {
      const messages = [];
      if (entry.userPrompt) messages.push({ role: 'user', content: entry.userPrompt });
      if (entry.agentReply) messages.push({ role: 'assistant', content: entry.agentReply });
      return messages;
});
  }

  history.push({
    role: 'user',
    content: `Please break this down into UI blocks.\nHere’s what I’ve added so far:\n${context}\nNow I want to explore: ${prompt}`
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
  role: "system",
  content: `
You are an AI assistant inside a visual workspace called a canvas.
Your only job is to break down the user's prompt into UI blocks.

Return ONLY a JSON object with this format:

{
  "agentReply": "Short explanation of what you're doing",
  "suggestedBlocks": [
    {
      "type": "CHECKLIST",
      "title": "Checklist Title",
      "items": ["Step 1", "Step 2"]
    },
    {
      "type": "RESOURCE_CARD",
      "title": "Resources",
      "items": [
        { "name": "Tool A", "purpose": "Why it's used", "recommended": "Optional tips" }
      ]
    }
  ]
}

Do NOT include anything outside the JSON. No explanations. No markdown. Just valid JSON.
  `.trim()
},

        ...history
      ],
      temperature: 0.7
    });

    let raw = completion.choices[0].message.content.trim();
    if (raw.startsWith("```json")) raw = raw.replace(/^```json/, "").replace(/```$/, "").trim();
    raw = raw.replace(/\/\/.*$/gm, "");
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("Failed to parse response:", err.message);
      return res.json({ agentReply: raw, suggestedBlocks: [] });
    }

    saveChat(canvasId, prompt, parsed.agentReply, parsed.suggestedBlocks);
    await summarizeChat(canvasId);
    res.json(parsed);
  } catch (error) {
    console.error("Error from OpenAI:", error.message);
    res.status(500).json({ error: "Agent failed to respond." });
  }
});

app.get("/chat-history", (req, res) => {
  const chatDir = path.join(__dirname, "chats");
  if (!fs.existsSync(chatDir)) return res.json([]);

  const files = fs.readdirSync(chatDir);
  const chatFiles = files.filter(f => f.endsWith('.json')).map(f => {
    const id = f.replace('.json', '');
    const summaryPath = path.join(__dirname, "summaries", `${id}_summary.json`);
    const chatPath = path.join(chatDir, f);

    const summary = fs.existsSync(summaryPath)
      ? JSON.parse(fs.readFileSync(summaryPath, 'utf-8')).summary
      : 'No summary';

    const firstPrompt = fs.existsSync(chatPath)
      ? (JSON.parse(fs.readFileSync(chatPath, 'utf-8'))[0]?.userPrompt || "")
      : "";

    return { canvasId: id, summary, firstPrompt };
  });

  res.json(chatFiles);
});


app.get("/chat/:canvasId", (req, res) => {
  const chatPath = path.join(__dirname, "chats", `${req.params.canvasId}.json`);
  if (!fs.existsSync(chatPath)) return res.status(404).json({ error: 'Chat not found' });
  res.json(JSON.parse(fs.readFileSync(chatPath, 'utf-8')));
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
