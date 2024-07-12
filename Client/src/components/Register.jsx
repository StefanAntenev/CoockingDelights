import './Register.css'

import React, { useState } from 'react';

export default function Register() {
    const [email, setName] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    const handleRegisterSubmit = (event) => {
        event.preventDefault();
        // Access the form data here (email, password, repeatPassword)
        console.log('Email:', email);
        console.log('Password', password);
        console.log('Repeat Password', repeatPassword);
        // Form data, sending it to a server
        
        if (email === '' || password === '' || repeatPassword === '') {
            throw new Error('All fields must be filled');
        }

        if (password !== repeatPassword) {
            throw new Error('Passwords do not match');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        fetch('http://localhost:3030/jsonstore/users', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, repeatPassword }),
        })
            .then(response => response.json())
            .then(data => {
            // Handle the response from the server
            console.log('Server response:', data);
            })
            .catch(error => {
            // Handle any errors that occurred during the request
            console.error('Error:', error);
            });
    };


    return (
        <>
            <form className="register-form" onSubmit={handleRegisterSubmit}>
            <h1>Register</h1>
                <div>
                    <label className="emaillable" htmlFor="email"></label>
                    <input
                        className="emailinput"
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Email..."
                        value={email}
                        onChange={(event) => setName(event.target.value)}
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
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
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
                        value={repeatPassword}
                        onChange={(event) => setRepeatPassword(event.target.value)}
                    />
                </div>

                <button className="registerbtn" type="submit">Register</button>
                <p >Already have an account? <a className="aelement" href="/login">Login</a></p>
            </form>
        </>
    );
}