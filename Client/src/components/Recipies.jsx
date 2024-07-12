import { useState, useEffect } from 'react';

import Home from "./Home";
import Recipie from "./Recipie";
import Contacts from './Contacts';
import About from './About';

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
                <div className="content">
                    <h2>Latest Recipie</h2>
                    {recipies.map(data => <Recipie
                        key={data._id}
                        name={data.name}
                        img={data.image}
                        description={data.description}
                    />)}
                </div>
            </main>
        </>
    );
}