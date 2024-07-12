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
                    <li><a className="navbutton" href="/" >Home</a></li>
                    <li><a className="navbutton" href="/recipies" >Recipies</a></li>
                    <li><a className="navbutton" href="/create" >Create</a></li>
                    <li><a className="navbutton" href="/search" >Search</a></li>
                    <li><a className="navbutton" href="/contacts" >Contact</a></li>
                    <li><a className="navbutton" href="/about" >About</a></li>
                    <li><a className="navbutton" href="/register" onClick={handleLogout}>Logout</a></li>
                    <li><a className="profilebutton" href="/profile" >Profile</a></li>
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