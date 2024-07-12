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
                setRecipies(data);
                // console.log(data);
            });
    }, []);

    return (
        <>
            <main>
                <Home />
                <div className="content">
                    <h2>Featured Recipes</h2>
                    {recipies.map(recipie => <Recipie
                        key={recipie._id}
                        name={recipie.name}
                        img={recipie.image}
                        description={recipie.description}
                    />)}
                </div>
                <>
                    <About />
                    <Contacts />
                </>
            </main>
        </>
    );
}