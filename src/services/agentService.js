import { storageService, StorageKeys } from './storage/localStorage';
import { canvasService } from './canvasService';
import { blockService } from './blockService';

export const agentService = {
  // Process an initial user intent
  processIntent(promptText) {
    // For POC: Generate a simple response based on the prompt
    const suggestedBlocks = this._generateBlockSuggestions(promptText);
    
    // Create a new canvas
    const canvas = canvasService.createCanvas(promptText);
    
    // Store initial agent context
    this._updateAgentContext(canvas.id, {
      initialPrompt: promptText,
      suggestions: suggestedBlocks,
      lastMessage: `I've created a canvas for "${promptText}". Would you like to add some blocks to get started?`,
    });
    
    return {
      canvas,
      message: `I've created a canvas for "${promptText}". Would you like to add some blocks to get started?`,
      suggestedBlocks,
    };
  },

  // Send a message to the agent for a specific canvas
  sendMessage(canvasId, message) {
    const canvas = canvasService.getCanvas(canvasId);
    if (!canvas) return null;
    
    const context = this._getAgentContext(canvasId);
    const highlightedBlocks = this._getHighlightedBlocks(canvasId);
    
    // For POC: Generate a simple response based on the message and context
    const response = this._generateAgentResponse(message, context, highlightedBlocks);
    
    // Update agent context with this interaction
    this._updateAgentContext(canvasId, {
      history: [
        ...(context.history || []),
        { role: 'user', content: message },
        { role: 'assistant', content: response.message },
      ],
      lastMessage: response.message,
    });
    
    return response;
  },

  // Get agent suggestions for blocks
  getSuggestions(canvasId) {
    const context = this._getAgentContext(canvasId);
    return context.suggestions || [];
  },

  // Analyze block content
  analyzeBlock(blockId) {
    const block = blockService.getBlock(blockId);
    if (!block) return null;
    
    // For POC: Generate a simple analysis of the block content
    return {
      summary: `This ${block.type} block contains ${typeof block.content === 'string' ? block.content.length : 'complex'} content.`,
      insights: [`This is a ${block.type} block created on ${new Date(block.createdAt).toLocaleDateString()}.`],
    };
  },

  // Private helper functions
  _getAgentContext(canvasId) {
    const contexts = storageService.getItem(StorageKeys.AGENT_CONTEXT) || {};
    return contexts[canvasId] || {
      history: [],
      suggestions: [],
    };
  },

  _updateAgentContext(canvasId, updates) {
    const contexts = storageService.getItem(StorageKeys.AGENT_CONTEXT) || {};
    
    contexts[canvasId] = {
      ...(contexts[canvasId] || {}),
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    storageService.setItem(StorageKeys.AGENT_CONTEXT, contexts);
    return contexts[canvasId];
  },

  _getHighlightedBlocks(canvasId) {
    return blockService.getBlocks(canvasId)
      .filter(block => block.highlighted);
  },

  _generateBlockSuggestions(prompt) {
    // Mock implementation - in a real app, this would use AI
    const lowercasePrompt = prompt.toLowerCase();
    
    const suggestions = [];
    
    if (lowercasePrompt.includes('idea') || lowercasePrompt.includes('brainstorm')) {
      suggestions.push({ type: 'IDEA_MAP', title: 'Idea Map' });
    }
    
    if (lowercasePrompt.includes('plan') || lowercasePrompt.includes('project')) {
      suggestions.push({ type: 'TODO', title: 'Task List' });
    }
    
    if (lowercasePrompt.includes('write') || lowercasePrompt.includes('story') || lowercasePrompt.includes('journal')) {
      suggestions.push({ type: 'JOURNAL', title: 'Journal' });
    }
    
    // Always suggest these common blocks if we don't have many suggestions
    if (suggestions.length < 2) {
      if (!suggestions.some(s => s.type === 'JOURNAL')) {
        suggestions.push({ type: 'JOURNAL', title: 'Notes' });
      }
      if (!suggestions.some(s => s.type === 'TODO')) {
        suggestions.push({ type: 'TODO', title: 'Tasks' });
      }
    }
    
    return suggestions;
  },

  _generateAgentResponse(message, context, highlightedBlocks) {
    // Mock implementation - in a real app, this would use AI
    const lowercaseMessage = message.toLowerCase();
    
    if (highlightedBlocks.length > 0) {
      const block = highlightedBlocks[0];
      return {
        message: `I see you've highlighted a ${block.type} block. How can I help with this?`,
        suggestions: [
          { action: 'expand', text: `Tell me more about this ${block.type}` },
          { action: 'analyze', text: 'Analyze this content' },
        ],
      };
    }
    
    if (lowercaseMessage.includes('help') || lowercaseMessage.includes('how')) {
      return {
        message: "I'm your canvas assistant. You can create blocks, organize your ideas, and ask me for suggestions.",
        suggestions: [
          { action: 'create', text: 'Create a new block' },
          { action: 'explain', text: 'Explain how this works' },
        ],
      };
    }
    
    return {
      message: "I'm here to help with your canvas. What would you like to do next?",
      suggestions: [
        { action: 'create', text: 'Create a new block' },
        { action: 'organize', text: 'Organize my canvas' },
      ],
    };
  },
};