import './Forgot.css';
import React from 'react';



function Forgot() {

    return (
        <div className='backdropP'>
            <h1>No worries, we are here to help</h1>

            <div className='inputBox'>
                <input type="text" placeholder="Enter Email"></input>
            </div>

            <div>
                <button>send code</button>
            </div>

        </div>
    );

};

export default Forgot;