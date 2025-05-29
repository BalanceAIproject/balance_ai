import React, { useState } from "react";
import './login.css';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

function Login() {
    const navigate = useNavigate();
    const { loginUser, state } = useAppContext();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);

    const handleLogin = async (e) => {
        e.preventDefault();
        const success = await loginUser(username, password, rememberMe);
        if (success) {
            navigate('/userprofile');
        }
    };

    return (
        <div className="backdrop">
            <div>
                <h1>Log In</h1>

                {state.error && <p className="error-message">{state.error}</p>}

                <div className="inputBoxL">
                    <div className="username-container">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            aria-label="Username"
                        />
                    </div>

                    <div className="password-container">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-label="Password"
                        />
                    </div>
                </div>

                <div className="remember">
                    <div className="left">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="rememberMe">Remember me</label>
                    </div>
                    <div className="right">
                        <a href="/forgotpassword">Forgot password?</a>
                    </div>
                </div>
            </div>

            {/* Fixing spacing and vertical stacking */}
            <div className="login-section">
                <button
                    onClick={handleLogin}
                    disabled={state.isLoading}
                >
                    {state.isLoading ? 'Logging in...' : 'Log In'}
                </button>
                <div className="signup-link">
                    Don't have an account? <a href="/signup">Sign Up</a>
                </div>
            </div>
        </div>
    );
}

export default Login;