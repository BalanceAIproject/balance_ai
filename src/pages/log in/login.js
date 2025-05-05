import React, { useState } from "react";
import './login.css';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext'; // Import context

function Login () {
    const navigate = useNavigate();
    const { loginUser, state } = useAppContext(); // Get login function and state from context
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // You might want state for 'remember me' if implementing that feature

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent default form submission if it were a form
        const success = await loginUser(username, password);
        if (success) {
            // Navigate to the main canvas page on successful login
            navigate('/canvas');
        }
        // Error message is handled by AppContext and displayed below
    };

    return (
        <div className="backdrop">
            <h1>Log In</h1>

            {/* Display error message if login fails */}
            {state.error && <p className="error-message">{state.error}</p>}

            <div className="inputBoxL">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-label="Username" // Added for accessibility
                />
                <input
                    type="password" // Use password type for security
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="Password" // Added for accessibility
                />
            </div>

            <div className="remember">
                 {/* Remember Me checkbox - functionality not fully implemented */}
                <div className="left">
                    <input type="checkbox" id="rememberMe" />
                    <label htmlFor="rememberMe">Remember Me</label>
                </div>

                <div className="right">
                    <a href="/forgotpassword">Forgot Password?</a>
                </div>
            </div>

            <div className="loginB">
                 {/* Disable button while loading state is active */}
                <button onClick={handleLogin} disabled={state.isLoading}>
                    {state.isLoading ? 'Logging in...' : 'Log in'}
                </button>
                <p>Don't have an account? <a href="/signup">Sign up</a></p>
            </div>
        </div>
    );
};

export default Login;