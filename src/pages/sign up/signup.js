import './signup.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext'; // Import context

function Signup (){
    const navigate = useNavigate();
    const { registerUser, state } = useAppContext(); // Get register function and state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState(''); // For password mismatch or empty fields

    const handleSignup = async (e) => {
        e.preventDefault(); // Prevent default form submission if it were a form
        setLocalError(''); // Clear local errors on new attempt

        // Basic client-side validation
        if (!username || !password || !confirmPassword) {
            setLocalError("All fields are required.");
            return;
        }
        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }

        // Call the register function from context
        const success = await registerUser(username, password);
        if (success) {
            // Navigate to the main canvas page on successful registration
            navigate('/canvas');
        }
        // Global errors (like username exists) are handled by AppContext and displayed below
    };

    return (
        <div className="backdrop">
            <div>
                <h1>Sign Up</h1>

                {/* Display global error from context */}
                 {state.error && <p className="error-message">{state.error}</p>}
                 {/* Display local error */}
                 {localError && <p className="error-message">{localError}</p>}

                <div className="inputBoxS">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        aria-label="Username" // Added for accessibility
                    />
                    <input
                        type="password" // Use password type
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-label="Password" // Added for accessibility
                     />
                    <input
                        type="password" // Use password type
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        aria-label="Confirm Password" // Added for accessibility
                    />
                 </div>
            </div>

            <div className="signupB">
                 {/* Disable button while loading state is active */}
                <button onClick={handleSignup} disabled={state.isLoading}>
                     {state.isLoading ? 'Signing up...' : 'Sign up'}
                </button>
                <p>Already have an account? <a href="/login">Log in</a></p>
            </div>
        </div>
    );
};

export default Signup;