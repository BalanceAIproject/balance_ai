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
        {
          role: "system",
          content: `You are an assistant that summarizes entire chat histories for a visual canvas UI.

Your response MUST be a valid JSON object with the following structure:
{
  "title": "Short title (1-5 words)",
  "description": "1-2 sentence overview of the entire chat",
  "summary": "Detailed paragraph explaining the purpose, steps taken, and goal of the canvas"
}

Return only the JSON. Do not use markdown or explanation.`
        },
        {
          role: "user",
          content: JSON.stringify(chatHistory)
        }
      ]
    });

    let raw = summaryResponse.choices[0].message.content.trim();

    if (raw.startsWith("```json")) {
      raw = raw.replace(/^```json/, "").replace(/```$/, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("OpenAI did not return valid JSON. Raw response:\n", raw);
      parsed = {
        title: "Untitled",
        description: "",
        summary: ""
      };
    }

    fs.writeFileSync(summaryPath, JSON.stringify(parsed, null, 2));
  } catch (err) {
    console.error("Failed to generate chat summary:", err.message);
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
  const chatFilesData = files
    .filter(f => f.endsWith('.json') && !f.includes('_summary'))
    .map(f => {
      const id = f.replace('.json', '');
      const chatFilePath = path.join(chatDir, f);
      const summaryPath = path.join(__dirname, "summaries", `${id}_summary.json`);

      let title = 'Untitled Canvas';
      let description = 'No description available.';
      let blocks = []; // Initialize blocks as an empty array
      let status = 'Active';
      let videoTitles = [];
      let firstPrompt = '';

      if (fs.existsSync(chatFilePath)) {
        try {
          const chatData = JSON.parse(fs.readFileSync(chatFilePath, 'utf-8'));
          if (chatData.length > 0) {
            for (const entry of chatData) {
              if (entry.userPrompt) {
                firstPrompt = entry.userPrompt;
                break; // Found the first user prompt
              }
            }
            const lastEntry = chatData[chatData.length - 1];
            // Directly use suggestedBlocks if available, otherwise keep blocks as empty array
            if (lastEntry && lastEntry.suggestedBlocks && Array.isArray(lastEntry.suggestedBlocks)) {
              blocks = lastEntry.suggestedBlocks;
            }
          }
        } catch (e) {
          console.error(`Error reading chat file ${chatFilePath}:`, e.message);
        }
      }

      if (fs.existsSync(summaryPath)) {
        try {
          const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
          title = summaryData.title || title;
          description = summaryData.description || description;
        } catch (e) {
          console.error(`Error reading summary file ${summaryPath}:`, e.message);
        }
      }

      const timestamp = parseInt(id, 10);

      return {
        id,
        canvasId: id,
        title,
        description,
        timestamp,
        blocks, // Send the full blocks array
        status,
        videoTitles,
        firstPrompt
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  res.json(chatFilesData);
});

app.get("/chat/:canvasId", (req, res) => {
  const chatPath = path.join(__dirname, "chats", `${req.params.canvasId}.json`);
  if (!fs.existsSync(chatPath)) return res.status(404).json({ error: 'Chat not found' });
  res.json(JSON.parse(fs.readFileSync(chatPath, 'utf-8')));
});

// Helper function to get details for a single chat, similar to /chat-history logic
function getChatDetailsForCombination(chatId, chatDir, summaryDir) {
  const chatFilePath = path.join(chatDir, `${chatId}.json`);
  const summaryPath = path.join(summaryDir, `${chatId}_summary.json`);

  let title = 'Untitled Canvas';
  let description = 'No description available.';
  let blocksFromLastEntry = []; // This will be an array of block titles/types
  let chatHistory = [];
  let videoTitles = []; // Assuming this might be populated in chat data

  if (fs.existsSync(chatFilePath)) {
    try {
      chatHistory = JSON.parse(fs.readFileSync(chatFilePath, 'utf-8'));
      if (chatHistory.length > 0) {
        const lastEntry = chatHistory[chatHistory.length - 1];
        if (lastEntry.suggestedBlocks && Array.isArray(lastEntry.suggestedBlocks)) {
          blocksFromLastEntry = lastEntry.suggestedBlocks.map(block => block.title || block.type || 'Unnamed Block');
        }
        // Potentially extract videoTitles if they are stored per entry or chat
      }
    } catch (e) {
      console.error(`Error parsing chat file ${chatFilePath} for combination:`, e.message);
      throw new Error(`Could not parse chat file ${chatId}.json`);
    }
  } else {
    throw new Error(`Chat file ${chatId}.json not found.`);
  }
  
  if (fs.existsSync(summaryPath)) {
    try {
      const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      title = summaryData.title || title;
      description = summaryData.description || description;
      // videoTitles might also come from summary if stored there
    } catch (e) {
      console.error(`Error parsing summary file ${summaryPath} for combination:`, e.message);
      // Non-fatal, proceed with default title/description
    }
  }

  return {
    id: chatId,
    title,
    description,
    chatHistory, // Full history for merging
    blocks: blocksFromLastEntry, // Block titles from last entry for frontend response
    videoTitles // videoTitles for frontend response
  };
}

app.post("/combine-chats", async (req, res) => {
  const { sourceChatId1, sourceChatId2 } = req.body;

  if (!sourceChatId1 || !sourceChatId2) {
    return res.status(400).json({ error: "Missing sourceChatId1 or sourceChatId2" });
  }

  const chatDir = path.join(__dirname, "chats");
  const summaryDir = path.join(__dirname, "summaries");

  try {
    const chat1Details = getChatDetailsForCombination(sourceChatId1, chatDir, summaryDir);
    const chat2Details = getChatDetailsForCombination(sourceChatId2, chatDir, summaryDir);

    const newChatId = Date.now().toString();
    const newTimestamp = parseInt(newChatId, 10);

    // Prepare content for LLM prompt
    const promptContent = `
Chat 1 Title: ${chat1Details.title}
Chat 1 Description: ${chat1Details.description}
Chat 1 Summary: ${chat1Details.summary || (chat1Details.chatHistory.length > 0 ? JSON.stringify(chat1Details.chatHistory.slice(-2)) : 'No detailed summary or history available.')} 

Chat 2 Title: ${chat2Details.title}
Chat 2 Description: ${chat2Details.description}
Chat 2 Summary: ${chat2Details.summary || (chat2Details.chatHistory.length > 0 ? JSON.stringify(chat2Details.chatHistory.slice(-2)) : 'No detailed summary or history available.')}

Based on the two chats described above, synthesize a concept for a NEW, third chat. This new chat should explore a novel idea or project that creatively combines or builds upon themes, goals, or topics from both original chats.

Your response MUST be a valid JSON object with the following structure:
{
  "newChatTitle": "Creative and concise title for the new chat (1-7 words)",
  "newChatDescription": "A brief (1-2 sentence) description of what this new chat/canvas will be about.",
  "newChatSummary": "A more detailed paragraph explaining the synthesized concept, its purpose, and potential direction for the new chat.",
  "initialAgentReply": "An engaging opening message from the AI for this new chat, inviting the user to start.",
  "initialSuggestedBlocks": [
    { "type": "TEXT_INPUT", "title": "What's your first thought on this new topic?", "content": "" } 
  ]
}

Return only the JSON. Do not use markdown or explanation.
The 'initialSuggestedBlocks' should be very generic to start the new chat, or can be an empty array if no specific blocks are immediately obvious.
The 'initialAgentReply' should be welcoming and related to the new synthesized topic.
Focus on creating a truly NEW concept, not just merging the old ones.
`;

    const synthesisResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a creative assistant that synthesizes new ideas from existing chat contexts." },
        { role: "user", content: promptContent }
      ],
      temperature: 0.8 
    });

    let rawSynthesizedData = synthesisResponse.choices[0].message.content.trim();
    if (rawSynthesizedData.startsWith("```json")) {
      rawSynthesizedData = rawSynthesizedData.replace(/^```json/, "").replace(/```$/, "").trim();
    }

    let synthesizedData;
    try {
      synthesizedData = JSON.parse(rawSynthesizedData);
    } catch (parseError) {
      console.error("OpenAI did not return valid JSON for chat synthesis. Raw response:\n", rawSynthesizedData);
      throw new Error("Failed to parse synthesized chat data from AI.");
    }

    const { 
      newChatTitle, 
      newChatDescription, 
      newChatSummary 
      // We will generate initialAgentReply and initialSuggestedBlocks in a second call
    } = synthesizedData;

    // --- Second AI Call: Generate initial blocks and agent reply for the new concept ---
    const blockGenerationPrompt = `Based on the new chat concept titled '${newChatTitle}' and described as '${newChatDescription}', please generate an initial set of UI blocks and an engaging opening message to get started. The overall summary for this new chat is: ${newChatSummary}`;

    const blockGenerationCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Model for block generation
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant inside a visual workspace called a canvas.
Your only job is to break down the user's prompt into UI blocks.

Return ONLY a JSON object with this format:

{
  "agentReply": "Short explanation of what you're doing or an engaging opening message for the new chat",
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
The 'agentReply' should be welcoming and directly related to the new synthesized topic.
The 'suggestedBlocks' should be relevant initial blocks for this new topic.
`
        },
        {
          role: "user",
          content: blockGenerationPrompt
        }
      ],
      temperature: 0.7 
    });

    let rawBlockData = blockGenerationCompletion.choices[0].message.content.trim();
    if (rawBlockData.startsWith("```json")) {
      rawBlockData = rawBlockData.replace(/^```json/, "").replace(/```$/, "").trim();
    }
    rawBlockData = rawBlockData.replace(/\/\/.*$/gm, ""); // Remove comments

    let parsedBlockData;
    try {
      parsedBlockData = JSON.parse(rawBlockData);
      console.log(parsedBlockData);
    } catch (blockParseError) {
      console.error("OpenAI did not return valid JSON for block generation. Raw response:\n", rawBlockData);
      // Fallback to a generic reply and empty blocks if block generation fails
      parsedBlockData = {
        agentReply: `Welcome to your new canvas: ${newChatTitle}! Let's get started.`,
        suggestedBlocks: []
      };
    }
    // --- End of Second AI Call ---

    // Save the new chat's summary (using data from the first AI call)
    const newSummaryObject = {
      title: newChatTitle,
      description: newChatDescription,
      summary: newChatSummary
    };
    const newSummaryPath = path.join(summaryDir, `${newChatId}_summary.json`);
    fs.writeFileSync(newSummaryPath, JSON.stringify(newSummaryObject, null, 2));

    // Save the initial state of the new chat (using data from the SECOND AI call)
    const initialChatEntry = {
      timestamp: new Date(newTimestamp).toISOString(), 
      userPrompt: null, 
      agentReply: parsedBlockData.agentReply, 
      suggestedBlocks: parsedBlockData.suggestedBlocks || [] 
    };
    const newChatFilePath = path.join(chatDir, `${newChatId}.json`);
    fs.writeFileSync(newChatFilePath, JSON.stringify([initialChatEntry], null, 2));
    
    const newSynthesizedChatData = {
      id: newChatId,
      canvasId: newChatId,
      title: newChatTitle, // From first AI call
      description: newChatDescription, // From first AI call
      timestamp: newTimestamp,
      // For UserProfilePage card preview, send the actual blocks
      blocks: parsedBlockData.suggestedBlocks || [], // Send full blocks
      status: 'Active',
      videoTitles: [],
      initialEntry: initialChatEntry // Full initial entry for chat.js
    };

    res.status(201).json(newSynthesizedChatData);

  } catch (error) {
    console.error("Failed to synthesize new chat:", error.message);
    if (error.message.includes("not found") || error.message.includes("Could not parse")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error while combining chats." });
  }
});

app.post('/chat/:canvasId/update-title', (req, res) => {
    const { canvasId } = req.params;
    const { title } = req.body;

    const summaryPath = path.join(__dirname, "summaries", `${canvasId}_summary.json`);
    console.log("Writing to summary path:", summaryPath);
    console.log("Save title request received:", canvasId, title);

    let summaryData = {
        title: title || "Untitled",
        description: "",
        summary: ""
    };

    if (fs.existsSync(summaryPath)) {
        try {
            const existing = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
            summaryData.description = existing.description || "";
            summaryData.summary = existing.summary || "";
        } catch (err) {
            console.error("Error reading existing summary:", err.message);
        }
    }

    try {
        fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
        console.log("Title saved to:", summaryPath);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Failed to write updated title:", err.message);
        res.status(500).json({ error: "Failed to save title." });
    }
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
