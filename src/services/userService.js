import { storageService, StorageKeys } from './storage/localStorage';

export const userService = {
  // Register a new user
  register(username, password) {
    const users = storageService.getItem(StorageKeys.USER) || { users: [] };
    
    // Check if user already exists
    if (users.users.some(user => user.username === username)) {
      return { success: false, message: 'Username already exists' };
    }
    
    const newUser = {
      id: Date.now().toString(),
      username,
      password, // In a real app, never store plain text passwords
      createdAt: new Date().toISOString(),
    };
    
    users.users.push(newUser);
    storageService.setItem(StorageKeys.USER, users);
    
    // Set current user (log them in)
    this.setCurrentUser(newUser);
    
    return { success: true, user: { ...newUser, password: undefined } };
  },

  // Login a user
  login(username, password) {
    const users = storageService.getItem(StorageKeys.USER) || { users: [] };
    
    const user = users.users.find(
      user => user.username === username && user.password === password
    );
    
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }
    
    // Set current user
    this.setCurrentUser(user);
    
    return { success: true, user: { ...user, password: undefined } };
  },

  // Logout the current user
  logout() {
    storageService.removeItem(StorageKeys.USER + '_current');
    return { success: true };
  },

  // Get the current logged in user
  getCurrentUser() {
    const currentUser = storageService.getItem(StorageKeys.USER + '_current');
    return currentUser ? { ...currentUser, password: undefined } : null;
  },

  // Set the current user (private method)
  setCurrentUser(user) {
    storageService.setItem(StorageKeys.USER + '_current', user);
  }
};