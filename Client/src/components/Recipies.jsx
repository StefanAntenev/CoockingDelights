import './Recipies.css';

import { useState, useEffect } from 'react';

import Recipie from "./Recipie";

export default function Recipies() {
    const [recipies, setRecipies] = useState([]);
    useEffect(() => {
        fetch('http://localhost:3030/jsonstore/recipies')
            .then(response => response.json())
            .then(result => {
            const data = Object.values(result);
            setRecipies(data);
            });
    }, []);

    return (
        <>
            <main>
                    <h2>All Recipies</h2>
                <div className="content">
                    {recipies.map(data => <Recipie
                        key={data._id}
                        name={data.name}
                        img={data.image}
                        // description={data.description}
                        />)}
                </div>
            </main>
        </>
    );
}