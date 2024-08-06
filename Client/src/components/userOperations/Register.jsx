import './Register.css'

import { useRegister } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useForm } from '../../hooks/useForm';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const initialValues = { username: '', email: '', password: '', repeatPassword: '' }

export default function Register() {
    const [error, setError] = useState('');
    const register = useRegister();
    const navigate = useNavigate();

    const registerHandler = async ({ username, email, password, repeatPassword }) => {
        if (password !== repeatPassword) {
            setError('Passwords don\'t match');
            // console.error('Passwords don\'t match');
            return;
        }

        try {
            await register(username, email, password, repeatPassword);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    const { values, changeHandler, submitHandler } = useForm(initialValues, registerHandler);

    return (
        <>
            <form className="register-form" onSubmit={submitHandler}>
                <h1>Register</h1>
                <div>
                    <label className="emaillable" htmlFor="email"></label>
                    <input
                        className="emailinput"
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Username..."
                        value={values.username}
                        onChange={changeHandler}
                    />
                </div>

                <div>
                    <label className="emaillable" htmlFor="email"></label>
                    <input
                        className="emailinput"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Email..."
                        value={values.email}
                        onChange={changeHandler}

                    />
                </div>

                <div>
                    <label className="passwordlable" htmlFor="password"></label>
                    <input
                        className="passwordinput"
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Password..."
                        value={values.password}
                        onChange={changeHandler}

                    />
                </div>

                <div>
                    <label className="passwordlable" htmlFor="repeatPassword"></label>
                    <input
                        className="passwordinput"
                        type="password"
                        id="repeatPassword"
                        name="repeatPassword"
                        placeholder="Repeat Password..."
                        value={values.repeatPassword}
                        onChange={changeHandler}
                    />
                </div>
                {error && <div className="error">{error}</div>}
                <div>
                    <input className="registerbtn" type="submit" value="register"></input>
                    <p >Already have an account? <Link to="/login" className="aelement">Login</Link></p>
                </div>
            </form>
        </>
    );
}