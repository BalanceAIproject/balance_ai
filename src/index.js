import React from 'react';
import reportWebVitals from './reportWebVitals';
import './index.css';
import ReactDOM from 'react-dom/client';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Home from './pages/Home';
import Greet from './pages/Greet';
import Login from './pages/log in/login';
import Signup from './pages/sign up/signup';
import Forgot from './pages/Forgot';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { AppProvider } from './context/AppContext';
import Chat from './pages/chat';

export default function App() {
  return(
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Greet />}/>
          <Route path='/chat' element={<Chat />}/>
          <Route path='/Home' element={<Home />}/>
          <Route path='/forgotpassword' element={<Forgot />}/>
          <Route path='/login' element={<Login />}/>
          <Route path='/signup' element={<Signup />}/>
        </Routes>
      </BrowserRouter>
    </AppProvider>
=======
=======
>>>>>>> Stashed changes

export default function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Greet />}/>
        <Route path='/forgotpassword' element={<Forgot />} />;
        <Route path='/Home' element={<Home />}/>
        <Route path='/login' element={<Login />}/>
        <Route path='/signup' element={<Signup />}/>
      </Routes>
    </BrowserRouter>
>>>>>>> Stashed changes
  )
};


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