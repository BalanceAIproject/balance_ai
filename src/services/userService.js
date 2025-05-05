import { v4 as uuidv4 } from 'uuid'; // Import uuid
import { storageService, StorageKeys } from './storage/localStorage';

// Default test user credentials
const DEFAULT_USERNAME = 'testuser';
const DEFAULT_PASSWORD = 'password123';

// Function to ensure the default user exists
const ensureDefaultUser = () => {
  const usersData = storageService.getItem(StorageKeys.USERS) || { users: [] };
  const userExists = usersData.users.some(user => user.username === DEFAULT_USERNAME);

  if (!userExists) {
    console.log('Default user not found, creating...');
    const defaultUser = {
      id: uuidv4(), // Use uuid for ID generation
      username: DEFAULT_USERNAME,
      password: DEFAULT_PASSWORD, // In a real app, hash this password
      createdAt: new Date().toISOString(),
    };
    usersData.users.push(defaultUser);
    storageService.setItem(StorageKeys.USERS, usersData);
    console.log('Default user created:', DEFAULT_USERNAME);
  } else {
    console.log('Default user already exists.');
  }
};

// Ensure the default user exists when the service is loaded
ensureDefaultUser();


export const userService = {
  // Register a new user
  register(username, password) {
    const usersData = storageService.getItem(StorageKeys.USERS) || { users: [] };

    // Check if user already exists
    if (usersData.users.some(user => user.username === username)) {
      return { success: false, message: 'Username already exists' };
    }

    const newUser = {
      id: uuidv4(), // Use uuid
      username,
      password, // In a real app, never store plain text passwords - HASH THEM!
      createdAt: new Date().toISOString(),
    };

    usersData.users.push(newUser);
    storageService.setItem(StorageKeys.USERS, usersData);

    // Set current user (log them in automatically after registration)
    this.setCurrentUser(newUser);

    // Return user object without password
    const { password: removedPassword, ...userToReturn } = newUser;
    return { success: true, user: userToReturn };
  },

  // Login a user
  login(username, password) {
    const usersData = storageService.getItem(StorageKeys.USERS) || { users: [] };

    const user = usersData.users.find(
      u => u.username === username && u.password === password // Compare plain text - NOT SECURE FOR PRODUCTION
    );

    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }

    // Set current user in storage
    this.setCurrentUser(user);

    // Return user object without password
    const { password: removedPassword, ...userToReturn } = user;
    return { success: true, user: userToReturn };
  },

  // Logout the current user
  logout() {
    storageService.removeItem(StorageKeys.CURRENT_USER); // Use dedicated key
    return { success: true };
  },

  // Get the current logged in user
  getCurrentUser() {
    const currentUser = storageService.getItem(StorageKeys.CURRENT_USER);
    // Return user object without password if found
    if (currentUser) {
        const { password, ...userToReturn } = currentUser;
        return userToReturn;
    }
    return null;
  },

  // Set the current user in storage
  setCurrentUser(user) {
    // Store user object without password
    const { password, ...userToStore } = user;
    storageService.setItem(StorageKeys.CURRENT_USER, userToStore);
  }
};