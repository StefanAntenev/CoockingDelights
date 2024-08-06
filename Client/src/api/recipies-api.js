import * as requester from './requester';

const BASE_URL = 'http://localhost:3030/data/recipies'

export const getALL = async () => {
    const result = await requester.get(BASE_URL);
    
    const recipies = Object.values(result);

    return recipies;
};

export const getOne = (recipieId) => requester.get(`${BASE_URL}/${recipieId}`);

export const create = (recipeData) => requester.post(`${BASE_URL}`, recipeData);

export const remove = (recipieId) => requester.del(`${BASE_URL}/${recipieId}`);

export const update = (recipieId, recipeData) => requester.put(`${BASE_URL}/${recipieId}`, recipeData);

const recipieAPI = {
    getALL,
    getOne,
    create,
    remove,
    update
};

export default recipieAPI;