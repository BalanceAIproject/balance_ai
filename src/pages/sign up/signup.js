import './signup.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Signup (){
    const navigate = useNavigate();

    return (
        <div className="backdrop">
            <div>
                <h1>Sign Up</h1>
                <div className="inputBoxS">
                    <input type="text" placeholder="Username"></input>
                    <input type="text" placeholder="Password"></input>
                    <input type="text" placeholder="Confirm Password"></input>
                 </div>
            </div>

            <div className="signupB">
                <button onClick={() => navigate('/Home')}>Sign up</button>
                <p>Already have an account? <a href="/login">Log in</a></p>
            </div>
        </div>
    );
};

export default Signup;