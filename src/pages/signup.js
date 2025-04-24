import React from "react";
import './signup.css'



function Signup (){
    return (
        <div className="Loginpage">
            <div>
                <h1>Sign Up</h1>
                <div className="inputBox">
                    <input type="text" placeholder="Username"></input>
                    <input type="text" placeholder="Password"></input>
                    <input type="text" placeholder="Confirm Password"></input>
                </div>

                <div>
                    
                </div>
            </div>
        </div>
    );
};

export default Signup;