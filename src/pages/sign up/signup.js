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
            navigate('/canvas');
        }
    };

    return (
        <div className="backdrop">
            <div>
                <h1>Sign Up</h1>

                {state.error && <p className="error-message">{state.error}</p>}
                {localError && <p className="error-message">{localError}</p>}

                <div className="inputBoxS">
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

                    <div className="password-container">
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            aria-label="Confirm Password"
                        />
                    </div>
                </div>
            </div>

            <div className="signupB">
                <button onClick={handleSignup} disabled={state.isLoading}>
                    {state.isLoading ? 'Signing up...' : 'Sign up'}
                </button>
                <div className="login-link">
                    Already have an account? <a href="/login">Log in</a>
                </div>
            </div>
        </div>
    );
}

export default Signup;