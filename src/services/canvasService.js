import { v4 as uuidv4 } from 'uuid';
import { storageService, StorageKeys } from './storage/localStorage';

const defaultState = {
  canvases: [],
};

export const CanvasState = {
  ACTIVE: 'ACTIVE',
  AMBIENT: 'AMBIENT',
  CHECKPOINTED: 'CHECKPOINTED',
  DORMANT: 'DORMANT',
};

export const canvasService = {
  // Get all canvases
  getAllCanvases() {
    const data = storageService.getItem(StorageKeys.CANVASES) || defaultState;
    return data.canvases;
  },

  // Get a specific canvas by ID
  getCanvas(id) {
    const canvases = this.getAllCanvases();
    return canvases.find(canvas => canvas.id === id) || null;
  },

  // Create a new canvas from intent prompt
  createCanvas(promptText) {
    const canvases = this.getAllCanvases();
    
    const newCanvas = {
      id: uuidv4(),
      title: promptText.substring(0, 50), // Default title from prompt
      prompt: promptText,
      state: CanvasState.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [],
      agentContext: {
        history: [],
        suggestions: [],
      },
      tags: [],
      relatedCanvases: [],
    };
    
    canvases.push(newCanvas);
    
    storageService.setItem(StorageKeys.CANVASES, { canvases });
    
    return newCanvas;
  },

  // Update canvas details
  updateCanvas(id, updates) {
    const canvases = this.getAllCanvases();
    const index = canvases.findIndex(canvas => canvas.id === id);
    
    if (index === -1) return null;
    
    const updatedCanvas = {
      ...canvases[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    canvases[index] = updatedCanvas;
    
    storageService.setItem(StorageKeys.CANVASES, { canvases });
    
    return updatedCanvas;
  },

  // Update canvas state
  updateCanvasState(id, newState) {
    return this.updateCanvas(id, { state: newState });
  },

  // Delete/archive a canvas
  deleteCanvas(id) {
    const canvases = this.getAllCanvases();
    const filteredCanvases = canvases.filter(canvas => canvas.id !== id);
    
    if (filteredCanvases.length === canvases.length) return false;
    
    storageService.setItem(StorageKeys.CANVASES, { canvases: filteredCanvases });
    
    return true;
  },

  // Search canvases by content
  searchCanvases(searchTerm) {
    const canvases = this.getAllCanvases();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return canvases.filter(canvas => 
      canvas.title.toLowerCase().includes(lowerSearchTerm) ||
      canvas.prompt.toLowerCase().includes(lowerSearchTerm)
    );
  },

  // Find related canvases
  getRelatedCanvases(id) {
    const canvas = this.getCanvas(id);
    if (!canvas) return [];
    
    return canvas.relatedCanvases.map(relatedId => this.getCanvas(relatedId))
      .filter(Boolean);
  },

  // Link two canvases
  linkCanvases(sourceId, targetId) {
    const sourceCanvas = this.getCanvas(sourceId);
    const targetCanvas = this.getCanvas(targetId);
    
    if (!sourceCanvas || !targetCanvas) return false;
    
    // Add link to source canvas if it doesn't already exist
    if (!sourceCanvas.relatedCanvases.includes(targetId)) {
      this.updateCanvas(sourceId, {
        relatedCanvases: [...sourceCanvas.relatedCanvases, targetId]
      });
    }
    
    // Add reciprocal link if it doesn't already exist
    if (!targetCanvas.relatedCanvases.includes(sourceId)) {
      this.updateCanvas(targetId, {
        relatedCanvases: [...targetCanvas.relatedCanvases, sourceId]
      });
    }
    
    return true;
  }
};