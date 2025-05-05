import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { userService } from '../services/userService';
import { storageService, StorageKeys } from '../services/storage/localStorage'; // Import storageService

// Initial state
const initialState = {
  user: null, // Stores the logged-in user object { id, username, createdAt }
  currentCanvas: null,
  isLoading: false,
  error: null,
};

// Action types
export const ActionTypes = { // Export ActionTypes
  SET_USER: 'SET_USER',
  CLEAR_USER: 'CLEAR_USER', // Added for logout
  SET_CURRENT_CANVAS: 'SET_CURRENT_CANVAS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR', // Added to clear errors
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload, error: null }; // Clear error on successful login/user set
    case ActionTypes.CLEAR_USER:
        return { ...state, user: null }; // Clear user on logout
    case ActionTypes.SET_CURRENT_CANVAS:
      return { ...state, currentCanvas: action.payload };
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false }; // Stop loading on error
    case ActionTypes.CLEAR_ERROR:
        return { ...state, error: null };
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load current user from storage on initial render
  useEffect(() => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    const storedUser = storageService.getItem(StorageKeys.CURRENT_USER);
    if (storedUser) {
      // Basic validation: check if essential fields exist
      if (storedUser.id && storedUser.username) {
         dispatch({ type: ActionTypes.SET_USER, payload: storedUser });
      } else {
         console.warn("Stored user data is invalid. Clearing.");
         storageService.removeItem(StorageKeys.CURRENT_USER);
      }
    }
    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
  }, []); // Run only once on mount

  // Context value
  const value = {
    state,
    dispatch,
    // Action creators for components to use
    loginUser: async (username, password) => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        dispatch({ type: ActionTypes.CLEAR_ERROR }); // Clear previous errors
        const result = userService.login(username, password);
        if (result.success) {
            dispatch({ type: ActionTypes.SET_USER, payload: result.user });
        } else {
            dispatch({ type: ActionTypes.SET_ERROR, payload: result.message });
        }
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        return result.success; // Return success status for navigation
    },
    registerUser: async (username, password) => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        dispatch({ type: ActionTypes.CLEAR_ERROR });
        const result = userService.register(username, password);
        if (result.success) {
            dispatch({ type: ActionTypes.SET_USER, payload: result.user });
        } else {
            dispatch({ type: ActionTypes.SET_ERROR, payload: result.message });
        }
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
        return result.success;
    },
    logoutUser: () => {
        userService.logout();
        dispatch({ type: ActionTypes.CLEAR_USER });
        dispatch({ type: ActionTypes.SET_CURRENT_CANVAS, payload: null }); // Clear canvas on logout
    },
    setCurrentCanvas: (canvas) => dispatch({ type: ActionTypes.SET_CURRENT_CANVAS, payload: canvas }),
    setLoading: (isLoading) => dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use the app context
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}