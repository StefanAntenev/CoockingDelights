import './Recipies.css';

import { useState, useEffect } from 'react';
import * as recipiesAPI from '../api/recipies-api';

import Recipie from "./Recipie";

export default function Recipies() {
    const [recipies, setRecipies] = useState([]);

    useEffect(() => {
        recipiesAPI.getALL()
            .then(recipies => setRecipies(recipies));
    }, []);

    return (
        <>
            <main>
                <h1>All Recipes</h1>
                <div className="content">
                    {recipies.length > 0
                        ? recipies.map(data => <Recipie kye={data._id} {...data} />)
                        : <div className="missing-recipies"><h2>No recipes available</h2></div>
                    }
                </div>
            </main>
        </>
    );
}