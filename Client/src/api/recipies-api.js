import * as requester from './requester';

const BASE_URL = 'http://localhost:3030/jsonstore/recipies'

export const getALL = async () => {
    const result = await requester.get(BASE_URL);
    
    const recipies = Object.values(result);

    return recipies;
};

export const getOne = (recipieId) => requester.get(`${BASE_URL}/${recipieId}`)

export const create = (recipeData) => requester.post(`${BASE_URL}`, recipeData);

const recipieAPI = {
    getALL,
    getOne,
    create
};

export default recipieAPI;