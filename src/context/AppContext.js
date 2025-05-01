import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { userService } from '../services/userService';

// Initial state
const initialState = {
  user: null,
  currentCanvas: null,
  isLoading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  SET_CURRENT_CANVAS: 'SET_CURRENT_CANVAS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return { ...state, user: action.payload };
    case ActionTypes.SET_CURRENT_CANVAS:
      return { ...state, currentCanvas: action.payload };
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load current user on initial render
  useEffect(() => {
    const currentUser = userService.getCurrentUser();
    if (currentUser) {
      dispatch({ type: ActionTypes.SET_USER, payload: currentUser });
    }
  }, []);

  // Context value
  const value = {
    state,
    dispatch,
    // Action creators
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    setCurrentCanvas: (canvas) => dispatch({ type: ActionTypes.SET_CURRENT_CANVAS, payload: canvas }),
    setLoading: (isLoading) => dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
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