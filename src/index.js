import React from 'react';
import reportWebVitals from './reportWebVitals';
import './index.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Greet from './pages/Greet';
import Login from './pages/log in/login';
import Signup from './pages/sign up/signup';
import Forgot from './pages/Forgot';
import CanvasPage from './pages/CanvasPage'; // Import the Canvas Page

import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Existing Routes */}
          <Route path='/' element={<Greet />} />
          <Route path='/Home' element={<Home />} />
          <Route path='/forgotpassword' element={<Forgot />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />

          {/* Canvas Routes */}
          {/* Route for specific canvas ID */}
          <Route path='/canvas/:canvasId' element={<CanvasPage />} />
          {/* Route for general /canvas path (will determine default canvas) */}
          <Route path='/canvas' element={<CanvasPage />} />

          {/* Optional: Add a catch-all route for debugging if needed */}
          {/* <Route path="*" element={<div>404 - Route Not Found</div>} /> */}

        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();