import { useState, useEffect } from 'react';

import Home from "./Home";
import Recipie from "./Recipie";
import Contacts from './Contacts';
import About from './About';

export default function Main() {

    const [recipies, setRecipies] = useState([]);
    useEffect(() => {
        fetch('http://localhost:3030/jsonstore/recipies')
            .then(response => response.json())
            .then(result => {
                const data = Object.values(result);
                const lastAddedRecipe = data[data.length - 1];
                setRecipies([lastAddedRecipe]);
            });
    }, []);

    return (
        <>
            <main>
                <Home />
                    <h1>Latest Recipie</h1>
                <div className="content">
                    {recipies.map(recipie => <Recipie
                        key={recipie._id}
                        name={recipie.name}
                        img={recipie.image}
                        description={recipie.description}
                    />)}
                </div>
            </main>
        </>
    );
}