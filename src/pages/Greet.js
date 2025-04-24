import './Greet.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';


function Greet () {
    const navigate = useNavigate();
    return (
        <body className='greetpage'>

            <div>
                <h1>Imagination Canvas</h1>
            </div>
            <div>
                <h3>Brough to you by: Balnce.ai</h3>
            </div>

            <div className='buttons'>
                <button onClick={() => navigate('/login')}>Log In</button>
                <button onClick={() => navigate('/signup')}>Sign Up</button>
            </div>

        </body>
    );
};

export default Greet;