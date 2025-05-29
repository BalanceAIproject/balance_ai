import './Forgot.css';
import React from 'react';

function Forgot() {
    const handleSubmit = (e) => {
        e.preventDefault();
        // Add logic for sending the code here
        console.log('Send code clicked');
    };

    return (
        <div className="backdropP">
            <div className="forgot-container">
                <h1>Forgot Password?</h1>
                <p className="subtext">
                    Enter the email associated with your account, and we’ll send you a code to reset your password.
                </p>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="email" className="visually-hidden">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        placeholder="Enter Email"
                        required
                    />
                    <button type="submit">Send Code</button>
                </form>

                <p className="login-redirect">
                    Remember your password? <a href="/login">Back to login</a>
                </p>
            </div>
        </div>
    );
}

export default Forgot;