import React from "react";
import './login.css';
import { useNavigate } from 'react-router-dom';



function Login () {
    const navigate = useNavigate();
    
    return (
        <div className="backdrop">

                <h1>Log In</h1>

                <div className="inputBoxL">
                    <input type="text" placeholder="Username"></input>
                    <input type="text" placeholder="Password"></input>
                </div>

                <div className="remember">
                    <div className="left">
                        <input type="checkbox" id="rememberMe" value={true}/>
                        <label htmlFor="rememberMe">Remember Me</label>
                    </div>

                    <div className="right">
                        <a href="/forgotpassword">Forgot Password?</a>
                    </div>
                </div>

                <div className="loginB">
                    <button onClick={() => navigate('/Home')}>Log in</button>
                    <p>Don't have an account? <a href="/signup">Sign up</a></p>
                </div>
        </div>
    );
};

export default Login;