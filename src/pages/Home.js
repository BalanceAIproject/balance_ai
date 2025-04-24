import './Home.css';
import React from 'react';


function Home() {
  return (
    <div>

      <div className='navbar'>
        <a href='/'>Home</a>
        <a href='/About'>About</a>
        <a href='/login'>Log in</a>
      </div>

      <div>
        THIS IS THE HOMEPAGE
      </div>

    </div>
  );
};

export default Home;
