import './Greet.css';
import { useNavigate } from 'react-router-dom';


function Greet () {

    const navigate = useNavigate();

    return (
        <div className='backdrop'>

            <div>
                <h1>Imagination Canvas</h1>
                <h3>Brough to you by: Balnce.ai</h3>
            </div>

            <div className='space'></div>

            <div className='buttons'>
                <button onClick={() => navigate('./login')}>Log In</button>
                <button onClick={() => navigate('/signup')}>Sign Up</button>
            </div>

        </div>
    );
};

export default Greet;