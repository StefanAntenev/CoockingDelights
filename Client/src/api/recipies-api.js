import * as requester from './requester';

const BASE_URL = 'http://localhost:3030/jsonstore/recipies'

export const getALL = async () => {
    const result = await requester.get(BASE_URL);
    
    const recipies = Object.values(result);

    return recipies;
};