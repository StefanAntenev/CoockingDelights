import React, { useState } from 'react';
import './Create.css';

export default function Create() {
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        // Access the form data here (name, image, description)
        console.log('Name:', name);
        console.log('Image:', image);
        console.log('Description:', description);
        // Form data, sending it to a server
        fetch('http://localhost:3030/jsonstore/recipies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, image, description }),
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
            <div className="create-form">
            <h1>Add your recipe</h1>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                    <label htmlFor="image">Image</label>
                    <input
                        type="text"
                        id="image"
                        name="image"
                        placeholder="Image URL"
                        value={image}
                        onChange={(event) => setImage(event.target.value)}
                    />
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    ></textarea>
                    <button className="btnCreate" type="submit">Create</button>
                </form>
            </div>
        </>
    );
}