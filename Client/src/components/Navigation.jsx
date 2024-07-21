import { Link } from 'react-router-dom';

export default function Navigation() {
    const isLoggedIn = localStorage.length > 0;

    
    if (isLoggedIn) {
        const handleLogout = () => {
            localStorage.clear();
            // Add any additional logout logic here
        };

        return (
            <nav>
                <ul>
                    <li><Link className="navbutton" to="/" >Home</Link></li>
                    <li><Link className="navbutton" to="/recipies" >Recipies</Link></li>
                    <li><Link className="navbutton" to="/create" >Create</Link></li>
                    <li><Link className="navbutton" to="/search" >Search</Link></li>
                    <li><Link className="navbutton" to="/contacts" >Contact</Link></li>
                    <li><Link className="navbutton" to="/about" >About</Link></li>
                    <li><Link className="navbutton" to="/register" onClick={handleLogout}>Logout</Link></li>
                    <li><Link className="profilebutton" to="/profile" >Profile</Link></li>
                </ul>
            </nav>
        );
    } else {
        return (
            <nav>
                <ul>
                    <li><a className="navbutton" href="/" >Home</a></li>
                    <li><a className="navbutton" href="/login" >Login</a></li>
                    <li><a className="navbutton" href="/register" >Register</a></li>
                    <li><a className="navbutton" href="/contacts" >Contact</a></li>
                    <li><a className="navbutton" href="/about" >About</a></li>
                </ul>
            </nav>
        );
    }
    // return (
    //     <nav>
    //         <ul>
    //             <li><a className="navbutton" href="/" >Home</a></li>
    //             <li><a className="navbutton" href="/recipies" >Recipies</a></li>
    //             <li><a className="navbutton" href="/contacts" >Contact</a></li>
    //             <li><a className="navbutton" href="/about" >About</a></li>
    //             <li><a className="navbutton" href="/login" >Login</a></li>
    //             <li><a className="navbutton" href="/register" >Register</a></li>
    //             <li><a className="navbutton" href="/register" >Logout</a></li>
    //             <li><a className="navbutton" href="/create" >Create</a></li>
    //         </ul>
    //     </nav>
    // );
}