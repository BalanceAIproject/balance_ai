import { v4 as uuidv4 } from 'uuid';
import { storageService, StorageKeys } from './storage/localStorage';
import { canvasService } from './canvasService';

export const BlockTypes = {
  JOURNAL: 'JOURNAL',
  TODO: 'TODO',
  IDEA_MAP: 'IDEA_MAP',
  VOICE_NOTE: 'VOICE_NOTE',
  CONTENT_COLLECTION: 'CONTENT_COLLECTION',
  SEARCH_RESULTS: 'SEARCH_RESULTS',
};

export const blockService = {
  // Get all blocks for a canvas
  getBlocks(canvasId) {
    const canvas = canvasService.getCanvas(canvasId);
    if (!canvas) return [];
    
    const blocks = storageService.getItem(StorageKeys.BLOCKS) || {};
    return (canvas.blocks || [])
      .map(blockId => blocks[blockId])
      .filter(Boolean);
  },

  // Get a specific block
  getBlock(blockId) {
    const blocks = storageService.getItem(StorageKeys.BLOCKS) || {};
    return blocks[blockId] || null;
  },

  // Create a new block in a canvas
  createBlock(canvasId, { type, content, position = { x: 0, y: 0, width: 300, height: 200 } }) {
    const canvas = canvasService.getCanvas(canvasId);
    if (!canvas) return null;
    
    const blocks = storageService.getItem(StorageKeys.BLOCKS) || {};
    
    const newBlockId = uuidv4();
    const newBlock = {
      id: newBlockId,
      canvasId,
      type,
      content,
      position,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      highlighted: false,
      state: {},
    };
    
    // Add block to blocks storage
    blocks[newBlockId] = newBlock;
    storageService.setItem(StorageKeys.BLOCKS, blocks);
    
    // Update canvas to include this block
    canvasService.updateCanvas(canvasId, {
      blocks: [...canvas.blocks, newBlockId]
    });
    
    return newBlock;
  },

  // Update a block
  updateBlock(blockId, updates) {
    const blocks = storageService.getItem(StorageKeys.BLOCKS) || {};
    const block = blocks[blockId];
    
    if (!block) return null;
    
    const updatedBlock = {
      ...block,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    blocks[blockId] = updatedBlock;
    storageService.setItem(StorageKeys.BLOCKS, blocks);
    
    return updatedBlock;
  },

  // Update block position
  updateBlockPosition(blockId, position) {
    return this.updateBlock(blockId, { position });
  },

  // Highlight a block for agent focus
  highlightBlock(blockId, highlighted = true) {
    const blocks = storageService.getItem(StorageKeys.BLOCKS) || {};
    
    // Reset all highlights in the same canvas
    if (highlighted && blocks[blockId]) {
      const canvasId = blocks[blockId].canvasId;
      Object.keys(blocks).forEach(id => {
        if (blocks[id].canvasId === canvasId) {
          blocks[id].highlighted = false;
        }
      });
    }
    
    // Set the highlight for this block
    if (blocks[blockId]) {
      blocks[blockId].highlighted = highlighted;
      blocks[blockId].updatedAt = new Date().toISOString();
      storageService.setItem(StorageKeys.BLOCKS, blocks);
    }
    
    return blocks[blockId] || null;
  },

  // Delete a block
  deleteBlock(blockId) {
    const blocks = storageService.getItem(StorageKeys.BLOCKS) || {};
    const block = blocks[blockId];
    
    if (!block) return false;
    
    // Remove from blocks storage
    delete blocks[blockId];
    storageService.setItem(StorageKeys.BLOCKS, blocks);
    
    // Remove from canvas
    const canvas = canvasService.getCanvas(block.canvasId);
    if (canvas) {
      canvasService.updateCanvas(block.canvasId, {
        blocks: canvas.blocks.filter(id => id !== blockId)
      });
    }
    
    return true;
  }
};