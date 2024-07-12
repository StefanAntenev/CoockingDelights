import './Login.css';

export default function Login() {
    return (
        <>
            <div className="login">
                <h1>Login</h1>
                <form>
                    <label className="userlable" htmlFor="email">Email:</label>
                    <input className="userinput" type="text" id="email" name="email" required placeholder='...'/>
                    <label className="passwordlable" htmlFor="password">Password:</label>
                    <input className="passwordinput" type="password" id="password" name="password" required placeholder='...'/>
                    <button className="loginbtn" type="submit">Login</button>
                <p >Dont have an account? <a className="aelement" href="/register">Register</a></p>

                </form>
            </div>
        </>
    );
}