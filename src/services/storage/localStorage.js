const PREFIX = 'imagination_canvas_';

export const StorageKeys = {
  CANVASES: `${PREFIX}canvases`,
  BLOCKS: `${PREFIX}blocks`,
  USER: `${PREFIX}user`,
  AGENT_CONTEXT: `${PREFIX}agent_context`,
};

export const storageService = {
  // Get item from localStorage with automatic parsing
  getItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  },

  // Set item in localStorage with automatic stringification
  setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error);
      return false;
    }
  },

  // Remove item from localStorage
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
      return false;
    }
  },
};