import './Login.css';

export default function Login() {

    const handleSubmit = (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        fetch('http://localhost:3030/jsonstore/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        })
            .then(response => response.json())
            .then(data => {
                // Handle the response from the server
                console.log('Server response:', data);
                localStorage.setItem('email', data.email);
                localStorage.setItem('password', data.password);
                localStorage.setItem('username', data.username);
                localStorage.setItem('id', data._id);
                window.location.pathname = '/';
            })
            .catch(error => {
                // Handle any errors that occurred during the request
                console.error('Error:', error);
            });
    }

    return (
        <>
            <div className="login">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <label className="userlable" htmlFor="email">Email:</label>
                    <input className="userinput" type="text" id="email" name="email" required placeholder='...' />
                    <label className="passwordlable" htmlFor="password">Password:</label>
                    <input className="passwordinput" type="password" id="password" name="password" required placeholder='...' />
                    <button className="loginbtn" type="submit">Login</button>
                    <p>Dont have an account? <a className="aelement" href="/register">Register</a></p>
                </form>
            </div>
        </>
    );
}