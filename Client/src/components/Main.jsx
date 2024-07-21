import { useState, useEffect } from 'react';

import Home from "./Home";

import recipiesAPI from '../api/recipies-api';
import LatestRecipie from './LatestRecipie';


export default function Main() {
    const [latestRecipie, setLatestRecipie] = useState([]);

    useEffect(() => {
        (async () => {
            //TODO: mod to fetch only latest games
            const result = await recipiesAPI.getALL();

            setLatestRecipie(result.reverse().slice(0, 1));
        })();
    }, []);

    return (
        <>
            <main>
                <Home />
                <h1>Latest Recipie</h1>
                <div className="content">
                    {latestRecipie.length > 0
                        ? latestRecipie.map(data => <LatestRecipie key={data._id} {...data} />)
                        : <div className="missing-recipies"><h2>No recipies available</h2></div>}
                </div>
            </main>
        </>
    );
}