import "./Profile.css";

export default function Profile() {
    return (
        <div className="profilecontainer">
            <h1>Profile</h1>
            <p>Username: {localStorage.getItem('username')}</p>
            <p>Email: {localStorage.getItem('email')}</p>

        </div>
    );
}