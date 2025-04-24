import './navigation.css';
import { Outlet, Link } from "react-router-dom";

const navigation = () => {
  return (
  <div className='navbar'>
    <a Link to="/">Home</a>
    <a Link to="/About">About</a>
    <Outlet />
  </div>
  );
};

export default navigation;