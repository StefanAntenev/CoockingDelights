import Create from './Create';

export default function Navigation() {


    return (
        <nav>
            <ul>
                <li><a className= "navbutton" href="/" onClick={(e) => e.preventDefault()}>Home</a></li>
                <li><a className= "navbutton" href="/recipies" onClick={(e) => e.preventDefault()}>Recipies</a></li>
                <li><a className= "navbutton" href="/contact" onClick={(e) => e.preventDefault()}>Contact</a></li>
                <li><a className= "navbutton" href="/about" onClick={(e) => e.preventDefault()}>About</a></li>
                <li><a className= "navbutton" href="/login" onClick={(e) => e.preventDefault()}>Login</a></li>
                <li><a className= "navbutton" href="/register" onClick={(e) => e.preventDefault()}>Register</a></li>
                <li><a className= "navbutton" href="/register" onClick={(e) => e.preventDefault()}>Logout</a></li>
                <li><a className= "navbutton" href="/create" onClick={(e) => e.preventDefault()}>Create</a></li>
            </ul>
        </nav>
    );
}