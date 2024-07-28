import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Navigation() {
    const { isAuthenticated } = useContext(AuthContext);


    return (
        <nav>
            {isAuthenticated
                ? (
                    <ul>
                        <li><Link className="navbutton" to="/" >Home</Link></li>
                        <li><Link className="navbutton" to="/recipies" >Recipies</Link></li>
                        <li><Link className="navbutton" to="/create" >Create</Link></li>
                        <li><Link className="navbutton" to="/search" >Search</Link></li>
                        <li><Link className="navbutton" to="/contacts" >Contact</Link></li>
                        <li><Link className="navbutton" to="/about" >About</Link></li>
                        <li><Link className="navbutton" to="/register" >Logout</Link></li>
                        <li><Link className="profilebutton" to="/profile" >Profile</Link></li>
                    </ul>
                ) : (
                    <ul>
                        <li><Link className="navbutton" to="/" >Home</Link></li>
                        <li><Link className="navbutton" to="/login" >Login</Link></li>
                        <li><Link className="navbutton" to="/register" >Register</Link></li>
                        <li><Link className="navbutton" to="/contacts" >Contact</Link></li>
                        <li><Link className="navbutton" to="/about" >About</Link></li>
                    </ul>
                )}
        </nav>
    );
}