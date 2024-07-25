import { useForm } from '../hooks/useForm';
import './Login.css';
import { useLogin } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const login = useLogin();
    const navigate = useNavigate();
    const { values, changeHandler, submitHandler } = useForm(
        { email: '', password: '' },
        async ({ email, password }) => {
            try {
                await login(email, password)
                navigate('/');
            } catch (err){
                console.error(err.message);
            }
        }
    );


    return (
        <>
            <div className="login">
                <h1>Login</h1>
                <form onSubmit={submitHandler}>
                    <label className="userlable" htmlFor="email">Email:</label>
                    <input
                        className="userinput"
                        type="text"
                        id="email"
                        name="email"
                        value={values.email}
                        onChange={changeHandler}
                        required placeholder='...'
                    />
                    <label className="passwordlable" htmlFor="password">Password:</label>
                    <input
                        className="passwordinput"
                        type="password"
                        id="password"
                        name="password"
                        value={values.password}
                        onChange={changeHandler}
                        required placeholder='...'
                    />
                    <input className="loginbtn" type="submit" value="Login" />
                    <p>Dont have an account? <a className="aelement" href="/register">Register</a></p>
                </form>
            </div>
        </>
    );
}