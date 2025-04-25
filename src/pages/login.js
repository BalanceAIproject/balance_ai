import React from "react";
import './login.css';
import { useNavigate } from 'react-router-dom';



function Login () {
    const navigate = useNavigate();
    
    return (
        <div className="Loginpage">
            <div>
                <h1>Log In</h1>

                <div className="inputBox">
                    <input type="text" placeholder="Username" className="textiput"></input>
                    <input type="text" placeholder="Password" className="textinput"></input>
                </div>

                {/* <div>
                    <input  type="checkbox" id="rememberMe" 
                            className="checkbox"
                            value={true}/>
                    <label htmlFor="rememberMe">Remember Me</label>
                </div> */}

                <div>
                    <button onClick={() => navigate('/Home')}>Log in</button>
                    <p>Don't have an account? <a href="/signup">Sign up</a></p>
                </div>
            </div>
        </div>
    );
};

export default Login;