import { useForm } from '../../hooks/useForm';
import './Login.css';
import { useLogin } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const initialValues = { email: '', password: '' }

export default function Login() {
    const login = useLogin();
    const navigate = useNavigate();

    const loginHandler = async ({ email, password }) => {
        try {
            await login(email, password)
            navigate('/');
        } catch (err) {
            console.error(err.message);
        }
    };

    const { values, changeHandler, submitHandler } = useForm(initialValues, loginHandler);


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
                    <p>Dont have an account? <Link to="/register" className="aelement">Register</Link></p>
                </form>
            </div>
        </>
    );
}