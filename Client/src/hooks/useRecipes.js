import { useEffect, useState } from 'react';

import recipieAPI from '../api/recipies-api';

export function useGetAllRecipes() {
    const [recipes, setRecipes] = useState([]);

    useEffect(() => {
        (async () => {
            const result = await recipieAPI.getALL();

            setRecipes(result);
        })();
    }, []);

    return [recipes, setRecipes];
}

export function useGetOneRecipe(recipieId) {
    const [recipie, setRecipie] = useState({});

    useEffect(() => {
        (async () => {
            const result = await recipieAPI.getOne(recipieId);

            setRecipie(result);
        })();
    }, [recipieId]);

    return [
        recipie,
        setRecipie
    ];
}