import './Greet.css';
import React from 'react';

function Greet () {
    return (
        <body className='greetpage'>

            <div>
                <h1>Imagination Canvas</h1>
            </div>
            <div>
                <h3>Brough to you by: Balance.ai</h3>
            </div>

            <div className='buttons'>
                <button href="/login">Log In</button>
                <button href="/signup">Sign Up</button>
            </div>

        </body>
    );
};

export default Greet;