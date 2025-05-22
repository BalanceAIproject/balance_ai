import './signup.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

function Signup() {
    const navigate = useNavigate();
    const { registerUser, state } = useAppContext();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (!username || !password || !confirmPassword) {
            setLocalError("All fields are required.");
            return;
        }
        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }
        const success = await registerUser(username, password);
        if (success) {
            navigate('/userprofile');
        }
    };

    return (
        <div className="backdrop">
            <h1>Sign Up</h1>
            <form onSubmit={handleSignup} className="inputBoxL">
                <div className="username-container">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="password-container">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="password-container">
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                {state.error && <div className="error-message">{state.error}</div>}
                {localError && <div className="error-message">{localError}</div>}

                <div className="signupB">
                    <button type="submit">Create Account</button>
                </div>

                <div className="signup-link">
                    Already have an account? <a href="/login">Login</a>
                </div>
            </form>
        </div>
    );
}

export default Signup;